# ai_engine/rules/toxicite.py
"""
Module d'évaluation du risque toxicologique
Projet IUT Génie Chimique - 1ère année
Approche : IA symbolique basée sur des règles expertes

Logique toxicologique:
- La toxicité représente le danger pour la santé humaine
- Les niveaux sont basés sur les classifications des fiches de données de sécurité (FDS)
- Prise en compte: toxicité aiguë, CMR (cancérogène, mutagène, reprotoxique), corrosivité
- Plus le niveau de toxicité est élevé, plus les précautions doivent être strictes
"""

from config.settings import (
    TOXICITY_SCORES,
    DEFAULT_SCORE,
    DEFAULT_TOXICITY_LEVEL,
    MAX_CATEGORY_SCORE
)
from utils.processor import normalize_text


def evaluate_toxicity(substance_data):
    """
    Évalue le risque toxicologique d'une substance chimique.
    
    Règles expertes basées sur les niveaux de toxicité:
    - TRES_TOXIQUE : CMR cat. 1, toxicité aiguë cat. 1-2 (score ~95)
    - TOXIQUE : Toxique cat. 3, corrosif (score ~70)
    - NOCIF : Nocif, irritant sévère (score ~45)
    - IRRITANT : Irritant modéré (score ~25)
    - PEU_TOXIQUE : Toxicité faible (score ~10)
    - NON_TOXIQUE : Pas de danger identifié (score 0)
    
    Args:
        substance_data (dict): Dictionnaire contenant les données de la substance
                               Clés attendues: 'toxicite', 'nom'
    
    Returns:
        dict: {
            'score': int (0-100),
            'niveau': str,
            'explication': str
        }
    
    Exemple:
        >>> data = {'nom': 'Benzène', 'toxicite': 'TRES_TOXIQUE'}
        >>> result = evaluate_toxicity(data)
        >>> print(result['score'])  # 95
    """
    # Extraction du niveau de toxicité
    toxicity_level = substance_data.get('toxicite')
    substance_name = substance_data.get('nom', 'Substance inconnue')
    
    # Si le niveau de toxicité n'est pas défini
    if not toxicity_level:
        return {
            'score': TOXICITY_SCORES[DEFAULT_TOXICITY_LEVEL],
            'niveau': DEFAULT_TOXICITY_LEVEL,
            'explication': f"{substance_name} : niveau de toxicité non renseigné, "
                          f"niveau par défaut appliqué ({DEFAULT_TOXICITY_LEVEL}) par précaution."
        }
    
    # Normalisation du niveau de toxicité (majuscules, sans accents ni espaces)
    toxicity_normalized = normalize_text(str(toxicity_level)).upper().replace(' ', '_')
    
    # Correspondance avec les niveaux de toxicité prédéfinis
    score = None
    matched_level = None
    
    # Recherche du niveau correspondant dans TOXICITY_SCORES
    for level_key in TOXICITY_SCORES.keys():
        level_normalized = normalize_text(level_key).upper().replace(' ', '_')
        
        if toxicity_normalized == level_normalized or toxicity_normalized in level_normalized:
            score = TOXICITY_SCORES[level_key]
            matched_level = level_key
            break
    
    # Si aucune correspondance exacte, essayer des correspondances partielles
    if score is None:
        score, matched_level = _fuzzy_match_toxicity(toxicity_normalized)
    
    # Si toujours aucune correspondance, utiliser le score par défaut
    if score is None:
        return {
            'score': TOXICITY_SCORES[DEFAULT_TOXICITY_LEVEL],
            'niveau': DEFAULT_TOXICITY_LEVEL,
            'explication': f"{substance_name} : niveau de toxicité '{toxicity_level}' non reconnu, "
                          f"niveau par défaut ({DEFAULT_TOXICITY_LEVEL}) appliqué."
        }
    
    # Génération de l'explication selon le niveau
    explication = _generate_toxicity_explanation(substance_name, matched_level, score)
    
    return {
        'score': score,
        'niveau': matched_level,
        'explication': explication
    }


