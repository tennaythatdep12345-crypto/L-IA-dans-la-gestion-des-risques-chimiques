// backend_web/services/python_client.js
/**
 * Client HTTP pour communiquer avec le moteur IA Flask (Python)
 * Projet IUT Génie Chimique - 1ère année
 * 
 * Rôle:
 * - Encapsuler toutes les requêtes HTTP vers le moteur d'analyse Flask
 * - Fournir une interface simple et réutilisable pour l'analyse des risques chimiques
 * - Gérer les erreurs de connexion et les timeouts
 * 
 * Utilisation:
 * const { analyzeWithPython, checkPythonEngineHealth } = require('./services/python_client');
 * const result = await analyzeWithPython({ substances: ["Éthanol"] });
 */

const axios = require('axios');

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * URL de base du moteur IA Flask
 * Peut être modifiée via variable d'environnement FLASK_URL
 */
const FLASK_BASE_URL = process.env.FLASK_URL || 'http://localhost:5000';

/**
 * Endpoints disponibles sur le moteur Flask
 */
const ENDPOINTS = {
    ANALYZE: '/analyze',
    HEALTH: '/health',
    SUBSTANCES: '/substances'
};

/**
 * Configuration des timeouts (en millisecondes)
 */
const TIMEOUTS = {
    ANALYZE: 30000,    // 30 secondes pour l'analyse
    HEALTH: 5000,      // 5 secondes pour le health check
    SUBSTANCES: 10000  // 10 secondes pour récupérer la liste
};

/**
 * Configuration de retry (nombre de tentatives en cas d'échec)
 */
