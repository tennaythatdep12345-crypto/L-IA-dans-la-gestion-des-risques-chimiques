# ai_engine/rules/incompatibilites.py
"""
Module d'évaluation du risque d'incompatibilité chimique
Projet IUT Génie Chimique - 1ère année
Approche : IA symbolique basée sur des règles expertes

Logique chimique:
- Certaines substances ne doivent jamais être stockées ou manipulées ensemble
- Les incompatibilités peuvent provoquer des réactions violentes, dégagements toxiques, incendies
- Exemples classiques: acides + bases, oxydants + réducteurs, acides + cyanures
- Le niveau de risque dépend de la violence potentielle de la réaction
"""

from config.settings import (
    INCOMPATIBILITY_BASE_SCORE,
    MAX_INCOMPATIBILITY_SCORE,
    SEVERE_INCOMPATIBILITY_MULTIPLIER,
    DEFAULT_SCORE
)
from utils.processor import standardize_chemical_name, normalize_text
from utils.csv_loader import check_incompatibility


def evaluate_incompatibility(substance1_data, substance2_data, incompatibilities_list):
    """
    Évalue le risque d'incompatibilité entre deux substances chimiques.
    
    Règles expertes:
    - Recherche d'incompatibilités connues dans la base de données
    - Attribution d'un score selon le niveau de risque documenté
    - Prise en compte des catégories chimiques pour détecter des incompatibilités génériques
    
    Args:
        substance1_data (dict): Données de la première substance
                                Clés attendues: 'nom', 'cas', 'categorie'
        substance2_data (dict): Données de la deuxième substance
                                Clés attendues: 'nom', 'cas', 'categorie'
        incompatibilities_list (list): Liste des incompatibilités chargées depuis CSV
    
    Returns:
        dict: {
            'score': int (0-100),
            'incompatible': bool,
            'niveau_risque': str,
            'explication': str
        }
    
    Exemple:
        >>> sub1 = {'nom': 'Acide sulfurique', 'categorie': 'acide'}
        >>> sub2 = {'nom': 'Hydroxyde de sodium', 'categorie': 'base'}
        >>> incomp_list = [...]
        >>> result = evaluate_incompatibility(sub1, sub2, incomp_list)
    """
    # Extraction des informations des substances
    name1 = substance1_data.get('nom', '')
    cas1 = substance1_data.get('cas', '')
    category1 = substance1_data.get('categorie', '')
    
    name2 = substance2_data.get('nom', '')
    cas2 = substance2_data.get('cas', '')
    category2 = substance2_data.get('categorie', '')
    
    # Si l'une des substances n'est pas définie
    if not name1 or not name2:
        return {
            'score': 0,
            'incompatible': False,
            'niveau_risque': 'AUCUN',
            'explication': 'Impossible d\'évaluer l\'incompatibilité : substance(s) non définie(s).'
        }
    
    # ÉTAPE 1: Recherche d'incompatibilité directe dans la base de données
    # Recherche par nom
    direct_incomp = check_incompatibility(name1, name2, incompatibilities_list)
    
    print(f"[EVAL_INCOMP DEBUG] Checking {name1} + {name2}")
    print(f"[EVAL_INCOMP DEBUG]   Direct search result: {direct_incomp is not None}")
    
    # Si pas trouvé par nom, essayer par CAS
    if not direct_incomp and cas1 and cas2:
        direct_incomp = check_incompatibility(cas1, cas2, incompatibilities_list)
        print(f"[EVAL_INCOMP DEBUG]   CAS search result: {direct_incomp is not None}")
    
    # Si une incompatibilité directe est trouvée
    if direct_incomp:
        return _process_direct_incompatibility(name1, name2, direct_incomp)
    
    # ÉTAPE 2: Recherche d'incompatibilité par catégorie chimique
    category_incomp = _check_category_incompatibility(category1, category2)
    
    if category_incomp:
        return _process_category_incompatibility(name1, name2, category1, category2, category_incomp)
    
    # ÉTAPE 3: Aucune incompatibilité détectée
    return {
        'score': 0,
        'incompatible': False,
        'niveau_risque': 'AUCUN',
        'explication': f"Aucune incompatibilité connue entre {name1} et {name2}. "
                      f"Respecter néanmoins les règles de stockage séparé par famille chimique."
    }


