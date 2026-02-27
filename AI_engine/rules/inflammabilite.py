# ai_engine/rules/inflammabilite.py
"""
Module d'évaluation du risque d'inflammabilité
Projet IUT Génie Chimique - 1ère année
Approche : IA symbolique basée sur des règles expertes

Logique chimique:
- Le point éclair (flash point) est la température minimale à laquelle
  un liquide émet suffisamment de vapeurs pour former un mélange inflammable
- Plus le point éclair est bas, plus le risque d'incendie est élevé
- Classification basée sur les normes de sécurité en laboratoire
"""

from config.settings import (
    FLASH_POINT_THRESHOLDS,
    INFLAMMABILITY_SCORES,
    DEFAULT_SCORE,
    MAX_CATEGORY_SCORE
)


def evaluate_inflammability(substance_data):
    """
    Évalue le risque d'inflammabilité d'une substance chimique.
    
    Règles expertes basées sur le point éclair:
    - Point éclair < 23°C : très inflammable (ex: acétone, éther)
    - Point éclair entre 23°C et 60°C : inflammable (ex: éthanol)
    - Point éclair > 60°C : peu inflammable (ex: huiles)
    - Absence de point éclair : considéré comme non inflammable
    
    Args:
        substance_data (dict): Dictionnaire contenant les données de la substance
                               Clés attendues: 'point_eclair', 'nom', 'categorie'
    
    Returns:
        dict: {
            'score': int (0-100),
            'niveau': str (TRES_INFLAMMABLE, INFLAMMABLE, PEU_INFLAMMABLE, NON_INFLAMMABLE),
            'explication': str
        }
    
    Exemple:
        >>> data = {'nom': 'Ethanol', 'point_eclair': 13}
        >>> result = evaluate_inflammability(data)
        >>> print(result['score'])  # 90
        >>> print(result['niveau'])  # TRES_INFLAMMABLE
    """
    # Extraction du point éclair
    flash_point = substance_data.get('point_eclair')
    substance_name = substance_data.get('nom', 'Substance inconnue')
    
    # Si le point éclair n'est pas défini ou est None
    if flash_point is None:
        return {
            'score': INFLAMMABILITY_SCORES['NON_INFLAMMABLE'],
            'niveau': 'NON_INFLAMMABLE',
            'explication': f"{substance_name} : pas de point éclair renseigné, considéré comme non inflammable."
        }
    
    # Conversion en float si nécessaire
    try:
        flash_point = float(flash_point)
    except (ValueError, TypeError):
        return {
            'score': INFLAMMABILITY_SCORES['NON_INFLAMMABLE'],
            'niveau': 'NON_INFLAMMABLE',
            'explication': f"{substance_name} : point éclair invalide, considéré comme non inflammable."
        }
    
    # Application des règles d'évaluation basées sur les seuils
    
    # RÈGLE 1: Point éclair très bas (< 23°C) → TRÈS INFLAMMABLE
    if flash_point < FLASH_POINT_THRESHOLDS['TRES_INFLAMMABLE']:
        return {
            'score': INFLAMMABILITY_SCORES['TRES_INFLAMMABLE'],
            'niveau': 'TRES_INFLAMMABLE',
            'explication': f"{substance_name} : point éclair = {flash_point}°C (< {FLASH_POINT_THRESHOLDS['TRES_INFLAMMABLE']}°C). "
                          f"Risque très élevé d'inflammation. Manipuler loin de toute source de chaleur."
        }
    
    # RÈGLE 2: Point éclair modéré (23°C - 60°C) → INFLAMMABLE
    elif flash_point < FLASH_POINT_THRESHOLDS['INFLAMMABLE']:
        return {
            'score': INFLAMMABILITY_SCORES['INFLAMMABLE'],
            'niveau': 'INFLAMMABLE',
            'explication': f"{substance_name} : point éclair = {flash_point}°C (entre {FLASH_POINT_THRESHOLDS['TRES_INFLAMMABLE']}°C et {FLASH_POINT_THRESHOLDS['INFLAMMABLE']}°C). "
                          f"Risque modéré. Éviter les sources d'ignition."
        }
    
    # RÈGLE 3: Point éclair élevé (60°C - 100°C) → PEU INFLAMMABLE
    elif flash_point < FLASH_POINT_THRESHOLDS['PEU_INFLAMMABLE']:
        return {
            'score': INFLAMMABILITY_SCORES['PEU_INFLAMMABLE'],
            'niveau': 'PEU_INFLAMMABLE',
            'explication': f"{substance_name} : point éclair = {flash_point}°C (entre {FLASH_POINT_THRESHOLDS['INFLAMMABLE']}°C et {FLASH_POINT_THRESHOLDS['PEU_INFLAMMABLE']}°C). "
                          f"Risque faible en conditions normales de laboratoire."
        }
    
    # RÈGLE 4: Point éclair très élevé (> 100°C) → NON INFLAMMABLE
    else:
        return {
            'score': INFLAMMABILITY_SCORES['NON_INFLAMMABLE'],
            'niveau': 'NON_INFLAMMABLE',
            'explication': f"{substance_name} : point éclair = {flash_point}°C (> {FLASH_POINT_THRESHOLDS['PEU_INFLAMMABLE']}°C). "
                          f"Risque négligeable d'inflammation à température ambiante."
        }


