# ai_engine/services/analyzer_optimized.py
"""
OPTIMIZED Service principal d'analyse des risques chimiques
Utilise un système de cache global pour charger les données une seule fois au démarrage.

NOUVELLE LOGIQUE (février 2026):
1. Détection des réactions dangereuses CONNUES
2. Calcul séparé des 3 scores (0-50 max)
3. Agrégation pondérée (20% inflam + 35% tox + 45% incomp)
4. Ajustements environnementaux MULTIPLICATIFS
5. Seuil minimum 50 pour réactions dangereuses
"""

import logging
from cache import get_substances, get_incompatibilities, find_substance_by_name, find_incompatibilities_for_pair
from utils.processor import (
    standardize_chemical_name,
    clean_input,
    is_valid_chemical_name
)
from utils.environmental_factors import apply_environmental_adjustments, determine_risk_level
from config.dangerous_reactions import is_dangerous_reaction
from rules.inflammabilite import (
    evaluate_inflammability,
    get_safety_recommendations as get_inflammability_recommendations
)
from rules.toxicite import (
    evaluate_toxicity,
    get_safety_recommendations as get_toxicity_recommendations
)
from rules.incompatibilites import (
    evaluate_incompatibility,
    get_storage_recommendations,
    check_multiple_incompatibilities
)
from Scoring.risk_score import (
    calculate_global_risk_score,
    generate_risk_summary,
    get_recommendations_by_level
)

logger = logging.getLogger(__name__)


def analyze_risk(input_data):
    """
    OPTIMIZED: Analyse les risques chimiques en utilisant des données cachées.
    
    Différences avec la version précédente:
    - Utilise le cache global au lieu de recharger les CSV
    - Lookups indexés O(1) pour substances et incompatibilités
    - Réduction du temps de réponse de 2-3 secondes à <500ms
    
    Args:
        input_data (dict): Données d'entrée contenant:
            - substances (list): Liste de noms de substances
            - quantites (dict, optional): Quantités par substance
            - contexte_labo (dict, optional): Conditions de laboratoire
    
    Returns:
        dict: Résultat structuré de l'analyse
    """
    import time
    start_time = time.time()
    
    # Initialisation du résultat
    result = {
        'success': True,
        'score_global': 0,
        'niveau_risque': 'FAIBLE',
        'details': {
            'inflammabilite': {'score': 0, 'explication': ''},
            'toxicite': {'score': 0, 'explication': ''},
            'incompatibilites': []
        },
        'origines_risque': [],
        'scenario_critique': '',
        'reactions_chimiques': [],
        'recommandations': [],
        'substances_analysees': [],
        'erreurs': [],
        'avertissements': []
    }
    
    # ÉTAPE 1: Validation des données d'entrée
    validation_errors = _validate_input(input_data)
    if validation_errors:
        result['success'] = False
        result['erreurs'] = validation_errors
        return result
    
    # ÉTAPE 2: Récupération des données cachées (TRÈS RAPIDE - O(1))
    try:
        substances_db = get_substances()  # Loaded once at startup
        incompatibilities_db = get_incompatibilities()  # Loaded once at startup
    except RuntimeError as e:
        result['success'] = False
        result['erreurs'].append(f"Cache system error: {str(e)}")
        return result
    
    if not substances_db:
        result['success'] = False
        result['erreurs'].append("Database des substances vide")
        return result
    
    # ÉTAPE 3: Extraction et normalisation des substances (FAST PATH with caching)
    substance_names = input_data.get('substances', [])
    quantities = input_data.get('quantites', {})
    context = input_data.get('contexte_labo', {})
    
    logger.info(f"[ANALYZER] Analyzing {len(substance_names)} substances")
    
    # Recherche et validation de chaque substance
    found_substances = []
    for name in substance_names:
        substance_data = _find_and_validate_substance(name, substances_db, result)
        if substance_data:
            substance_data['quantite'] = quantities.get(name, 0)
            found_substances.append(substance_data)
    
    if not found_substances:
        result['success'] = False
        result['erreurs'].append("Aucune substance valide trouvée")
        return result
    
    # ÉTAPE 4: Évaluation des risques individuels
    all_inflammability_scores = []
    all_toxicity_scores = []
    
    for substance in found_substances:
        inflam_result = evaluate_inflammability(substance)
        tox_result = evaluate_toxicity(substance)
        
        all_inflammability_scores.append(inflam_result['score'])
        all_toxicity_scores.append(tox_result['score'])
        
        result['substances_analysees'].append({
            'nom': substance.get('nom'),
            'cas': substance.get('cas', 'N/A'),
            'quantite': substance.get('quantite', 0),
            'inflammabilite': {
                'score': inflam_result['score'],
                'niveau': inflam_result['niveau'],
                'explication': inflam_result['explication']
            },
            'toxicite': {
                'score': tox_result['score'],
                'niveau': tox_result['niveau'],
                'explication': tox_result['explication']
            }
        })
    
    # ÉTAPE 5: Calcul des scores
    max_inflammability = max(all_inflammability_scores) if all_inflammability_scores else 0
    max_toxicity = max(all_toxicity_scores) if all_toxicity_scores else 0
    
    # ÉTAPE 6: Évaluation des incompatibilités (OPTIMIZED with indexed lookups)
    incompatibility_score = 0
    incompatibility_details = []
    is_dangerous_reaction_detected = False
    dangerous_reaction_info = None
    
    if len(found_substances) > 1:
        # OPTIMIZED: Use fast indexed lookup instead of looping through all incompatibilities
        detected_incomp = _check_incompatibilities_fast(found_substances, incompatibilities_db)
        
        if detected_incomp:
            incompatibility_score = max([inc['score'] for inc in detected_incomp])
            
            for inc in detected_incomp:
                # Vérifier si c'est une réaction dangereuse
                is_dangerous, danger_info = is_dangerous_reaction(inc['substance1'], inc['substance2'])
                
                if is_dangerous:
                    is_dangerous_reaction_detected = True
                    dangerous_reaction_info = {
                        'substances': [inc['substance1'], inc['substance2']],
                        'produit': danger_info.get('produit'),
                        'formule': danger_info.get('formule'),
                        'toxicite': danger_info.get('toxicite'),
                        'score_minimum': danger_info.get('min_score', 50),
                        'recommandations': danger_info.get('recommandations', [])
                    }
                
                incompatibility_details.append({
                    'substances': [inc['substance1'], inc['substance2']],
                    'score': inc['score'],
                    'niveau': inc['niveau'],
                    'explication': inc['explication'],
                    'is_dangerous': is_dangerous,
                    'dangerous_info': danger_info if is_dangerous else None
                })
    
    # ÉTAPE 7: Agrégation des scores avec NOUVELLE LOGIQUE HSE
    individual_scores = {
        'inflammabilite': max_inflammability,
        'toxicite': max_toxicity,
        'incompatibilites': incompatibility_score
    }
    
    # Pondération spéciale si réaction dangereuse détectée
    if is_dangerous_reaction_detected and dangerous_reaction_info:
        min_score = dangerous_reaction_info.get('score_minimum', 50)
        score_global = max(
            calculate_global_risk_score(individual_scores),
            min_score
        )
        result['scenario_critique'] = f"⚠️ RÉACTION DANGEREUSE: {dangerous_reaction_info['substances'][0]} + {dangerous_reaction_info['substances'][1]} produit {dangerous_reaction_info.get('produit')}"
    else:
        score_global = calculate_global_risk_score(individual_scores)
    
    # ÉTAPE 8: Ajustements basés sur le contexte du laboratoire
    adjusted_score = apply_environmental_adjustments(score_global, context)
    
    # Limitation du score à 100
    adjusted_score = min(adjusted_score, 100)
    
    # Détermination du niveau de risque
    risk_level = determine_risk_level(adjusted_score)
    
    # ÉTAPE 9: Préparation de la réponse finale
    result['score_global'] = adjusted_score
    result['niveau_risque'] = risk_level
    result['details']['inflammabilite']['score'] = max_inflammability
    result['details']['toxicite']['score'] = max_toxicity
    result['details']['incompatibilites'] = incompatibility_details
    
    # Ajout des recommandations générales par niveau de risque
    general_recs = get_recommendations_by_level(risk_level)
    if isinstance(general_recs, list):
        result['recommandations'].extend(general_recs)
    
    # Ajout des recommandations spécifiques de sécurité
    for substance in found_substances:
        inflam_recs = get_inflammability_recommendations(substance)
        if isinstance(inflam_recs, list):
            result['recommandations'].extend(inflam_recs)
        
        tox_recs = get_toxicity_recommendations(substance)
        if isinstance(tox_recs, list):
            result['recommandations'].extend(tox_recs)
    
    # Suppression des doublons dans les recommandations
    result['recommandations'] = list(dict.fromkeys(result['recommandations']))
    
    # Log de timing
    elapsed = time.time() - start_time
    logger.info(f"[ANALYZER] Analysis completed in {elapsed:.3f}s - Score: {adjusted_score}")
    
    return result