def _fuzzy_match_toxicity(toxicity_normalized):
    """
    Effectue une correspondance approximative pour les niveaux de toxicité.
    
    Gère les variantes d'écriture courantes dans les FDS.
    
    Args:
        toxicity_normalized (str): Niveau de toxicité normalisé
    
    Returns:
        tuple: (score, niveau) ou (None, None) si pas de correspondance
    """
    # Mapping des variantes courantes - IMPORTANT: exact matches en premier
    fuzzy_mappings = {
        'NON_TOXIQUE': ['NONTOXIQUE', 'NON_TOXIQUE', 'AUCUNE', 'AUCUN', 'NULLE'],
        'PEU_TOXIQUE': ['PEUTOXIQUE', 'PEU_TOXIQUE', 'FAIBLE', 'FAIBLETOXICITE'],
        'IRRITANT': ['IRRITANT', 'IRRITATION'],
        'NOCIF': ['NOCIF', 'NUISIBLE', 'TOXICITEMODERE', 'MODEREE'],
        'TOXIQUE': ['TOXIQUE', 'CORROSIF', 'TOXICITEELEVEE'],
        'TRES_TOXIQUE': ['TRES_TOXIQUE', 'TRESTOXIQUE', 'CMR', 'CANCEROGENE', 'MUTAGENE', 'REPROTOXIQUE'],
    }
    
    # D'abord: correspondance exacte
    for level, variants in fuzzy_mappings.items():
        if toxicity_normalized in variants:
            return TOXICITY_SCORES[level], level
    
    # Ensuite: correspondance partielle (si la variante est contenue dans la toxicité normalisée)
    for level, variants in fuzzy_mappings.items():
        for variant in variants:
            if len(variant) > 2 and variant in toxicity_normalized:  # Évite les faux positifs sur les petites chaînes
                return TOXICITY_SCORES[level], level
    
    return None, None


def _generate_toxicity_explanation(substance_name, level, score):
    """
    Génère une explication textuelle selon le niveau de toxicité.
    
    Args:
        substance_name (str): Nom de la substance
        level (str): Niveau de toxicité
        score (int): Score de toxicité
    
    Returns:
        str: Explication détaillée
    """
    explanations = {
        'TRES_TOXIQUE': f"{substance_name} : TRÈS TOXIQUE (score={score}). "
                       f"Danger grave pour la santé (CMR possible, toxicité aiguë élevée). "
                       f"Manipulation uniquement avec EPI complets sous hotte.",
        
        'TOXIQUE': f"{substance_name} : TOXIQUE (score={score}). "
                  f"Danger significatif pour la santé (toxique ou corrosif). "
                  f"Manipulation avec précautions renforcées.",
        
        'NOCIF': f"{substance_name} : NOCIF (score={score}). "
                f"Peut nuire à la santé en cas d'exposition. "
                f"Éviter l'inhalation et le contact cutané.",
        
        'IRRITANT': f"{substance_name} : IRRITANT (score={score}). "
                   f"Peut causer une irritation des yeux, de la peau ou des voies respiratoires. "
                   f"Porter des lunettes et gants de protection.",
        
        'PEU_TOXIQUE': f"{substance_name} : PEU TOXIQUE (score={score}). "
                      f"Toxicité faible en conditions normales d'utilisation. "
                      f"Respecter les bonnes pratiques de laboratoire.",
        
        'NON_TOXIQUE': f"{substance_name} : NON TOXIQUE (score={score}). "
                      f"Pas de danger toxicologique identifié. "
                      f"Appliquer les précautions standard."
    }
    
    return explanations.get(level, f"{substance_name} : niveau de toxicité {level} (score={score}).")


def get_toxicity_score(substance_data):
    """
    Retourne uniquement le score de toxicité.
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        int: Score de toxicité (0-100)
    """
    result = evaluate_toxicity(substance_data)
    return result['score']


def get_toxicity_level(substance_data):
    """
    Retourne uniquement le niveau de toxicité.
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        str: Niveau de toxicité
    """
    result = evaluate_toxicity(substance_data)
    return result['niveau']