def _process_direct_incompatibility(name1, name2, incomp_data):
    niveau_risque = incomp_data.get('niveau_risque', 'MOYEN')
    score = _calculate_incompatibility_score(niveau_risque)

    type_reaction = incomp_data.get('type_reaction', '')
    justification = incomp_data.get('justification', '')
    produit_reaction = incomp_data.get('produit_reaction', '')
    formule_produit = incomp_data.get('formule_produit', '')
    equation_reaction = incomp_data.get('equation_reaction', '')

    explication = _generate_incompatibility_explanation(
        name1, name2, niveau_risque,
        source='base de données',
        detail=type_reaction,
        justification=justification
    )

    return {
        'score': score,
        'incompatible': True,
        'niveau_risque': niveau_risque,
        'type_reaction': type_reaction,
        'justification': justification,
        'produit_reaction': produit_reaction,
        'formule_produit': formule_produit,
        'equation_reaction': equation_reaction,
        'explication': explication
    }


def _check_category_incompatibility(category1, category2):
    """
    Vérifie s'il existe une incompatibilité basée sur les catégories chimiques.
    
    Règles génériques basées sur les familles chimiques courantes:
    - Acides + Bases → réaction exothermique violente
    - Oxydants + Réducteurs → risque d'incendie/explosion
    - Acides + Cyanures → dégagement de HCN toxique
    - Oxydants + Matières organiques → risque d'inflammation
    
    Args:
        category1 (str): Catégorie de la première substance
        category2 (str): Catégorie de la deuxième substance
    
    Returns:
        dict or None: Données d'incompatibilité si détectée, None sinon
    """
    if not category1 or not category2:
        return None
    
    # Normalisation des catégories
    cat1 = normalize_text(category1).lower()
    cat2 = normalize_text(category2).lower()
    
    # Définition des incompatibilités génériques par catégorie
    # Format: (categorie1, categorie2): niveau_risque
    category_rules = {
        ('acide', 'base'): 'ELEVE',
        ('base', 'acide'): 'ELEVE',
        
        ('oxydant', 'reducteur'): 'ELEVE',
        ('reducteur', 'oxydant'): 'ELEVE',
        
        ('oxydant', 'inflammable'): 'ELEVE',
        ('inflammable', 'oxydant'): 'ELEVE',
        
        ('oxydant', 'solvant'): 'MOYEN',
        ('solvant', 'oxydant'): 'MOYEN',
        
        ('acide', 'cyanure'): 'SEVERE',
        ('cyanure', 'acide'): 'SEVERE',
        
        ('acide', 'sulfure'): 'ELEVE',
        ('sulfure', 'acide'): 'ELEVE',
        
        ('oxydant', 'matiere_organique'): 'MOYEN',
        ('matiere_organique', 'oxydant'): 'MOYEN',
        
        ('eau', 'reactif_hydrophobe'): 'MOYEN',
        ('reactif_hydrophobe', 'eau'): 'MOYEN',
        
        ('base', 'solvant'): 'MOYEN',
        ('solvant', 'base'): 'MOYEN',

        ('base', 'inflammable'): 'MOYEN',
        ('inflammable', 'base'): 'MOYEN',

    }
    
    # Recherche d'une correspondance
    for (c1, c2), risk_level in category_rules.items():
        if (c1 in cat1 and c2 in cat2) or (c1 in cat2 and c2 in cat1):
            return {
                'niveau_risque': risk_level,
                'categorie1': c1,
                'categorie2': c2
            }
    
    return None


def _process_category_incompatibility(name1, name2, category1, category2, incomp_data):
    """
    Traite une incompatibilité détectée par catégorie chimique.
    
    Args:
        name1 (str): Nom de la première substance
        name2 (str): Nom de la deuxième substance
        category1 (str): Catégorie de la première substance
        category2 (str): Catégorie de la deuxième substance
        incomp_data (dict): Données d'incompatibilité détectée
    
    Returns:
        dict: Résultat de l'évaluation
    """
    niveau_risque = incomp_data.get('niveau_risque', 'MOYEN')
    
    # Attribution du score
    score = _calculate_incompatibility_score(niveau_risque)
    
    # Génération de l'explication
    explication = _generate_incompatibility_explanation(
        name1, name2, niveau_risque, 
        source='catégories chimiques',
        detail=f"{category1} + {category2}"
    )
    
    return {
        'score': score,
        'incompatible': True,
        'niveau_risque': niveau_risque,
        'explication': explication
    }


