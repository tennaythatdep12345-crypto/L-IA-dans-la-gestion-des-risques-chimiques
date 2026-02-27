// frontend/js/api.js
/**
 * Module API pour communiquer avec le backend Node.js
 * Projet IUT Génie Chimique - 1ère année
 * 
 * Ce module encapsule toutes les requêtes HTTP vers l'API backend.
 * Il fournit une interface simple et réutilisable pour l'analyse des risques chimiques.
 * 
 * Utilisation:
 * import { analyzeChemicalRisk } from './api.js';
 * const result = await analyzeChemicalRisk({ substances: ["Éthanol"] });
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration de l'URL de base de l'API
 * 
 * En développement local: http://localhost:3000
 * En production: utiliser un chemin relatif ou l'URL du serveur de production
 */
const API_CONFIG = {
    // URL de base (détectée automatiquement selon l'environnement)
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '/api',
    
    // Endpoints disponibles
    ENDPOINTS: {
        ANALYZE: '/analyze',
        HEALTH: '/health',
        SUBSTANCES: '/substances'
    },
    
    // Configuration des timeouts (en millisecondes)
    TIMEOUT: 30000, // 30 secondes pour l'analyse
    
    // En-têtes par défaut
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Crée une promesse avec timeout
 * Permet d'interrompre une requête si elle prend trop de temps
 * 
 * @param {Promise} promise - Promesse à exécuter
 * @param {number} timeout - Délai d'expiration en millisecondes
 * @returns {Promise} - Promesse avec timeout
 */
function withTimeout(promise, timeout) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(
                    `La requête a expiré après ${timeout / 1000} secondes. ` +
                    `Le serveur met trop de temps à répondre.`
                ));
            }, timeout);
        })
    ]);
}

/**
 * Valide les données d'entrée avant envoi à l'API
 * 
 * @param {Object} inputData - Données à valider
 * @throws {Error} Si les données sont invalides
 */
function validateInputData(inputData) {
    // Vérification que inputData existe et est un objet
    if (!inputData || typeof inputData !== 'object') {
        throw new Error('Les données d\'entrée doivent être un objet JSON valide');
    }
    
    // Vérification du champ obligatoire 'substances'
    if (!inputData.substances) {
        throw new Error('Le champ "substances" est obligatoire');
    }
    
    // Vérification que 'substances' est un tableau
    if (!Array.isArray(inputData.substances)) {
        throw new Error('Le champ "substances" doit être un tableau');
    }
    
    // Vérification que le tableau n'est pas vide
    if (inputData.substances.length === 0) {
        throw new Error('Le tableau "substances" ne peut pas être vide');
    }
    
    // Vérification que toutes les substances sont des chaînes
    for (const substance of inputData.substances) {
        if (typeof substance !== 'string' || substance.trim().length === 0) {
            throw new Error('Chaque substance doit être une chaîne de caractères non vide');
        }
    }
}

/**
 * Gère les erreurs HTTP et crée des messages d'erreur explicites
 * 
 * @param {Response} response - Réponse HTTP
 * @returns {Promise<Object>} - Données JSON de l'erreur
 * @throws {Error} - Erreur avec message formaté
 */
async function handleHttpError(response) {
    let errorData;
    
    try {
        errorData = await response.json();
    } catch (e) {
        // Si la réponse n'est pas du JSON, créer un message générique
        errorData = {
            message: `Erreur HTTP ${response.status}: ${response.statusText}`
        };
    }
    
    // Construction du message d'erreur selon le code de statut
    let errorMessage;
    
    switch (response.status) {
        case 400:
            errorMessage = `Erreur de validation: ${errorData.message || 'Données invalides'}`;
            break;
        
        case 404:
            errorMessage = `Ressource introuvable: ${errorData.message || 'L\'endpoint n\'existe pas'}`;
            break;
        
        case 500:
            errorMessage = `Erreur serveur: ${errorData.message || 'Une erreur interne s\'est produite'}`;
            break;
        
        case 503:
            errorMessage = `Service indisponible: ${errorData.message || 'Le serveur n\'est pas accessible'}`;
            break;
        
        case 504:
            errorMessage = `Timeout: ${errorData.message || 'Le serveur a mis trop de temps à répondre'}`;
            break;
        
        default:
            errorMessage = errorData.message || `Erreur HTTP ${response.status}`;
    }
    
    throw new Error(errorMessage);
}

// ============================================================================
// FONCTION PRINCIPALE D'ANALYSE
// ============================================================================

/**
 * Envoie une requête d'analyse des risques chimiques au backend
 * 
 * Cette fonction est le point d'entrée principal pour communiquer avec l'API.
 * Elle envoie les données d'analyse et retourne les résultats.
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
 *   - substances_analysees: Détails de chaque substance
 * 
 * @throws {Error} En cas d'erreur de validation, de réseau, ou de serveur
 * 
 * @example
 * // Analyse simple d'une substance
 * const result = await analyzeChemicalRisk({
 *   substances: ["Éthanol"]
 * });
 * 
 * @example
 * // Analyse complète avec quantités et contexte
 * const result = await analyzeChemicalRisk({
 *   substances: ["Éthanol", "Acétone"],
 *   quantites: {
 *     "Éthanol": 500,
 *     "Acétone": 250
 *   },
 *   contexte_labo: {
 *     ventilation: true,
 *     temperature_c: 22
 *   }
 * });
 */