const RETRY_CONFIG = {
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000  // Délai entre les tentatives
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Attend un certain délai (pour les retry)
 * 
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Valide les données d'entrée avant envoi au moteur Flask
 * 
 * @param {Object} inputData - Données à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateInputData(inputData) {
    // Vérification que inputData existe
    if (!inputData || typeof inputData !== 'object') {
        return {
            valid: false,
            error: 'Les données d\'entrée doivent être un objet JSON'
        };
    }
    
    // Vérification du champ 'substances'
    if (!inputData.substances) {
        return {
            valid: false,
            error: 'Le champ "substances" est obligatoire'
        };
    }
    
    if (!Array.isArray(inputData.substances)) {
        return {
            valid: false,
            error: 'Le champ "substances" doit être un tableau'
        };
    }
    
    if (inputData.substances.length === 0) {
        return {
            valid: false,
            error: 'Le tableau "substances" ne peut pas être vide'
        };
    }
    
    // Vérification que les substances sont des chaînes de caractères
    for (const substance of inputData.substances) {
        if (typeof substance !== 'string') {
            return {
                valid: false,
                error: 'Toutes les substances doivent être des chaînes de caractères'
            };
        }
    }
    
    return { valid: true };
}

/**
 * Crée un objet d'erreur standardisé
 * 
 * @param {string} type - Type d'erreur
 * @param {string} message - Message d'erreur
 * @param {Object} details - Détails supplémentaires
 * @returns {Object} - Objet d'erreur
 */
function createError(type, message, details = {}) {
    return {
        error: type,
        message: message,
        details: details,
        timestamp: new Date().toISOString()
    };
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Analyse des risques chimiques via le moteur IA Flask
 * 
 * Cette fonction est le point d'entrée principal pour communiquer avec le moteur Flask.
 * Elle envoie les données d'analyse et retourne les résultats de l'évaluation des risques.
 * 
 * @param {Object} inputData - Données d'entrée pour l'analyse
 * @param {string[]} inputData.substances - Liste des substances à analyser
 * @param {Object} [inputData.quantites] - Quantités optionnelles par substance
 * @param {Object} [inputData.contexte_labo] - Contexte de laboratoire optionnel
 * 
 * @returns {Promise<Object>} - Résultat de l'analyse contenant:
 *   - score_global: Score de risque global (0-100)
 *   - niveau_risque: Niveau qualitatif (FAIBLE, MOYEN, ELEVE)
 *   - details: Détails par catégorie de risque
 *   - recommandations: Liste de recommandations de sécurité
 * 
 * @throws {Error} En cas d'erreur de validation ou de communication
 * 
 * @example
 * const result = await analyzeWithPython({
 *   substances: ["Éthanol", "Acétone"],
 *   quantites: { "Éthanol": 500, "Acétone": 250 }
 * });
 */
async function analyzeWithPython(inputData, retryCount = 0) {
    const functionName = 'analyzeWithPython';
    
    try {
        // Validation des données d'entrée
        const validation = validateInputData(inputData);
        if (!validation.valid) {
            console.error(`[${functionName}] Validation échouée:`, validation.error);
            throw new Error(validation.error);
        }
        
        // Mapper les champs du frontend vers le backend Python
        const mappedData = {
            substances: inputData.substances,
            quantites: inputData.quantites || {},
            contexte_labo: {
                ventilation: inputData.ventilation !== false,
                temperature_c: inputData.temperature ? parseFloat(inputData.temperature) : 22,
                humidite_percent: inputData.humidity ? parseFloat(inputData.humidity) : 50
            }
        };
        
        console.log(`[${functionName}] Envoi de la requête d'analyse au moteur Flask`);
        console.log(`[${functionName}] URL: ${FLASK_BASE_URL}${ENDPOINTS.ANALYZE}`);
        console.log(`[${functionName}] Substances:`, mappedData.substances);
        console.log(`[${functionName}] Contexte:`, mappedData.contexte_labo);
        
        // Requête HTTP POST vers le moteur Flask
        const response = await axios.post(
            `${FLASK_BASE_URL}${ENDPOINTS.ANALYZE}`,
            mappedData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: TIMEOUTS.ANALYZE,
                validateStatus: (status) => status < 500 // Accepter les codes 4xx mais pas 5xx
            }
        );
        
        // Vérification du code de statut
        if (response.status >= 400) {
            console.error(`[${functionName}] Erreur HTTP ${response.status}:`, response.data);
            throw new Error(`Le moteur Flask a retourné une erreur: ${response.data.message || 'Erreur inconnue'}`);
        }
        
        console.log(`[${functionName}] Analyse réussie - Score global: ${response.data.score_global}`);
        console.log(`[${functionName}] Niveau de risque: ${response.data.niveau_risque}`);
        
        return response.data;
        
    } catch (error) {
        // Gestion spécifique des erreurs de connexion
        if (error.code === 'ECONNREFUSED') {
            console.error(`[${functionName}] Connexion refusée au moteur Flask (${FLASK_BASE_URL})`);
            
            // Tentative de retry si configuré
            if (retryCount < RETRY_CONFIG.MAX_RETRIES) {
                console.log(`[${functionName}] Nouvelle tentative ${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES} dans ${RETRY_CONFIG.RETRY_DELAY_MS}ms...`);
                await sleep(RETRY_CONFIG.RETRY_DELAY_MS);
                return analyzeWithPython(inputData, retryCount + 1);
            }
            
            throw new Error(
                `Impossible de se connecter au moteur d'analyse Flask. ` +
                `Vérifiez que le serveur Flask est démarré sur ${FLASK_BASE_URL}`
            );
        }
        
        // Gestion des timeouts
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.error(`[${functionName}] Timeout après ${TIMEOUTS.ANALYZE}ms`);
            throw new Error(
                `Le moteur d'analyse a mis trop de temps à répondre (>${TIMEOUTS.ANALYZE}ms). ` +
                `L'analyse peut être trop complexe ou le serveur est surchargé.`
            );
        }
        
        // Gestion des erreurs axios
        if (error.response) {
            console.error(`[${functionName}] Erreur de réponse:`, error.response.data);
            throw new Error(error.response.data.message || 'Erreur lors de l\'analyse');
        }
        
        // Autres erreurs
        console.error(`[${functionName}] Erreur inattendue:`, error.message);
        throw error;
    }
}

/**
 * Vérifie l'état de santé du moteur IA Flask
 * 
 * @returns {Promise<Object>} - État du moteur Flask
 * 
 * @example
 * const health = await checkPythonEngineHealth();
 * console.log(health.status); // "healthy" ou "unhealthy"
 */