def _calculate_incompatibility_score(niveau_risque):
    niveau_normalized = normalize_text(niveau_risque).upper()
    
    # Mapping des niveaux aux scores
    if 'SEVERE' in niveau_normalized or 'CRITIQUE' in niveau_normalized:
        return min(int(INCOMPATIBILITY_BASE_SCORE * SEVERE_INCOMPATIBILITY_MULTIPLIER * 1.5), MAX_INCOMPATIBILITY_SCORE)
    
    elif 'ELEVE' in niveau_normalized or 'ELEVEE' in niveau_normalized or 'HAUT' in niveau_normalized:
        return min(int(INCOMPATIBILITY_BASE_SCORE * SEVERE_INCOMPATIBILITY_MULTIPLIER), MAX_INCOMPATIBILITY_SCORE)
    
    elif 'MOYEN' in niveau_normalized or 'MOYENNE' in niveau_normalized or 'MODERE' in niveau_normalized:
        return INCOMPATIBILITY_BASE_SCORE
    
    elif 'FAIBLE' in niveau_normalized or 'BAS' in niveau_normalized:
        return int(INCOMPATIBILITY_BASE_SCORE * 0.5)
    
    else:
        # Niveau non reconnu, score par défaut moyen
        return INCOMPATIBILITY_BASE_SCORE
def _generate_incompatibility_explanation(name1, name2, niveau_risque, source='', detail='',justification=''):
    niveau_normalized = normalize_text(niveau_risque).upper()
    
    if 'SEVERE' in niveau_normalized or 'CRITIQUE' in niveau_normalized:
        prefix = "⛔ INCOMPATIBILITÉ SÉVÈRE"
        consequence = "Risque de réaction violente, explosion ou dégagement toxique mortel."
        recommendation = "NE JAMAIS stocker ou manipuler ensemble. Stocker dans des locaux séparés."
    
    elif 'ELEVE' in niveau_normalized or 'ELEVEE' in niveau_normalized:
        prefix = "🔴 INCOMPATIBILITÉ ÉLEVÉE"
        consequence = "Risque de réaction exothermique violente, incendie ou dégagement de gaz toxiques."
        recommendation = "Stocker dans des armoires séparées. Ne pas manipuler simultanément."
    
    elif 'MOYEN' in niveau_normalized or 'MOYENNE' in niveau_normalized:
        prefix = "🟠 INCOMPATIBILITÉ MODÉRÉE"
        consequence = "Risque de réaction indésirable en cas de mélange."
        recommendation = "Stocker séparément. Manipuler avec précautions."
    
    else:
        prefix = "🟡 INCOMPATIBILITÉ FAIBLE"
        consequence = "Interaction possible mais risque limité."
        recommendation = "Respecter les règles de stockage par famille."
    
    explication = f"{prefix} entre {name1} et {name2}."
    
    if detail:
        explication += f" Détection: {detail}."
    
    if source:
        explication += f" (Source: {source})"
        
    if justification:
        explication += f" Justification: {justification}."
    
    explication += f" {consequence} {recommendation}"
    
    return explication


def get_incompatibility_score(substance1_data, substance2_data, incompatibilities_list):
    result = evaluate_incompatibility(substance1_data, substance2_data, incompatibilities_list)
    return result['score']


def are_incompatible(substance1_data, substance2_data, incompatibilities_list):
    result = evaluate_incompatibility(substance1_data, substance2_data, incompatibilities_list)
    return result['incompatible']