def get_inflammability_score(substance_data):
    """
    Retourne uniquement le score d'inflammabilité (pour calculs ultérieurs).
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        int: Score d'inflammabilité (0-100)
    """
    result = evaluate_inflammability(substance_data)
    return result['score']


def get_inflammability_level(substance_data):
    """
    Retourne uniquement le niveau d'inflammabilité (classification).
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        str: Niveau d'inflammabilité (TRES_INFLAMMABLE, INFLAMMABLE, etc.)
    """
    result = evaluate_inflammability(substance_data)
    return result['niveau']


def classify_by_flash_point(flash_point):
    """
    Classifie directement un point éclair donné.
    
    Fonction utilitaire pour classification rapide sans données complètes.
    
    Args:
        flash_point (float or None): Point éclair en °C
    
    Returns:
        str: Niveau d'inflammabilité
    
    Exemple:
        >>> classify_by_flash_point(15)
        'TRES_INFLAMMABLE'
        >>> classify_by_flash_point(None)
        'NON_INFLAMMABLE'
    """
    if flash_point is None:
        return 'NON_INFLAMMABLE'
    
    try:
        flash_point = float(flash_point)
    except (ValueError, TypeError):
        return 'NON_INFLAMMABLE'
    
    if flash_point < FLASH_POINT_THRESHOLDS['TRES_INFLAMMABLE']:
        return 'TRES_INFLAMMABLE'
    elif flash_point < FLASH_POINT_THRESHOLDS['INFLAMMABLE']:
        return 'INFLAMMABLE'
    elif flash_point < FLASH_POINT_THRESHOLDS['PEU_INFLAMMABLE']:
        return 'PEU_INFLAMMABLE'
    else:
        return 'NON_INFLAMMABLE'


def is_highly_flammable(substance_data):
    """
    Détermine si une substance est hautement inflammable.
    
    Critère: score d'inflammabilité >= 60
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        bool: True si hautement inflammable, False sinon
    """
    score = get_inflammability_score(substance_data)
    return score >= 60


def get_safety_recommendations(substance_data):
    """
    Génère des recommandations de sécurité spécifiques à l'inflammabilité.
    
    Args:
        substance_data (dict): Données de la substance
    
    Returns:
        list: Liste de recommandations de sécurité
    """
    level = get_inflammability_level(substance_data)
    substance_name = substance_data.get('nom', 'Cette substance')
    
    recommendations = []
    
    if level == 'TRES_INFLAMMABLE':
        recommendations.append(f"⚠️ {substance_name} est très inflammable : stocker au réfrigérateur ou dans une armoire anti-feu")
        recommendations.append("Interdire toute flamme nue, cigarette ou source de chaleur à proximité")
        recommendations.append("Utiliser uniquement sous hotte aspirante")
        recommendations.append("Prévoir un extincteur adapté (CO2 ou poudre)")
        recommendations.append("Porter des EPI appropriés (lunettes, gants)")
    
    elif level == 'INFLAMMABLE':
        recommendations.append(f"{substance_name} est inflammable : stocker à l'écart des sources de chaleur")
        recommendations.append("Éviter l'accumulation de vapeurs (ventilation)")
        recommendations.append("Manipuler de préférence sous hotte")
        recommendations.append("Prévoir un moyen d'extinction à proximité")
    
    elif level == 'PEU_INFLAMMABLE':
        recommendations.append(f"{substance_name} présente un risque faible : respecter les règles générales de sécurité")
        recommendations.append("Éviter le chauffage direct à flamme nue")
    
    else:
        recommendations.append(f"{substance_name} n'est pas inflammable dans les conditions normales")
        recommendations.append("Appliquer les précautions d'usage standard")
    
    return recommendations