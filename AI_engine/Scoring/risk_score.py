# scoring/risk_score.py
"""
Module de calcul du score de risque global - LOGIQUE HSE RÉVISÉE
Projet IUT Génie Chimique - 1ère année

NOUVELLE LOGIQUE (février 2026):
1. Scores individuels calculés séparément (0-50 chacun)
2. Agrégation pondérée: 20% inflammabilité + 35% toxicité + 45% incompatibilités
3. Ajustements environnementaux MULTIPLICATIFS (pas additifs)
4. Seuil minimum de sécurité: 100 pour réactions dangereuses connues
5. Conditions de laboratoire = modifications partielles, pas élimination du risque
"""

from config.settings import RISK_LEVEL_THRESHOLDS, SCORE_DECIMAL_PLACES

# ============================================
# POIDS HSE - Révisés selon importance
# ============================================
HSE_WEIGHTS = {
    'inflammabilite': 0.20,   # 20% - Important mais moins critique
    'toxicite': 0.35,        # 35% - Priorité moyenne
    'incompatibilite': 0.45   # 45% - Réactions = plus dangereux
}

def calculate_global_risk_score(individual_scores, is_dangerous_reaction_detected=False):
    """
    LOGIQUE HSE RÉVISÉE - Agrégation pondérée
    
    Args:
        individual_scores (dict): 
            'inflammabilite': 0-50
            'toxicite': 0-50
            'incompatibilites': 0-50
        is_dangerous_reaction_detected (bool): Si réaction dangereuse connue
    
    Returns:
        dict avec score_global, niveau_risque, etc.
    """
    # Extraction des scores (max 100 chacun AVANT agrégation)
    inflammabilite = min(100, individual_scores.get('inflammabilite', 0))
    toxicite = min(100, individual_scores.get('toxicite', 0))
    incompatibilite = min(100, individual_scores.get('incompatibilites', 0))
    
    # LOGIQUE CRITIQUE: Si réaction dangereuse connue → lockdown incompatibilité
    if is_dangerous_reaction_detected:
        incompatibilite = 50  # VERROUILLÉ AU MAXIMUM
        toxicite = max(toxicite, 40)  # Booster toxicité des produits
        print("[RISK_SCORE DEBUG] DANGEROUS REACTION DETECTED - Incompatibility LOCKED at 50")
    
    # ============================================
    # ÉTAPE 1: Agrégation pondérée (avant env)
    # ============================================
    # Somme pondérée: 0-50 (chaque score × poids)
    base_score = (
        inflammabilite * HSE_WEIGHTS['inflammabilite'] +
        toxicite * HSE_WEIGHTS['toxicite'] +
        incompatibilite * HSE_WEIGHTS['incompatibilite']
    )
    
    # Cap à 100 avant ajustements environnementaux
    base_score = min(100, base_score)
    
    print(f"[RISK_SCORE DEBUG] Individual scores: Inflamm={inflammabilite}, Tox={toxicite}, Incomp={incompatibilite}")
    print(f"[RISK_SCORE DEBUG] Base score (before env): {base_score:.1f}")
    
    explication = _generate_global_explanation(
        base_score, 
        _determine_risk_level(base_score), 
        inflammabilite, 
        toxicite, 
        incompatibilite
    )
    
    return {
        'score_global': base_score,
        'score_global_base': base_score,
        'niveau_risque': _determine_risk_level(base_score),
        'scores_details': {
            'inflammabilite': inflammabilite,
            'toxicite': toxicite,
            'incompatibilites': incompatibilite
        },
        'scores_ponderes': {
            'inflammabilite': round(inflammabilite * HSE_WEIGHTS['inflammabilite'], 2),
            'toxicite': round(toxicite * HSE_WEIGHTS['toxicite'], 2),
            'incompatibilites': round(incompatibilite * HSE_WEIGHTS['incompatibilite'], 2)
        },
        'explication': explication,
        'poids_utilises': HSE_WEIGHTS.copy()
    }



