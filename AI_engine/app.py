"""
Application Flask - Moteur d'analyse des risques chimiques
Projet: IA dans la gestion des risques chimiques en laboratoire de R&D
IUT Génie Chimique - 1ère année
"""

import logging
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.analyzer import analyze_risk

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialisation de l'application Flask
app = Flask(__name__)

# Activation de CORS (Cross-Origin Resource Sharing)
CORS(app)


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint principal pour l'analyse des risques chimiques.
    
    Entrée JSON attendue:
    {
        "substances": ["Acétone", "Acide sulfurique"],
        "quantites": {
            "Acétone": 500,
            "Acide sulfurique": 100
        },
        "contexte_labo": {
            "ventilation": true,
            "temperature_c": 22
        }
    }
    
    Sortie JSON:
    {
        "success": true,
        "score_risque_global": 65,
        "niveau_risque": "Moyen",
        "risques_detailles": [...],
        "recommandations": [...]
    }
    """
    
    try:
        # Validation du format JSON
        if not request.is_json:
            logger.warning("Requête reçue sans en-tête Content-Type: application/json")
            return jsonify({
                "success": False,
                "erreur": "Le corps de la requête doit être en JSON"
            }), 400
        
        # Extraction des données
        donnees = request.get_json()
        
        # Validation des champs obligatoires
        if not donnees or 'substances' not in donnees:
            logger.warning("Champ 'substances' manquant dans la requête")
            return jsonify({
                "success": False,
                "erreur": "Le champ 'substances' est obligatoire"
            }), 400
        
        substances = donnees.get('substances', [])
        
        # Validation que au moins une substance est fournie
        if not substances or len(substances) == 0:
            logger.warning("Aucune substance fournie")
            return jsonify({
                "success": False,
                "erreur": "Au moins une substance doit être fournie"
            }), 400
        
        # Validation que substances est une liste
        if not isinstance(substances, list):
            logger.warning("Le champ 'substances' doit être une liste")
            return jsonify({
                "success": False,
                "erreur": "Le champ 'substances' doit être une liste"
            }), 400
        
        # Extraction des quantités (optionnel, par défaut vide)
        quantites = donnees.get('quantites', {})
        
        # Extraction du contexte du laboratoire (optionnel)
        contexte_labo = donnees.get('contexte_labo', {
            'ventilation': True,
            'temperature_c': 22
        })
        
        # Validation du contexte du laboratoire
        if not isinstance(contexte_labo, dict):
            logger.warning("Le champ 'contexte_labo' doit être un dictionnaire")
            return jsonify({
                "success": False,
                "erreur": "Le champ 'contexte_labo' doit être un dictionnaire"
            }), 400
        
        logger.info(f"Analyse demandée pour les substances: {substances}")
        logger.info(f"Données reçues complet: {json.dumps(donnees, indent=2)}")
        logger.info(f"Contexte labo: {json.dumps(contexte_labo, indent=2)}")
        
        # Appel du moteur d'analyse
        resultat = analyze_risk(donnees)
        
        # Vérification que le résultat contient les champs attendus
        if not resultat or 'success' not in resultat:
            logger.error("Le moteur d'analyse a retourné un résultat invalide")
            return jsonify({
                "success": False,
                "erreur": "Erreur interne lors de l'analyse"
            }), 500
        
        # Si l'analyse a échoué, retourner l'erreur
        if not resultat.get('success'):
            logger.warning(f"Analyse échouée: {resultat.get('erreurs')}")
            return jsonify(resultat), 400
        
        # Succès: retourner le résultat de l'analyse
        logger.info(f"Analyse réussie. Score: {resultat.get('score_risque_global')}")
        return jsonify(resultat), 200
    
    except ValueError as e:
        # Erreur de validation des données
        logger.error(f"Erreur de validation: {str(e)}")
        return jsonify({
            "success": False,
            "erreur": f"Erreur de validation: {str(e)}"
        }), 400
    
    except Exception as e:
        # Erreur générale non prévue
        logger.error(f"Erreur interne non prévue: {str(e)}")
        return jsonify({
            "success": False,
            "erreur": "Erreur interne du serveur"
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """
    Endpoint de vérification de la santé de l'application.
    """
    logger.info("Vérification de santé demandée")
    return jsonify({
        "status": "ok",
        "message": "Le moteur d'analyse des risques chimiques est operationnel"
    }), 200


@app.errorhandler(404)
def not_found(error):
    """
    Gestion des routes non trouvées.
    """
    logger.warning(f"Endpoint non trouvé: {request.path}")
    return jsonify({
        "success": False,
        "erreur": "Endpoint non trouvé"
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """
    Gestion des méthodes HTTP non autorisées.
    """
    logger.warning(f"Méthode non autorisée: {request.method} sur {request.path}")
    return jsonify({
        "success": False,
        "erreur": "Méthode HTTP non autorisée"
    }), 405


if __name__ == '__main__':
    logger.info("Démarrage du moteur d'analyse des risques chimiques")
    logger.info("Port: 5000")
    logger.info("Endpoint: POST /analyze")
    
    # Lancement de l'application en mode développement
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True
    )
