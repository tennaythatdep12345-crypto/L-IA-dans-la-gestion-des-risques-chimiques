// backend_web/server.js
/**
 * Serveur Node.js - Passerelle API pour le système d'analyse des risques chimiques
 * Projet IUT Génie Chimique - 1ère année
 * 
 * Rôle:
 * - Recevoir les requêtes du frontend web (JavaScript)
 * - Transmettre les données au moteur IA Flask (Python)
 * - Retourner les résultats au frontend
 * 
 * Architecture:
 * Frontend (React/Vue/HTML) <---> Node.js Express <---> Flask AI Engine (Python)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// ============================================================================
// CONFIGURATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// URL du moteur IA Flask (peut être configurée via variable d'environnement)
const FLASK_AI_ENGINE_URL = process.env.FLASK_URL || 'http://localhost:5000';
const ANALYZE_ENDPOINT = `${FLASK_AI_ENGINE_URL}/analyze`;

// Timeout pour les requêtes vers Flask (en millisecondes)
const FLASK_TIMEOUT = 30000; // 30 secondes

// ============================================================================
// MIDDLEWARES
// ============================================================================

// CORS: Permet les requêtes cross-origin depuis le frontend
// En production, remplacer '*' par l'URL spécifique du frontend
app.use(cors({
    origin: '*', // En développement: accepter toutes les origines
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser le JSON dans le body des requêtes
app.use(express.json({ limit: '10mb' }));

// Parser les données URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging pour toutes les requêtes
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Route racine - Information sur l'API
 */
app.get('/', (req, res) => {
    res.json({
        service: 'API Gateway - Gestion des Risques Chimiques',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            analyze: 'POST /analyze',
            health: 'GET /health'
        },
        documentation: 'Envoyer une requête POST à /analyze avec un JSON contenant les substances à analyser'
    });
});

/**
 * Route de santé - Vérifie que le serveur et le moteur IA sont opérationnels
 */
