# ai_engine/services/analyzer.py
"""
Service principal d'analyse des risques chimiques - LOGIQUE HSE RÉVISÉE
Projet IUT Génie Chimique - 1ère année

NOUVELLE LOGIQUE (février 2026):
1. Détection des réactions dangereuses CONNUES
2. Calcul séparé des 3 scores (0-50 max)
3. Agrégation pondérée (20% inflam + 35% tox + 45% incomp)
4. Ajustements environnementaux MULTIPLICATIFS
5. Seuil minimum 50 pour réactions dangereuses
"""

from utils.csv_loader import (
    load_substances,
    load_incompatibilities,
    find_substance_by_name,
    find_substance_by_cas
)
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


def analyze_risk(input_data):
    """
    Analyse les risques chimiques pour une ou plusieurs substances.
    
    Cette fonction principale coordonne l'ensemble du processus d'évaluation:
    - Validation et normalisation des entrées
    - Recherche des substances dans la base de données
    - Évaluation des risques individuels (inflammabilité, toxicité)
    - Détection des incompatibilités entre substances
    - Calcul du score de risque global
    - Génération de recommandations de sécurité
    
    Args:
        input_data (dict): Données d'entrée contenant:
            - substances (list): Liste de noms de substances
            - quantites (dict, optional): Quantités par substance (en mL ou g)
            - contexte_labo (dict, optional): Conditions de laboratoire
    
    Returns:
        dict: Résultat structuré de l'analyse comprenant:
            - score_global (float): Score de risque global (0-100)
            - niveau_risque (str): Niveau qualitatif (FAIBLE, MOYEN, ELEVE)
            - details (dict): Détails par catégorie de risque
            - recommandations (list): Liste de recommandations de sécurité
            - substances_analysees (list): Détails de chaque substance
            - erreurs (list): Liste des erreurs rencontrées
    
    Exemple:
        >>> data = {
        ...     "substances": ["Ethanol", "Acétone"],
        ...     "quantites": {"Ethanol": 500, "Acétone": 250}
        ... }
        >>> result = analyze_risk(data)
        >>> print(result['niveau_risque'])
    """
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
        'origines_risque': [],  # Pour afficher l'origine du risque
        'scenario_critique': '',  # Description du scénario critique
        'reactions_chimiques': [],  # Réactions possibles
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
    
    # ÉTAPE 2: Chargement des bases de données
    substances_db = load_substances()
    incompatibilities_db = load_incompatibilities()
    
    if not substances_db:
        result['success'] = False
        result['erreurs'].append("Impossible de charger la base de données des substances")
        return result
    
    # ÉTAPE 3: Extraction et normalisation des substances demandées
    substance_names = input_data.get('substances', [])
    quantities = input_data.get('quantites', {})
    context = input_data.get('contexte_labo', {})
    
    print(f"[ANALYZER DEBUG] Input data received: {input_data}")
    print(f"[ANALYZER DEBUG] Context extracted: {context}")
    
    # Recherche et validation de chaque substance
    found_substances = []
    for name in substance_names:
        substance_data = _find_and_validate_substance(name, substances_db, result)
        if substance_data:
            substance_data['quantite'] = quantities.get(name, 0)
            found_substances.append(substance_data)
    
    if not found_substances:
        result['success'] = False
        result['erreurs'].append("Aucune substance valide n'a pu être identifiée")
        return result
    
    # ÉTAPE 4: Évaluation des risques individuels pour chaque substance
    all_inflammability_scores = []
    all_toxicity_scores = []
    
    for substance in found_substances:
        # Évaluation de l'inflammabilité
        inflam_result = evaluate_inflammability(substance)
        
        # Évaluation de la toxicité
        tox_result = evaluate_toxicity(substance)
        
        # Stockage des résultats
        all_inflammability_scores.append(inflam_result['score'])
        all_toxicity_scores.append(tox_result['score'])
        
        # Ajout des détails pour cette substance
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
    
    # ÉTAPE 5: Calcul des scores moyens pour inflammabilité et toxicité
    avg_inflammability = sum(all_inflammability_scores) / len(all_inflammability_scores) if all_inflammability_scores else 0
    avg_toxicity = sum(all_toxicity_scores) / len(all_toxicity_scores) if all_toxicity_scores else 0
    
    # Prise du score maximum plutôt que moyenne pour être plus conservateur
    max_inflammability = max(all_inflammability_scores) if all_inflammability_scores else 0
    max_toxicity = max(all_toxicity_scores) if all_toxicity_scores else 0
    
    # ÉTAPE 6: Évaluation des incompatibilités + DÉTECTION RÉACTIONS DANGEREUSES
    incompatibility_score = 0
    incompatibility_details = []
    is_dangerous_reaction_detected = False
    dangerous_reaction_info = None
    
    print(f"[ANALYZER DEBUG] Found substances count: {len(found_substances)}")
    print(f"[ANALYZER DEBUG] Found substances: {[s.get('nom') for s in found_substances]}")
    print(f"[ANALYZER DEBUG] Incompatibilities DB count: {len(incompatibilities_db)}")
    
    if len(found_substances) > 1:
        # Détection de toutes les incompatibilités
        detected_incomp = check_multiple_incompatibilities(found_substances, incompatibilities_db)
        
        print(f"[ANALYZER DEBUG] Detected incompatibilities: {len(detected_incomp)}")
        for inc in detected_incomp:
            print(f"[ANALYZER DEBUG]   - {inc['substance1']} + {inc['substance2']}: score={inc['score']}")
        
        if detected_incomp:
            # Prise du score d'incompatibilité le plus élevé
            incompatibility_score = max([inc['score'] for inc in detected_incomp])
            
            # Stockage des détails et détection de réactions dangereuses
            for inc in detected_incomp:
                # VÉRIFIER SI C'EST UNE RÉACTION DANGEREUSE CONNUE
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
                    print(f"[ANALYZER DEBUG] REACTION DANGEREUSE DETECTEE: {inc['substance1']} + {inc['substance2']} -> {danger_info.get('produit')}")
                
                incompatibility_details.append({
                    'substances': [inc['substance1'], inc['substance2']],
                    'score': inc['score'],
                    'niveau': inc['niveau'],
                    'explication': inc['explication'],
                    'is_dangerous': is_dangerous,
                    'dangerous_info': danger_info if is_dangerous else None
                })
                
                # AJOUTER À reactions_chimiques pour affichage frontend
                if inc.get('equation_reaction') or inc.get('produit_reaction'):
                    result['reactions_chimiques'].append({
                        'substances': f"{inc['substance1']} + {inc['substance2']}",
                        'product': inc.get('produit_reaction', ''),
                        'formula': inc.get('formule_produit', ''),
                        'equation': inc.get('equation_reaction', ''),
                        'justification': inc.get('justification', ''),
                        'risk_level': inc.get('niveau', 'MOYEN'),
                        'type_reaction': inc.get('type_reaction', '')
                    })
                
                # Ajout des recommandations de stockage
                sub1_data = next((s for s in found_substances if s.get('nom') == inc['substance1']), None)
                sub2_data = next((s for s in found_substances if s.get('nom') == inc['substance2']), None)
                
                if sub1_data and sub2_data:
                    storage_recs = get_storage_recommendations(sub1_data, sub2_data, incompatibilities_db)
                    result['recommandations'].extend(storage_recs)
    
    # ÉTAPE 7: Agrégation des scores avec NOUVELLE LOGIQUE HSE
    individual_scores = {
        'inflammabilite': max_inflammability,
        'toxicite': max_toxicity,
        'incompatibilites': incompatibility_score
    }
    
    # Calcul du score global HSE: 20% inflamm + 35% tox + 45% incomp
    global_result = calculate_global_risk_score(
        individual_scores,
        is_dangerous_reaction_detected=is_dangerous_reaction_detected
    )
    
    base_score = global_result['score_global']  # Score 0-50 AVANT facteurs environnementaux
    print(f"[ANALYZER DEBUG] Base score (0-50): {base_score}")
    print(f"[ANALYZER DEBUG] Dangerous reaction detected: {is_dangerous_reaction_detected}")
    
    # ÉTAPE 7.5: Ajustement du score en fonction des conditions environnementales (MULTIPLICATIF)
    temperature = context.get('temperature_c')
    humidity = context.get('humidite_percent')
    ventilation = context.get('ventilation')  # Oui/Non
    final_score = base_score
    environmental_factors = {}
    
    print(f"[ANALYZER DEBUG] Temperature: {temperature}, Humidity: {humidity}, Ventilation: {ventilation}")
    
    if temperature is not None and humidity is not None:
        print(f"[ANALYZER DEBUG] Calculating environmental adjustments (MULTIPLICATIVE)...")
        
        # Appliquer les ajustements MULTIPLICATIFS
        final_score = apply_environmental_adjustments(
            base_score,
            temperature_c=temperature,
            humidity_percent=humidity,
            ventilation=ventilation,
            is_dangerous_reaction=is_dangerous_reaction_detected
        )
        
        print(f"[ANALYZER DEBUG] Original score: {base_score}, Adjusted: {final_score}")
        
        environmental_factors = {
            'temperature_c': temperature,
            'humidity_percent': humidity,
            'ventilation': ventilation,
            'base_score': base_score,
            'final_score': final_score
        }
        
        result['environnemental_factors'] = environmental_factors
    else:
        print(f"[ANALYZER DEBUG] Environmental factors NOT calculated - temperature or humidity is None")
    # ÉTAPE 8: Construction du résultat final avec NOUVEAU SCORING
    result['score_global'] = final_score
    
    # Déterminer le niveau de risque basé sur le score final (utiliser fonction du module)
    from Scoring.risk_score import get_risk_level_only
    risk_level = get_risk_level_only(final_score)
    result['niveau_risque'] = risk_level
    
    print(f"[ANALYZER DEBUG] Final result: score={final_score}, level={risk_level}")
    
    result['details']['inflammabilite'] = {
        'score': max_inflammability,
        'score_moyen': round(avg_inflammability, 1),
        'explication': f"Score maximum d'inflammabilité parmi les substances: {max_inflammability}"
    }
    
    result['details']['toxicite'] = {
        'score': max_toxicity,
        'score_moyen': round(avg_toxicity, 1),
        'explication': f"Score maximum de toxicité parmi les substances: {max_toxicity}"
    }
    
    result['details']['incompatibilites'] = incompatibility_details
    
    # Ajouter les scores pondérés (décomposition du score global)
    result['details']['scores_ponderes'] = global_result['scores_ponderes']
    result['details']['base_score'] = base_score
    result['details']['final_score'] = final_score
    result['details']['explication_globale'] = global_result['explication']
    
    if is_dangerous_reaction_detected and dangerous_reaction_info:
        result['details']['dangerous_reaction'] = dangerous_reaction_info
    
    # Créer un mapping pour 'scores_details' (utilisé par le frontend)
    result['scores_details'] = {
        'inflammabilite': max_inflammability,
        'toxicite': max_toxicity,
        'incompatibilites': incompatibility_score
    }
    
    # ÉTAPE 8.5: Créer l'origine du risque basée sur les scores
    origines = []
    if max_inflammability >= 40:
        origines.append({'icon': '🔥', 'text': 'Inflam...'})  # Inflammabilité
    if max_toxicity >= 40:
        origines.append({'icon': '☠️', 'text': 'Tox...'})  # Toxicité
    if incompatibility_score >= 40:
        origines.append({'icon': '⚡', 'text': 'Inco...'})  # Incompatibilité
    if max_inflammability >= 50:
        origines.append({'icon': '🔧', 'text': 'Réac...'})  # Réactivité
    
    result['origines_risque'] = origines[:4]  # Limiter à 4
    
    # Créer un scénario critique basé sur les risques
    if is_dangerous_reaction_detected and dangerous_reaction_info:
        result['scenario_critique'] = f"🚨 RÉACTION DANGEREUSE CONNUE: {dangerous_reaction_info['produit']} ({dangerous_reaction_info['formule']}) - {dangerous_reaction_info['toxicite']}"
    elif max_inflammability >= 70 and max_toxicity >= 70:
        result['scenario_critique'] = f"Mélange accidentel de substances hautement inflammables et toxiques - formation possible de composés dangereux, gaz toxiques, potentiel d'explosion"
    elif max_inflammability >= 70:
        result['scenario_critique'] = f"Réaction de combustion rapide du mélange - potentiel d'explosion, projection de matières chaudes"
    elif max_toxicity >= 70:
        result['scenario_critique'] = f"Dégagement de gaz toxiques en forte concentration - risque d'intoxication aigüe"
    elif incompatibility_score >= 70:
        result['scenario_critique'] = f"Réaction vigoureuse entre les substances - dégagement de chaleur, projection de produits"
    else:
        result['scenario_critique'] = f"Exposition à des substances présentant un risque modéré - respect des mesures de sécurité requis"
    
    # ÉTAPE 9: Génération des recommandations générales
    general_recs = get_recommendations_by_level(final_score)  # Utiliser le score final pour les recommandations
    result['recommandations'].extend(general_recs)
    
    # Ajout de recommandations spécifiques selon les risques identifiés
    if max_inflammability >= 60:
        result['recommandations'].append("⚠️ Risque d'inflammabilité élevé détecté : éloigner toute source d'ignition")
    
    if max_toxicity >= 70:
        result['recommandations'].append("☠️ Risque toxicologique élevé détecté : manipulation sous hotte obligatoire")
    
    if incompatibility_score >= 60:
        result['recommandations'].append("🔴 Incompatibilités sévères détectées : ne jamais mélanger ces substances")
    
    # Ajouter les recommandations spécifiques de réaction dangereuse
    if is_dangerous_reaction_detected and dangerous_reaction_info:
        for rec in dangerous_reaction_info.get('recommandations', []):
            result['recommandations'].append(f"🚨 {rec}")
    
    # Prise en compte du contexte de laboratoire
    if context:
        context_warnings = _evaluate_context(context, individual_scores, environmental_factors)
        result['avertissements'].extend(context_warnings)
    
    # Suppression des doublons dans les recommandations
    result['recommandations'] = list(dict.fromkeys(result['recommandations']))
    
    return result