def get_storage_recommendations(substance1_data, substance2_data, incompatibilities_list):
    result = evaluate_incompatibility(substance1_data, substance2_data, incompatibilities_list)
    
    name1 = substance1_data.get('nom', 'Substance 1')
    name2 = substance2_data.get('nom', 'Substance 2')
    
    recommendations = []
    
    if result['incompatible']:
        niveau = result['niveau_risque']
        
        type_reaction = result.get('type_reaction', '').lower()

        if 'exotherm' in type_reaction:
            recommendations.append("🔥 Risque de réaction exothermique : éviter tout contact direct")
            recommendations.append("Prévoir un refroidissement et manipuler lentement")

        if 'gaz toxique' in type_reaction:
            recommendations.append("☣️ Risque de dégagement de gaz toxique")
            recommendations.append("Manipuler uniquement sous hotte chimique")
            recommendations.append("Port obligatoire de masque filtrant adapté")

        if 'corrosif' in type_reaction:
            recommendations.append("🧪 Réaction corrosive possible")
            recommendations.append("Utiliser des gants et lunettes de protection")
            recommendations.append("Éviter tout contact avec la peau")

        if 'SEVERE' in niveau or 'CRITIQUE' in niveau:
            recommendations.append(f"❌ INTERDICTION ABSOLUE de stocker {name1} et {name2} dans le même local")
            recommendations.append("Prévoir un stockage dans des bâtiments séparés si possible")
            recommendations.append("Former le personnel aux risques spécifiques")
            recommendations.append("Établir une procédure d'urgence en cas de contact accidentel")
        
        elif 'ELEVE' in niveau or 'ELEVEE' in niveau:
            recommendations.append(f"⚠️ {name1} et {name2} doivent être stockés dans des armoires différentes")
            recommendations.append("Maintenir une distance minimale de 3 mètres entre les stockages")
            recommendations.append("Identifier clairement les zones de stockage incompatibles")
            recommendations.append("Ne jamais manipuler les deux substances simultanément")
        
        else:
            recommendations.append(f"{name1} et {name2} doivent être stockés séparément")
            recommendations.append("Respecter le rangement par famille chimique")
            recommendations.append("Vérifier régulièrement l'étanchéité des contenants")
    
    else:
        recommendations.append(f"Pas d'incompatibilité majeure détectée entre {name1} et {name2}")
        recommendations.append("Respecter néanmoins les bonnes pratiques de stockage par famille")
    
    return recommendations


def check_multiple_incompatibilities(substances_list, incompatibilities_list):
    """
    Vérifie les incompatibilités entre plusieurs substances.
    
    Utile pour analyser un inventaire de laboratoire.
    
    Args:
        substances_list (list): Liste de dictionnaires de substances
        incompatibilities_list (list): Liste des incompatibilités
    
    Returns:
        list: Liste des incompatibilités détectées
    """
    detected_incompatibilities = []
    
    print(f"[INCOMP DEBUG] Checking {len(substances_list)} substances for incompatibilities")
    print(f"[INCOMP DEBUG] Incompatibilities DB has {len(incompatibilities_list)} entries")
    
    # Comparaison deux à deux
    for i in range(len(substances_list)):
        for j in range(i + 1, len(substances_list)):
            sub1_name = substances_list[i].get('nom')
            sub2_name = substances_list[j].get('nom')
            print(f"[INCOMP DEBUG] Comparing {sub1_name} <-> {sub2_name}")
            
            result = evaluate_incompatibility(
                substances_list[i],
                substances_list[j],
                incompatibilities_list
            )
            
            print(f"[INCOMP DEBUG]   Result: incompatible={result.get('incompatible')}, score={result.get('score')}")
            
            if result['incompatible']:
                detected_incompatibilities.append({
                    'substance1': sub1_name,
                    'substance2': sub2_name,
                    'score': result['score'],
                    'niveau': result['niveau_risque'],
                    'explication': result['explication'],
                    'type_reaction': result.get('type_reaction', ''),
                    'produit_reaction': result.get('produit_reaction', ''),
                    'formule_produit': result.get('formule_produit', ''),
                    'equation_reaction': result.get('equation_reaction', ''),
                    'justification': result.get('justification', '')
                })
    
    # Tri par score décroissant (incompatibilités les plus graves d'abord)
    detected_incompatibilities.sort(key=lambda x: x['score'], reverse=True)
    
    return detected_incompatibilities