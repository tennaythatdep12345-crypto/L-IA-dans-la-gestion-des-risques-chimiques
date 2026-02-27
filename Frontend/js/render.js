// frontend/js/render.js
/**
 * Module de rendu pour l'affichage des résultats d'analyse
 * Projet IUT Génie Chimique - 1ère année
 * 
 * Ce module gère l'affichage dynamique des résultats de l'analyse des risques chimiques.
 * Il met à jour le DOM avec les données reçues de l'API backend sans recharger la page.
 * 
 * Fonctionnalités principales:
 * - Affichage du score global et du niveau de risque avec code couleur
 * - Affichage des scores détaillés par catégorie
 * - Affichage des substances analysées
 * - Affichage des recommandations de sécurité
 * - Gestion des erreurs et des données manquantes
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Mapping des niveaux de risque vers les classes CSS
 * Ces classes définissent les couleurs des badges de risque
 */
const RISK_LEVEL_CLASSES = {
    'FAIBLE': 'risk-faible',    // Vert
    'MOYEN': 'risk-moyen',       // Orange
    'ELEVE': 'risk-eleve'        // Rouge
};

/**
 * Mapping des niveaux de risque vers les labels affichés
 */
const RISK_LEVEL_LABELS = {
    'FAIBLE': 'Risque Faible',
    'MOYEN': 'Risque Moyen',
    'ELEVE': 'Risque Élevé'
};

/**
 * Icônes pour les différentes catégories de risque
 */
const CATEGORY_ICONS = {
    'inflammabilite': '🔥',
    'toxicite': '☠️',
    'incompatibilites': '⚠️'
};

/**
 * Icônes pour les recommandations
 */
const RECOMMENDATION_ICONS = {
    'default': '✓',
    'warning': '⚠️',
    'danger': '🔴',
    'info': 'ℹ️'
};

// ============================================================================
// FONCTION PRINCIPALE DE RENDU
// ============================================================================

/**
 * Fonction principale pour afficher les résultats de l'analyse
 * 
 * Cette fonction coordonne l'affichage de tous les éléments des résultats:
 * - Score global et niveau de risque
 * - Détails par catégorie (inflammabilité, toxicité, incompatibilités)
 * - Substances analysées
 * - Recommandations de sécurité
 * - Avertissements
 * 
 * @param {Object} resultData - Données de résultat de l'analyse
 * @param {number} resultData.score_global - Score global (0-100)
 * @param {string} resultData.niveau_risque - Niveau de risque (FAIBLE, MOYEN, ELEVE)
 * @param {Object} resultData.details - Détails par catégorie
 * @param {Array} resultData.recommandations - Liste des recommandations
 * @param {Array} resultData.substances_analysees - Liste des substances
 * @param {Array} [resultData.avertissements] - Liste des avertissements (optionnel)
 * 
 * @example
 * const result = {
 *   score_global: 65,
 *   niveau_risque: "MOYEN",
 *   details: {...},
 *   recommandations: [...]
 * };
 * renderResults(result);
 */
function renderResults(resultData) {
    console.log('[RENDER] Début du rendu des résultats');
    
    // Validation des données
    if (!resultData || typeof resultData !== 'object') {
        console.error('[RENDER] Données de résultat invalides');
        renderError('Les données de résultat sont invalides ou manquantes.');
        return;
    }
    
    // Nettoyage des résultats précédents
    clearPreviousResults();
    
    try {
        // Rendu du score global et du niveau de risque
        renderGlobalScore(resultData.score_global, resultData.niveau_risque);
        
        // Rendu de l'explication globale
        if (resultData.details && resultData.details.explication_globale) {
            renderGlobalExplanation(resultData.details.explication_globale);
        }
        
        // Rendu des détails par catégorie
        if (resultData.details) {
            renderCategoryDetails(resultData.details);
        }
        
        // Rendu des substances analysées
        if (resultData.substances_analysees && Array.isArray(resultData.substances_analysees)) {
            renderSubstances(resultData.substances_analysees);
        }
        
        // Rendu des recommandations
        if (resultData.recommandations && Array.isArray(resultData.recommandations)) {
            renderRecommendations(resultData.recommandations);
        }
        
        // Rendu des avertissements (si présents)
        if (resultData.avertissements && Array.isArray(resultData.avertissements)) {
            renderWarnings(resultData.avertissements);
        }
        
        // Affichage de la section de résultats
        showResultsSection();
        
        // Animation de défilement vers les résultats
        scrollToResults();
        
        console.log('[RENDER] Rendu des résultats terminé avec succès');
        
    } catch (error) {
        console.error('[RENDER] Erreur lors du rendu:', error);
        renderError('Une erreur est survenue lors de l\'affichage des résultats.');
    }
}