def _validate_input(input_data):
    """
    Valide les données d'entrée.
    
    Args:
        input_data (dict): Données à valider
    
    Returns:
        list: Liste des erreurs de validation (vide si tout est valide)
    """
    errors = []
    
    if not isinstance(input_data, dict):
        errors.append("Les données d'entrée doivent être un dictionnaire")
        return errors
    
    if 'substances' not in input_data:
        errors.append("Le champ 'substances' est obligatoire")
        return errors
    
    substances = input_data.get('substances', [])
    
    if not isinstance(substances, list):
        errors.append("Le champ 'substances' doit être une liste")
        return errors
    
    if len(substances) == 0:
        errors.append("La liste de substances ne peut pas être vide")
        return errors
    
    if len(substances) > 10:
        errors.append("Trop de substances (maximum 10 par analyse)")
    
    # Validation des noms de substances
    for name in substances:
        if not is_valid_chemical_name(name):
            errors.append(f"Nom de substance invalide: '{name}'")
    
    return errors


def _find_and_validate_substance(name, substances_db, result):
    """
    Recherche et valide une substance dans la base de données.
    
    Args:
        name (str): Nom de la substance à rechercher
        substances_db (dict): Base de données des substances
        result (dict): Dictionnaire de résultat pour stocker les erreurs/avertissements
    
    Returns:
        dict or None: Données de la substance si trouvée, None sinon
    """
    # Normalisation du nom
    cleaned_name = clean_input(name)
    
    # Recherche par nom
    substance = find_substance_by_name(cleaned_name, substances_db)
    
    if substance:
        return substance
    
    # Si pas trouvée, essayer de rechercher par CAS si le format correspond
    if '-' in cleaned_name:
        substance = find_substance_by_cas(cleaned_name, substances_db)
        if substance:
            return substance
    
    # Substance non trouvée
    result['avertissements'].append(
        f"Substance '{name}' non trouvée dans la base de données. "
        f"Évaluation basée sur des valeurs par défaut."
    )
    
    # Création d'une substance par défaut avec données minimales
    return {
        'nom': cleaned_name,
        'cas': None,
        'point_eclair': None,
        'toxicite': 'NOCIF',
        'categorie': 'non_classee'
    }