async function analyzeChemicalRisk(inputData) {
    try {
        // ÉTAPE 1: Validation des données d'entrée
        console.log('[API] Validation des données d\'entrée...');
        validateInputData(inputData);
        
        // ÉTAPE 2: Construction de l'URL complète
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE}`;
        console.log(`[API] Envoi de la requête à: ${url}`);
        console.log('[API] Données envoyées:', inputData);
        
        // ÉTAPE 3: Préparation de la requête HTTP POST
        const requestOptions = {
            method: 'POST',
            headers: API_CONFIG.DEFAULT_HEADERS,
            body: JSON.stringify(inputData)
        };
        
        // ÉTAPE 4: Envoi de la requête avec timeout
        const response = await withTimeout(
            fetch(url, requestOptions),
            API_CONFIG.TIMEOUT
        );
        
        // ÉTAPE 5: Vérification du code de statut HTTP
        if (!response.ok) {
            console.error(`[API] Erreur HTTP ${response.status}`);
            await handleHttpError(response);
        }
        
        // ÉTAPE 6: Extraction et validation de la réponse JSON
        const result = await response.json();
        console.log('[API] Réponse reçue avec succès');
        console.log('[API] Score global:', result.score_global);
        console.log('[API] Niveau de risque:', result.niveau_risque);
        
        // ÉTAPE 7: Validation minimale de la structure de réponse
        if (typeof result.score_global === 'undefined' || !result.niveau_risque) {
            console.warn('[API] La réponse ne contient pas tous les champs attendus');
        }
        
        return result;
        
    } catch (error) {
        // Gestion des différents types d'erreurs
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // Erreur de réseau (serveur inaccessible)
            console.error('[API] Erreur de connexion au serveur');
            throw new Error(
                'Impossible de contacter le serveur d\'analyse. ' +
                'Vérifiez que le backend Node.js est démarré et accessible sur ' +
                API_CONFIG.BASE_URL
            );
        }
        
        // Propagation de l'erreur
        console.error('[API] Erreur lors de l\'analyse:', error.message);
        throw error;
    }
}

// ============================================================================
// FONCTIONS SECONDAIRES
// ============================================================================

/**
 * Vérifie l'état de santé du backend
 * 
 * @returns {Promise<Object>} - État du backend
 * 
 * @example
 * const health = await checkBackendHealth();
 * console.log(health.status); // "healthy" ou "unhealthy"
 */
async function checkBackendHealth() {
    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`;
        console.log(`[API] Vérification de l'état du backend: ${url}`);
        
        const response = await withTimeout(
            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }),
            5000 // 5 secondes pour le health check
        );
        
        if (!response.ok) {
            return {
                status: 'unhealthy',
                message: `Le backend a répondu avec le code ${response.status}`,
                available: true
            };
        }
        
        const data = await response.json();
        console.log('[API] État du backend:', data);
        
        return {
            status: 'healthy',
            ...data
        };
        
    } catch (error) {
        console.error('[API] Le backend n\'est pas accessible:', error.message);
        
        return {
            status: 'unhealthy',
            message: error.message,
            available: false
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
    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBSTANCES}`;
        console.log(`[API] Récupération de la liste des substances: ${url}`);
        
        const response = await withTimeout(
            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }),
            10000 // 10 secondes
        );
        
        if (!response.ok) {
            await handleHttpError(response);
        }
        
        const substances = await response.json();
        console.log(`[API] ${substances.length || 0} substances récupérées`);
        
        return substances;
        
    } catch (error) {
        console.error('[API] Erreur lors de la récupération des substances:', error.message);
        throw error;
    }
}

/**
 * Fonction helper pour analyser une seule substance
 * 
 * @param {string} substanceName - Nom de la substance
 * @returns {Promise<Object>} - Résultat de l'analyse
 * 
 * @example
 * const result = await analyzeSingleSubstance("Éthanol");
 */
async function analyzeSingleSubstance(substanceName) {
    if (!substanceName || typeof substanceName !== 'string') {
        throw new Error('Le nom de la substance doit être une chaîne de caractères non vide');
    }
    
    return analyzeChemicalRisk({
        substances: [substanceName]
    });
}

/**
 * Fonction helper pour analyser une paire de substances
 * (utile pour détecter les incompatibilités)
 * 
 * @param {string} substance1 - Première substance
 * @param {string} substance2 - Deuxième substance
 * @returns {Promise<Object>} - Résultat de l'analyse
 * 
 * @example
 * const result = await analyzeSubstancePair("Acide sulfurique", "Eau de javel");
 */
async function analyzeSubstancePair(substance1, substance2) {
    if (!substance1 || !substance2) {
        throw new Error('Les deux substances doivent être fournies');
    }
    
    return analyzeChemicalRisk({
        substances: [substance1, substance2]
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export des fonctions pour utilisation dans d'autres modules
// Si vous utilisez des modules ES6, décommentez les lignes suivantes:
// export {
//     analyzeChemicalRisk,
//     checkBackendHealth,
//     getAvailableSubstances,
//     analyzeSingleSubstance,
//     analyzeSubstancePair,
//     API_CONFIG
// };

// Pour compatibilité avec les scripts classiques (non-module)
if (typeof window !== 'undefined') {
    window.ChemicalRiskAPI = {
        analyzeChemicalRisk,
        checkBackendHealth,
        getAvailableSubstances,
        analyzeSingleSubstance,
        analyzeSubstancePair,
        config: API_CONFIG
    };
    
    console.log('[API] Module ChemicalRiskAPI chargé avec succès');
    console.log('[API] Backend URL configurée:', API_CONFIG.BASE_URL);
}