// ============================================================================
// FONCTIONS DE RENDU SPÉCIFIQUES
// ============================================================================

/**
 * Affiche le score global et le niveau de risque
 * 
 * @param {number} score - Score global (0-100)
 * @param {string} niveau - Niveau de risque (FAIBLE, MOYEN, ELEVE)
 */
function renderGlobalScore(score, niveau) {
    console.log(`[RENDER] Affichage du score global: ${score}, niveau: ${niveau}`);
    
    // Élément pour le score
    const scoreElement = document.getElementById('globalScore');
    if (scoreElement) {
        scoreElement.textContent = Math.round(score || 0);
        scoreElement.classList.add('fade-in');
    }
    
    // Élément pour le niveau de risque
    const riskLevelElement = document.getElementById('riskLevel');
    if (riskLevelElement) {
        // Nettoyage des classes précédentes
        riskLevelElement.className = 'risk-badge';
        
        // Ajout de la classe de couleur appropriée
        const riskClass = RISK_LEVEL_CLASSES[niveau] || 'risk-unknown';
        riskLevelElement.classList.add(riskClass);
        
        // Mise à jour du texte
        const riskLabel = RISK_LEVEL_LABELS[niveau] || niveau;
        riskLevelElement.textContent = riskLabel;
        riskLevelElement.classList.add('fade-in');
    }
}

/**
 * Affiche l'explication globale du risque
 * 
 * @param {string} explanation - Texte d'explication
 */
function renderGlobalExplanation(explanation) {
    const explanationElement = document.getElementById('globalExplanation');
    
    if (explanationElement && explanation) {
        explanationElement.textContent = explanation;
        explanationElement.classList.add('fade-in');
    }
}

/**
 * Affiche les détails pour chaque catégorie de risque
 * 
 * @param {Object} details - Objet contenant les détails par catégorie
 */
function renderCategoryDetails(details) {
    console.log('[RENDER] Affichage des détails par catégorie');
    
    // Inflammabilité
    if (details.inflammabilite) {
        renderCategoryScore(
            'inflameScore',
            'inflameExplanation',
            details.inflammabilite.score,
            details.inflammabilite.explication
        );
    }
    
    // Toxicité
    if (details.toxicite) {
        renderCategoryScore(
            'toxicityScore',
            'toxicityExplanation',
            details.toxicite.score,
            details.toxicite.explication
        );
    }
    
    // Incompatibilités
    renderIncompatibilities(details.incompatibilites || []);
}

/**
 * Affiche le score et l'explication pour une catégorie
 * 
 * @param {string} scoreElementId - ID de l'élément pour le score
 * @param {string} explanationElementId - ID de l'élément pour l'explication
 * @param {number} score - Score de la catégorie
 * @param {string} explanation - Explication textuelle
 */
function renderCategoryScore(scoreElementId, explanationElementId, score, explanation) {
    // Affichage du score
    const scoreElement = document.getElementById(scoreElementId);
    if (scoreElement) {
        scoreElement.textContent = Math.round(score || 0);
        scoreElement.classList.add('fade-in');
    }
    
    // Affichage de l'explication
    const explanationElement = document.getElementById(explanationElementId);
    if (explanationElement && explanation) {
        explanationElement.textContent = explanation;
        explanationElement.classList.add('fade-in');
    }
}

/**
 * Affiche les incompatibilités détectées
 * 
 * @param {Array} incompatibilities - Liste des incompatibilités
 */
function renderIncompatibilities(incompatibilities) {
    const scoreElement = document.getElementById('incompatScore');
    const explanationElement = document.getElementById('incompatExplanation');
    
    if (incompatibilities.length > 0) {
        // Calcul du score maximum parmi les incompatibilités
        const maxScore = Math.max(...incompatibilities.map(inc => inc.score || 0));
        
        if (scoreElement) {
            scoreElement.textContent = Math.round(maxScore);
            scoreElement.classList.add('fade-in');
        }
        
        if (explanationElement) {
            // Construction de la liste des incompatibilités
            const incompatList = incompatibilities.map(inc => {
                const substances = inc.substances ? inc.substances.join(' + ') : '';
                return `${substances}: ${inc.explication || ''}`;
            });
            
            explanationElement.innerHTML = incompatList
                .map(item => `<div class="incompatibility-item">• ${escapeHtml(item)}</div>`)
                .join('');
            explanationElement.classList.add('fade-in');
        }
    } else {
        // Aucune incompatibilité
        if (scoreElement) {
            scoreElement.textContent = '0';
        }
        
        if (explanationElement) {
            explanationElement.textContent = 'Aucune incompatibilité majeure détectée entre les substances.';
            explanationElement.classList.add('fade-in');
        }
    }
}