def _evaluate_context(context, individual_scores, environmental_factors=None):
    """
    Évalue les conditions de laboratoire et génère des avertissements si nécessaire.
    
    Args:
        context (dict): Conditions de laboratoire
        individual_scores (dict): Scores individuels des risques
        environmental_factors (dict): Résultats du calcul des facteurs environnementaux
    
    Returns:
        list: Liste d'avertissements contextuels
    """
    warnings = []
    
    # Vérification de la ventilation
    ventilation = context.get('ventilation', True)
    if not ventilation and individual_scores['toxicite'] >= 40:
        warnings.append("⚠️ Absence de ventilation avec substances toxiques : risque accru d'intoxication")
    
    if not ventilation and individual_scores['inflammabilite'] >= 50:
        warnings.append("⚠️ Absence de ventilation avec substances inflammables : risque d'accumulation de vapeurs")
    
    # Utiliser les facteurs environnementaux calculés si disponibles
    if environmental_factors:
        # Avertissements générés par le calculateur de taux de réaction
        for warning in environmental_factors.get('warnings', []):
            if '✅' not in warning:  # Ne pas inclure les avertissements positifs
                warnings.append(warning)
        
        # Recommandations de sécurité basées sur la température
        temp = environmental_factors.get('temperature')
        if temp and temp > 50:
            temp_rec = f"🌡️ Température à {temp}°C : multiplicateur de réaction = {environmental_factors.get('reaction_rate_multiplier', 1.0)}x"
            warnings.append(temp_rec)
    else:
        # Fallback à la vérification simple de la température (ancien code)
        temperature = context.get('temperature_c')
        if temperature and temperature > 25 and individual_scores['inflammabilite'] >= 60:
            warnings.append(f"⚠️ Température élevée ({temperature}°C) : augmente le risque d'inflammation")
    
    # Vérification de l'humidité (si fournie)
    humidite = context.get('humidite_percent')
    if humidite and humidite < 30:
        warnings.append("⚠️ Faible humidité : risque accru d'électricité statique")
    
    return warnings