def _validate_score(score):
    """
    Valide et normalise un score individuel.
    
    S'assure que le score est un nombre entre 0 et 100.
    
    Args:
        score: Valeur à valider (int, float, ou autre)
    
    Returns:
        float: Score validé et normalisé (0-100)
    """
    try:
        score = float(score)
    except (ValueError, TypeError):
        return 0.0
    
    # Limitation du score entre 0 et 100
    if score < 0:
        return 0.0
    elif score > 100:
        return 100.0
    else:
        return score


def _determine_risk_level(global_score):
    """
    Détermine le niveau de risque qualitatif à partir du score global.
    
    Utilise les seuils définis dans config/settings.py:
    - Score < 40 → FAIBLE
    - Score 40-69 → MOYEN
    - Score >= 70 → ÉLEVÉ
    
    Args:
        global_score (float): Score global (0-100)
    
    Returns:
        str: Niveau de risque ('FAIBLE', 'MOYEN', 'ELEVE')
    """
    # Les seuils sont des minimums pour chaque niveau
    # On parcourt les seuils du plus élevé au plus faible
    
    if global_score >= RISK_LEVEL_THRESHOLDS['ELEVE']:
        return 'ELEVE'
    elif global_score >= RISK_LEVEL_THRESHOLDS['MOYEN']:
        return 'MOYEN'
    else:
        return 'FAIBLE'


def _generate_global_explanation(global_score, risk_level, inflam_score, tox_score, incomp_score):
    """
    Génère une explication textuelle du score global.
    
    Args:
        global_score (float): Score global
        risk_level (str): Niveau de risque
        inflam_score (float): Score d'inflammabilité
        tox_score (float): Score de toxicité
        incomp_score (float): Score d'incompatibilités
    
    Returns:
        str: Explication formatée
    """
    # Identification du risque principal (score le plus élevé)
    risks = {
        'inflammabilité': inflam_score,
        'toxicité': tox_score,
        'incompatibilités': incomp_score
    }
    
    main_risk = max(risks, key=risks.get)
    main_risk_score = risks[main_risk]
    
    # Construction de l'explication selon le niveau de risque
    if risk_level == 'ELEVE':
        explication = f"🔴 RISQUE ÉLEVÉ (score global: {global_score}/50). "
        explication += f"Le risque principal est lié à la {main_risk} (score: {main_risk_score}). "
        explication += "Manipulation INTERDITE sans formation spécifique et EPI complets. "
        explication += "Consulter impérativement la FDS et un responsable sécurité."
    
    elif risk_level == 'MOYEN':
        explication = f"🟠 RISQUE MOYEN (score global: {global_score}/50). "
        explication += f"Le risque principal est lié à la {main_risk} (score: {main_risk_score}). "
        explication += "Manipulation avec précautions renforcées requises. "
        explication += "Port des EPI obligatoire et travail sous hotte recommandé."
    
    else:
        explication = f"🟢 RISQUE FAIBLE (score global: {global_score}/50). "
        explication += "Les risques identifiés sont limités. "
        explication += "Respecter les bonnes pratiques de laboratoire standard."
    
    return explication


def get_risk_level_only(global_score):
    """
    Retourne uniquement le niveau de risque pour un score donné.
    
    Args:
        global_score (float): Score global (0-100)
    
    Returns:
        str: Niveau de risque ('FAIBLE', 'MOYEN', 'ELEVE')
    """
    return _determine_risk_level(global_score)


def is_high_risk(individual_scores):
    """
    Détermine rapidement si une substance présente un risque élevé.
    
    Args:
        individual_scores (dict): Scores individuels
    
    Returns:
        bool: True si risque élevé, False sinon
    """
    result = calculate_global_risk_score(individual_scores)
    return result['niveau_risque'] == 'ELEVE'