/**
 * Affiche la liste des substances analysées
 * 
 * @param {Array} substances - Liste des substances avec leurs détails
 */
function renderSubstances(substances) {
    console.log(`[RENDER] Affichage de ${substances.length} substances`);
    
    const container = document.getElementById('substancesDetails');
    
    if (!container) {
        console.warn('[RENDER] Conteneur substancesDetails non trouvé');
        return;
    }
    
    // Nettoyage du conteneur
    container.innerHTML = '';
    
    if (substances.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune substance analysée.</p>';
        return;
    }
    
    // Création d'un élément pour chaque substance
    substances.forEach((substance, index) => {
        const substanceCard = createSubstanceCard(substance);
        substanceCard.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(substanceCard);
    });
}

/**
 * Crée une carte HTML pour une substance
 * 
 * @param {Object} substance - Données de la substance
 * @returns {HTMLElement} - Élément DOM de la carte
 */
function createSubstanceCard(substance) {
    const card = document.createElement('div');
    card.className = 'substance-item fade-in';
    
    // Nom de la substance
    const name = document.createElement('div');
    name.className = 'substance-name';
    name.textContent = substance.nom || 'Substance inconnue';
    card.appendChild(name);
    
    // Numéro CAS
    const cas = document.createElement('div');
    cas.className = 'substance-cas';
    cas.textContent = `CAS: ${substance.cas || 'N/A'}`;
    card.appendChild(cas);
    
    // Quantité (si renseignée)
    if (substance.quantite) {
        const quantity = document.createElement('div');
        quantity.className = 'substance-quantity';
        quantity.textContent = `Quantité: ${substance.quantite} mL/g`;
        card.appendChild(quantity);
    }
    
    // Détails (inflammabilité, toxicité)
    const details = document.createElement('div');
    details.className = 'substance-details';
    
    if (substance.inflammabilite) {
        const inflam = document.createElement('div');
        inflam.className = 'substance-detail-item';
        inflam.innerHTML = `<strong>${CATEGORY_ICONS.inflammabilite} Inflammabilité:</strong> ${escapeHtml(substance.inflammabilite.niveau)} (score: ${substance.inflammabilite.score})`;
        details.appendChild(inflam);
    }
    
    if (substance.toxicite) {
        const tox = document.createElement('div');
        tox.className = 'substance-detail-item';
        tox.innerHTML = `<strong>${CATEGORY_ICONS.toxicite} Toxicité:</strong> ${escapeHtml(substance.toxicite.niveau)} (score: ${substance.toxicite.score})`;
        details.appendChild(tox);
    }
    
    card.appendChild(details);
    
    return card;
}

/**
 * Affiche la liste des recommandations de sécurité
 * 
 * @param {Array} recommendations - Liste des recommandations
 */