def analyze_single_substance(substance_name):
    """
    Analyse simplifiée pour une seule substance.
    
    Args:
        substance_name (str): Nom de la substance à analyser
    
    Returns:
        dict: Résultat de l'analyse
    """
    input_data = {
        'substances': [substance_name]
    }
    
    return analyze_risk(input_data)


def analyze_substance_pair(substance1, substance2):
    """
    Analyse ciblée sur les incompatibilités entre deux substances.
    
    Args:
        substance1 (str): Nom de la première substance
        substance2 (str): Nom de la deuxième substance
    
    Returns:
        dict: Résultat de l'analyse focalisée sur les incompatibilités
    """
    input_data = {
        'substances': [substance1, substance2]
    }
    
    return analyze_risk(input_data)


def get_substance_info(substance_name):
    """
    Récupère les informations détaillées d'une substance.
    
    Args:
        substance_name (str): Nom de la substance
    
    Returns:
        dict or None: Informations de la substance
    """
    substances_db = load_substances()
    return find_substance_by_name(substance_name, substances_db)


def list_available_substances():
    """
    Liste toutes les substances disponibles dans la base de données.
    
    Returns:
        list: Liste des noms de substances disponibles
    """
    substances_db = load_substances()
    return [sub['nom'] for sub in substances_db.values()]