async function checkPythonEngineHealth() {
    const functionName = 'checkPythonEngineHealth';
    
    try {
        console.log(`[${functionName}] Vérification de l'état du moteur Flask`);
        
        const response = await axios.get(
            `${FLASK_BASE_URL}${ENDPOINTS.HEALTH}`,
            {
                timeout: TIMEOUTS.HEALTH,
                validateStatus: () => true // Accepter tous les codes de statut
            }
        );
        
        if (response.status === 200) {
            console.log(`[${functionName}] Moteur Flask opérationnel`);
            return {
                status: 'healthy',
                message: 'Le moteur d\'analyse Flask est opérationnel',
                flask_url: FLASK_BASE_URL,
                timestamp: new Date().toISOString()
            };
        } else {
            console.warn(`[${functionName}] Moteur Flask répond mais avec code ${response.status}`);
            return {
                status: 'degraded',
                message: 'Le moteur répond mais semble avoir des problèmes',
                flask_url: FLASK_BASE_URL,
                http_status: response.status,
                timestamp: new Date().toISOString()
            };
        }
        
    } catch (error) {
        console.error(`[${functionName}] Moteur Flask inaccessible:`, error.message);
        
        return {
            status: 'unhealthy',
            message: 'Le moteur d\'analyse Flask est inaccessible',
            flask_url: FLASK_BASE_URL,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Récupère la liste des substances disponibles dans la base de données
 * 
 * @returns {Promise<string[]>} - Liste des noms de substances
 * 
 * @example
 * const substances = await getAvailableSubstances();
 * console.log(substances); // ["Éthanol", "Acétone", ...]
 */
async function getAvailableSubstances() {
    const functionName = 'getAvailableSubstances';
    
    try {
        console.log(`[${functionName}] Récupération de la liste des substances`);
        
        const response = await axios.get(
            `${FLASK_BASE_URL}${ENDPOINTS.SUBSTANCES}`,
            {
                timeout: TIMEOUTS.SUBSTANCES
            }
        );
        
        console.log(`[${functionName}] ${response.data.length || 0} substances récupérées`);
        
        return response.data;
        
    } catch (error) {
        console.error(`[${functionName}] Erreur lors de la récupération:`, error.message);
        
        if (error.code === 'ECONNREFUSED') {
            throw new Error(
                `Impossible de récupérer la liste des substances. ` +
                `Le moteur Flask n'est pas accessible sur ${FLASK_BASE_URL}`
            );
        }
        
        throw new Error(`Erreur lors de la récupération de la liste des substances: ${error.message}`);
    }
}

/**
 * Analyse une seule substance (fonction helper)
 * 
 * @param {string} substanceName - Nom de la substance à analyser
 * @returns {Promise<Object>} - Résultat de l'analyse
 * 
 * @example
 * const result = await analyzeSingleSubstance("Éthanol");
 */
async function analyzeSingleSubstance(substanceName) {
    if (!substanceName || typeof substanceName !== 'string') {
        throw new Error('Le nom de la substance doit être une chaîne de caractères non vide');
    }
    
    return analyzeWithPython({
        substances: [substanceName]
    });
}

/**
 * Analyse une paire de substances pour détecter les incompatibilités
 * 
 * @param {string} substance1 - Première substance
 * @param {string} substance2 - Deuxième substance
 * @returns {Promise<Object>} - Résultat de l'analyse
 * 
 * @example
 * const result = await analyzeSubstancePair("Acide sulfurique", "Hydroxyde de sodium");
 */
async function analyzeSubstancePair(substance1, substance2) {
    if (!substance1 || !substance2) {
        throw new Error('Les deux noms de substances sont obligatoires');
    }
    
    return analyzeWithPython({
        substances: [substance1, substance2]
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Fonction principale
    analyzeWithPython,
    
    // Fonctions utilitaires
    checkPythonEngineHealth,
    getAvailableSubstances,
    analyzeSingleSubstance,
    analyzeSubstancePair,
    
    // Configuration (pour tests ou debugging)
    FLASK_BASE_URL,
    ENDPOINTS,
    TIMEOUTS
};