def is_highly_toxic(substance_data):
    """
    Détermine si une substance est hautement toxique.
    
    Critère: score de toxicité >= 70
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        bool: True si très toxique, False sinon
    """
    score = get_toxicity_score(substance_data)
    return score >= 70


def is_cmr(substance_data):
    """
    Détermine si une substance est CMR (cancérogène, mutagène, reprotoxique).
    
    Critère: niveau = TRES_TOXIQUE
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        bool: True si CMR suspecté, False sinon
    """
    level = get_toxicity_level(substance_data)
    return level == 'TRES_TOXIQUE'


def get_safety_recommendations(substance_data):
    """
    Génère des recommandations de sécurité spécifiques à la toxicité.
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        list: Liste de recommandations de sécurité
    """
    level = get_toxicity_level(substance_data)
    substance_name = substance_data.get('nom', 'Cette substance')
    
    recommendations = []
    
    if level == 'TRES_TOXIQUE':
        recommendations.append(f"☠️ {substance_name} est TRÈS TOXIQUE : manipulation INTERDITE sans formation spécifique")
        recommendations.append("Porter EPI complets : blouse, gants nitrile résistants, lunettes étanches, masque FFP3")
        recommendations.append("Travailler OBLIGATOIREMENT sous hotte aspirante")
        recommendations.append("Consulter la FDS avant toute manipulation")
        recommendations.append("Prévoir un laveur oculaire et une douche de sécurité à proximité")
        recommendations.append("Limiter les quantités manipulées au strict nécessaire")
    
    elif level == 'TOXIQUE':
        recommendations.append(f"⚠️ {substance_name} est TOXIQUE : manipulation avec précautions renforcées")
        recommendations.append("Porter blouse, gants adaptés, lunettes de protection")
        recommendations.append("Manipuler sous hotte aspirante")
        recommendations.append("Ne pas ingérer, inhaler ou laisser au contact de la peau")
        recommendations.append("Se laver les mains après manipulation")
    
    elif level == 'NOCIF':
        recommendations.append(f"{substance_name} est NOCIF : éviter tout contact et inhalation")
        recommendations.append("Porter gants et lunettes de protection")
        recommendations.append("Manipuler de préférence sous hotte")
        recommendations.append("Assurer une bonne ventilation du local")
    
    elif level == 'IRRITANT':
        recommendations.append(f"{substance_name} est IRRITANT : éviter le contact direct")
        recommendations.append("Porter des gants et lunettes de protection")
        recommendations.append("En cas de contact : rincer abondamment à l'eau")
    
    elif level == 'PEU_TOXIQUE':
        recommendations.append(f"{substance_name} présente une faible toxicité : respecter les bonnes pratiques")
        recommendations.append("Porter les EPI de base (blouse, lunettes)")
    
    else:
        recommendations.append(f"{substance_name} n'est pas classé comme toxique")
        recommendations.append("Appliquer les règles générales de sécurité en laboratoire")
    
    return recommendations


def compare_toxicity(substance1_data, substance2_data):
    """
    Compare la toxicité de deux substances.
    
    Args:
        substance1_data (dict): Données de la première substance
        substance2_data (dict): Données de la deuxième substance
    
    Returns:
        dict: Résultat de la comparaison
    """
    score1 = get_toxicity_score(substance1_data)
    score2 = get_toxicity_score(substance2_data)
    
    name1 = substance1_data.get('nom', 'Substance 1')
    name2 = substance2_data.get('nom', 'Substance 2')
    
    if score1 > score2:
        return {
            'plus_toxique': name1,
            'difference': score1 - score2,
            'conclusion': f"{name1} est plus toxique que {name2} (écart de {score1 - score2} points)"
        }
    elif score2 > score1:
        return {
            'plus_toxique': name2,
            'difference': score2 - score1,
            'conclusion': f"{name2} est plus toxique que {name1} (écart de {score2 - score1} points)"
        }
    else:
        return {
            'plus_toxique': None,
            'difference': 0,
            'conclusion': f"{name1} et {name2} ont le même niveau de toxicité"
        }