app.get('/health', async (req, res) => {
    try {
        // Tentative de connexion au moteur IA Flask
        const flaskResponse = await axios.get(`${FLASK_AI_ENGINE_URL}/health`, {
            timeout: 5000
        });

        res.json({
            status: 'healthy',
            node_server: 'OK',
            flask_engine: flaskResponse.data.status || 'OK',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[HEALTH CHECK] Erreur lors de la vérification:', error.message);

        res.status(503).json({
            status: 'unhealthy',
            node_server: 'OK',
            flask_engine: 'UNREACHABLE',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Route principale - Analyse des risques chimiques
 * 
 * Entrée attendue (JSON):
 * {
 *   "substances": ["Éthanol", "Acétone"],
 *   "quantites": {
 *     "Éthanol": 500,
 *     "Acétone": 250
 *   },
 *   "contexte_labo": {
 *     "ventilation": true,
 *     "temperature_c": 22
 *   }
 * }
 * 
 * Sortie (JSON):
 * {
 *   "score_global": 65,
 *   "niveau_risque": "MOYEN",
 *   "details": {...},
 *   "recommandations": [...]
 * }
 */
app.post('/analyze', async (req, res) => {
    const startTime = Date.now();

    try {
        // Validation basique de la requête
        if (!req.body || Object.keys(req.body).length === 0) {
            console.warn('[ANALYZE] Requête reçue sans données');
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Le corps de la requête est vide. Veuillez fournir des données à analyser.',
                example: {
                    substances: ['Éthanol'],
                    quantites: { 'Éthanol': 500 }
                }
            });
        }

        // Validation du champ 'substances'
        if (!req.body.substances || !Array.isArray(req.body.substances)) {
            console.warn('[ANALYZE] Champ "substances" manquant ou invalide');
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Le champ "substances" est obligatoire et doit être un tableau.',
                received: req.body
            });
        }

        // Log de la requête reçue
        console.log('[ANALYZE] Données reçues du frontend:');
        console.log(JSON.stringify(req.body, null, 2));

        // Transmission de la requête au moteur IA Flask
        console.log(`[ANALYZE] Transmission au moteur IA Flask: ${ANALYZE_ENDPOINT}`);

        const flaskResponse = await axios.post(ANALYZE_ENDPOINT, req.body, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: FLASK_TIMEOUT
        });

        // Log de la réponse du moteur IA
        const processingTime = Date.now() - startTime;
        console.log(`[ANALYZE] Réponse reçue du moteur IA (${processingTime}ms)`);
        console.log(`[ANALYZE] Score global: ${flaskResponse.data.score_global}`);
        console.log(`[ANALYZE] Niveau de risque: ${flaskResponse.data.niveau_risque}`);

        // Retour de la réponse au frontend
        res.json({
            ...flaskResponse.data,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        // Gestion des différents types d'erreurs
        if (error.code === 'ECONNREFUSED') {
            // Le moteur IA Flask n'est pas accessible
            console.error('[ANALYZE] Impossible de se connecter au moteur IA Flask');
            console.error(`[ANALYZE] URL tentée: ${ANALYZE_ENDPOINT}`);

            return res.status(503).json({
                success: false,
                error: 'Service Unavailable',
                message: 'Le moteur d\'analyse IA n\'est pas accessible. Vérifiez que le serveur Flask est démarré.',
                flask_url: FLASK_AI_ENGINE_URL,
                suggestion: 'Exécutez: python backend_flask/app.py',
                timestamp: new Date().toISOString()
            });

        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            // Timeout de la requête
            console.error(`[ANALYZE] Timeout après ${processingTime}ms`);

            return res.status(504).json({
                success: false,
                error: 'Gateway Timeout',
                message: 'Le moteur d\'analyse a mis trop de temps à répondre.',
                timeout_ms: FLASK_TIMEOUT,
                processing_time_ms: processingTime,
                timestamp: new Date().toISOString()
            });

        } else if (error.response) {
            // Le moteur IA a répondu avec une erreur
            console.error('[ANALYZE] Erreur retournée par le moteur IA:');
            console.error(error.response.data);

            return res.status(error.response.status || 500).json({
                success: false,
                error: 'AI Engine Error',
                message: 'Le moteur d\'analyse a retourné une erreur.',
                details: error.response.data,
                timestamp: new Date().toISOString()
            });

        } else {
            // Erreur inconnue
            console.error('[ANALYZE] Erreur inattendue:');
            console.error(error);

            return res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Une erreur inattendue s\'est produite lors de l\'analyse.',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
});

/**
 * Route pour récupérer la liste des substances disponibles
 * (optionnel - si le moteur IA Flask expose cette fonctionnalité)
 */
app.get('/substances', async (req, res) => {
    try {
        const flaskResponse = await axios.get(`${FLASK_AI_ENGINE_URL}/substances`, {
            timeout: 5000
        });

        res.json(flaskResponse.data);
    } catch (error) {
        console.error('[SUBSTANCES] Erreur lors de la récupération de la liste:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Impossible de récupérer la liste des substances.'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Erreur lors de la récupération de la liste des substances.',
            details: error.message
        });
    }
});

// ============================================================================
// GESTION DES ERREURS GLOBALES
// ============================================================================

/**
 * Gestionnaire pour les routes non définies (404)
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `La route ${req.method} ${req.path} n'existe pas.`,
        available_routes: [
            'GET /',
            'GET /health',
            'POST /analyze',
            'GET /substances'
        ],
        timestamp: new Date().toISOString()
    });
});

/**
 * Gestionnaire d'erreurs global
 */
app.use((err, req, res, next) => {
    console.error('[ERROR] Erreur non gérée:');
    console.error(err.stack);

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Une erreur serveur inattendue s\'est produite.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('Serveur Node.js - Passerelle API pour Gestion des Risques Chimiques');
    console.log('='.repeat(70));
    console.log(`✓ Serveur démarré sur le port ${PORT}`);
    console.log(`✓ URL du serveur: http://localhost:${PORT}`);
    console.log(`✓ URL du moteur IA Flask: ${FLASK_AI_ENGINE_URL}`);
    console.log('');
    console.log('Routes disponibles:');
    console.log(`  - GET  /           : Information sur l'API`);
    console.log(`  - GET  /health     : Vérification de l'état du service`);
    console.log(`  - POST /analyze    : Analyse des risques chimiques`);
    console.log(`  - GET  /substances : Liste des substances disponibles`);
    console.log('');
    console.log('Exemple de requête:');
    console.log(`  curl -X POST http://localhost:${PORT}/analyze \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"substances": ["Ethanol", "Acetone"]}'`);
    console.log('='.repeat(70));
});

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', () => {
    console.log('\n[SHUTDOWN] Réception du signal SIGTERM. Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] Réception du signal SIGINT. Arrêt du serveur...');
    process.exit(0);
});