def compare_risks(scores1, scores2, name1='Substance 1', name2='Substance 2'):
    """
    Compare les risques de deux substances.
    
    Args:
        scores1 (dict): Scores de la première substance
        scores2 (dict): Scores de la deuxième substance
        name1 (str): Nom de la première substance
        name2 (str): Nom de la deuxième substance
    
    Returns:
        dict: Résultat de la comparaison
    """
    result1 = calculate_global_risk_score(scores1)
    result2 = calculate_global_risk_score(scores2)
    
    score1 = result1['score_global']
    score2 = result2['score_global']
    
    if score1 > score2:
        return {
            'plus_risquee': name1,
            'difference': round(score1 - score2, SCORE_DECIMAL_PLACES),
            'conclusion': f"{name1} présente un risque plus élevé que {name2} "
                         f"(écart de {round(score1 - score2, 1)} points)",
            'score1': score1,
            'score2': score2,
            'niveau1': result1['niveau_risque'],
            'niveau2': result2['niveau_risque']
        }
    elif score2 > score1:
        return {
            'plus_risquee': name2,
            'difference': round(score2 - score1, SCORE_DECIMAL_PLACES),
            'conclusion': f"{name2} présente un risque plus élevé que {name1} "
                         f"(écart de {round(score2 - score1, 1)} points)",
            'score1': score1,
            'score2': score2,
            'niveau1': result1['niveau_risque'],
            'niveau2': result2['niveau_risque']
        }
    else:
        return {
            'plus_risquee': None,
            'difference': 0,
            'conclusion': f"{name1} et {name2} présentent le même niveau de risque global",
            'score1': score1,
            'score2': score2,
            'niveau1': result1['niveau_risque'],
            'niveau2': result2['niveau_risque']
        }


def get_recommendations_by_level(risk_score):
    """
    Retourne des recommandations générales selon le niveau de risque.
    
    Args:
        risk_score (float or str): Score de risque ou niveau ('FAIBLE', 'MOYEN', 'ELEVE')
    
    Returns:
        list: Liste de recommandations
    """
    # Si c'est un score (float), déterminer le niveau
    if isinstance(risk_score, (int, float)):
        risk_level = _determine_risk_level(risk_score)
    else:
        risk_level = risk_score
    
    recommendations = {
        'ELEVE': [
            "🔴 Formation obligatoire avant toute manipulation",
            "Port d'EPI complets : blouse, gants résistants, lunettes étanches, masque si nécessaire",
            "Manipulation UNIQUEMENT sous hotte aspirante",
            "Présence d'un binôme obligatoire",
            "Laveur oculaire et douche de sécurité à proximité immédiate",
            "Plan d'intervention d'urgence affiché et connu",
            "Limiter les quantités au strict minimum nécessaire",
            "Consulter systématiquement la FDS avant manipulation"
        ],
        'MOYEN': [
            "🟠 Port d'EPI adapté : blouse, gants, lunettes de protection",
            "Manipulation sous hotte recommandée",
            "Ventilation adéquate du local",
            "Consulter la FDS",
            "Connaître l'emplacement des équipements de sécurité",
            "Informer un collègue de la manipulation en cours"
        ],
        'FAIBLE': [
            "🟢 Respecter les bonnes pratiques de laboratoire",
            "Port de la blouse et lunettes",
            "Éviter tout contact direct avec la substance",
            "Travailler dans un environnement propre et ordonné",
            "Se laver les mains après manipulation"
        ]
    }
    
    return recommendations.get(risk_level, recommendations['FAIBLE'])


def generate_risk_summary(individual_scores, substance_name='Substance'):
    """
    Génère un résumé complet de l'évaluation des risques.
    
    Args:
        individual_scores (dict): Scores individuels
        substance_name (str): Nom de la substance
    
    Returns:
        dict: Résumé complet incluant scores, niveau, et recommandations
    """
    result = calculate_global_risk_score(individual_scores)
    recommendations = get_recommendations_by_level(result['score_global'])
    
    return {
        'substance': substance_name,
        'score_global': result['score_global'],
        'niveau_risque': result['niveau_risque'],
        'scores_par_categorie': result['scores_details'],
        'scores_ponderes': result['scores_ponderes'],
        'explication': result['explication'],
        'recommandations': recommendations,
        'timestamp': None  # Peut être ajouté si besoin pour traçabilité
    }