function renderRecommendations(recommendations) {
    console.log(`[RENDER] Affichage de ${recommendations.length} recommandations`);
    
    const container = document.getElementById('recommendations');
    
    if (!container) {
        console.warn('[RENDER] Conteneur recommendations non trouvé');
        return;
    }
    
    // Nettoyage du conteneur
    container.innerHTML = '';
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune recommandation spécifique.</p>';
        return;
    }
    
    // Création de la liste
    const list = document.createElement('ul');
    list.className = 'recommendations-list';
    
    recommendations.forEach((rec, index) => {
        const item = createRecommendationItem(rec, index);
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

/**
 * Crée un élément de liste pour une recommandation
 * 
 * @param {string} recommendation - Texte de la recommandation
 * @param {number} index - Index de la recommandation
 * @returns {HTMLElement} - Élément <li>
 */
function createRecommendationItem(recommendation, index) {
    const item = document.createElement('li');
    item.className = 'recommendation-item fade-in';
    item.style.animationDelay = `${index * 0.05}s`;
    
    // Icône
    const icon = document.createElement('span');
    icon.className = 'recommendation-icon';
    icon.textContent = determineRecommendationIcon(recommendation);
    
    // Texte
    const text = document.createElement('span');
    text.className = 'recommendation-text';
    text.textContent = recommendation;
    
    item.appendChild(icon);
    item.appendChild(text);
    
    return item;
}

/**
 * Détermine l'icône appropriée pour une recommandation
 * 
 * @param {string} recommendation - Texte de la recommandation
 * @returns {string} - Icône (emoji)
 */
function determineRecommendationIcon(recommendation) {
    const text = recommendation.toLowerCase();
    
    if (text.includes('interdiction') || text.includes('ne jamais') || text.includes('☠️') || text.includes('🔴')) {
        return RECOMMENDATION_ICONS.danger;
    } else if (text.includes('⚠️') || text.includes('attention') || text.includes('précaution')) {
        return RECOMMENDATION_ICONS.warning;
    } else if (text.includes('ℹ️') || text.includes('information')) {
        return RECOMMENDATION_ICONS.info;
    } else {
        return RECOMMENDATION_ICONS.default;
    }
}

/**
 * Affiche la liste des avertissements
 * 
 * @param {Array} warnings - Liste des avertissements
 */
function renderWarnings(warnings) {
    console.log(`[RENDER] Affichage de ${warnings.length} avertissements`);
    
    const card = document.getElementById('warningsCard');
    const container = document.getElementById('warnings');
    
    if (!card || !container) {
        console.warn('[RENDER] Conteneur warnings non trouvé');
        return;
    }
    
    if (warnings.length === 0) {
        card.style.display = 'none';
        return;
    }
    
    // Affichage de la carte
    card.style.display = 'block';
    
    // Nettoyage du conteneur
    container.innerHTML = '';
    
    // Création de la liste
    const list = document.createElement('ul');
    list.className = 'warnings-list';
    
    warnings.forEach((warning, index) => {
        const item = document.createElement('li');
        item.className = 'warning-item fade-in';
        item.style.animationDelay = `${index * 0.05}s`;
        
        const icon = document.createElement('span');
        icon.className = 'warning-icon';
        icon.textContent = '⚠️';
        
        const text = document.createElement('span');
        text.className = 'warning-text';
        text.textContent = warning;
        
        item.appendChild(icon);
        item.appendChild(text);
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

// ============================================================================
// GESTION DES ERREURS
// ============================================================================

/**
 * Affiche un message d'erreur
 * 
 * @param {string} message - Message d'erreur à afficher
 */
function renderError(message) {
    console.error('[RENDER] Affichage d\'une erreur:', message);
    
    const section = document.getElementById('errorSection');
    const messageElement = document.getElementById('errorMessage');
    
    if (section && messageElement) {
        messageElement.textContent = message;
        section.style.display = 'block';
        section.classList.add('fade-in');
        
        // Masquage de la section de résultats
        hideResultsSection();
        
        // Scroll vers l'erreur
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// ============================================================================
// UTILITAIRES D'INTERFACE
// ============================================================================

/**
 * Efface les résultats précédents avant d'afficher de nouveaux résultats
 */
function clearPreviousResults() {
    console.log('[RENDER] Nettoyage des résultats précédents');
    
    // Nettoyage du score global
    const scoreElement = document.getElementById('globalScore');
    if (scoreElement) {
        scoreElement.textContent = '--';
    }
    
    // Nettoyage du niveau de risque
    const riskLevelElement = document.getElementById('riskLevel');
    if (riskLevelElement) {
        riskLevelElement.className = 'risk-badge risk-unknown';
        riskLevelElement.textContent = '--';
    }
    
    // Nettoyage des conteneurs
    const containers = [
        'globalExplanation',
        'inflameExplanation',
        'toxicityExplanation',
        'incompatExplanation',
        'substancesDetails',
        'recommendations',
        'warnings'
    ];
    
    containers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
    
    // Masquage de la carte d'avertissements
    const warningsCard = document.getElementById('warningsCard');
    if (warningsCard) {
        warningsCard.style.display = 'none';
    }
}

/**
 * Affiche la section des résultats
 */
function showResultsSection() {
    const section = document.getElementById('resultsSection');
    if (section) {
        section.style.display = 'block';
        section.classList.add('fade-in');
    }
}

/**
 * Masque la section des résultats
 */
function hideResultsSection() {
    const section = document.getElementById('resultsSection');
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Fait défiler la page vers la section des résultats
 */
function scrollToResults() {
    const section = document.getElementById('resultsSection');
    if (section) {
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }
}

/**
 * Échappe les caractères HTML pour prévenir les injections XSS
 * 
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export pour utilisation dans d'autres modules
// Si vous utilisez des modules ES6, décommentez:
// export { renderResults, renderError, clearPreviousResults };

// Pour compatibilité avec les scripts classiques
if (typeof window !== 'undefined') {
    window.ChemicalRiskRenderer = {
        renderResults,
        renderError,
        clearPreviousResults,
        showResultsSection,
        hideResultsSection
    };
    
    console.log('[RENDER] Module ChemicalRiskRenderer chargé avec succès');
}