def _check_incompatibilities_fast(substances, incompatibilities_db):
    """
    OPTIMIZED: Détecte les incompatibilités en utilisant l'index de paires.
    Temps: O(n²) where n = nombre de substances (très petit, généralement 2-3)
    Au lieu de O(n * m) où m = nombre total d'incompatibilités
    """
    detected = []
    
    # Vérifier chaque paire de substances
    for i, sub1 in enumerate(substances):
        for sub2 in substances[i+1:]:
            name1 = sub1.get('nom', '').lower().strip()
            name2 = sub2.get('nom', '').lower().strip()
            
            # FAST: Indexed O(1) lookup au lieu de linear search
            incomp_records = find_incompatibilities_for_pair(name1, name2)
            
            for incomp in incomp_records:
                evaluate_incompatibility(incomp, detected, sub1, sub2)
    
    return detected


def _find_and_validate_substance(name, substances_db, result):
    """
    Recherche une substance dans la base de données.
    Utilise la normalisation du nom pour améliorer la correspondance.
    """
    if not name or not isinstance(name, str):
        result['avertissements'].append(f"Substance invalide: {name}")
        return None
    
    clean_name = clean_input(name)
    normalized_name = standardize_chemical_name(clean_name)
    
    if not is_valid_chemical_name(normalized_name):
        result['avertissements'].append(f"Nom de substance invalide: {name}")
        return None
    
    # OPTIMIZED: Fast lookup O(1) au lieu de boucler tous les éléments
    substance_data = find_substance_by_name(normalized_name)
    
    if not substance_data:
        result['avertissements'].append(f"Substance non trouvée: {name}")
        return None
    
    return substance_data


def _validate_input(data):
    """Valide les données d'entrée."""
    errors = []
    
    if not isinstance(data, dict):
        errors.append("L'entrée doit être un dictionnaire JSON")
        return errors
    
    if 'substances' not in data:
        errors.append("Le champ 'substances' est obligatoire")
        return errors
    
    substances = data.get('substances', [])
    if not isinstance(substances, list):
        errors.append("Le champ 'substances' doit être une liste")
        return errors
    
    if not substances or len(substances) == 0:
        errors.append("Au moins une substance doit être fournie")
        return errors
    
    return errors
