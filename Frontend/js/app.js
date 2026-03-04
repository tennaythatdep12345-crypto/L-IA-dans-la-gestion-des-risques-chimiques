// frontend/js/app.js
/**
 * Application JavaScript pour le système d'analyse des risques chimiques
 * Projet IUT Génie Chimique - 1ère année
 * 
 * Fonctionnalités:
 * - Collecte des données du formulaire
 * - Envoi des requêtes à l'API backend Node.js
 * - Affichage dynamique des résultats d'analyse
 * - Gestion des erreurs et validation des entrées
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * URL de base de l'API backend
 * Peut être modifiée pour pointer vers un serveur distant
 */
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://l-ia-dans-la-gestion-des-risques-qviy.onrender.com';

const ANALYZE_ENDPOINT = `${API_BASE_URL}/analyze`;

/**
 * Mapping des niveaux de risque vers les classes CSS
 */
const RISK_LEVEL_CLASSES = {
    'FAIBLE': 'risk-faible',
    'MOYEN': 'risk-moyen',
    'ELEVE': 'risk-eleve'
};

/**
 * Mapping des niveaux de risque vers les labels français
 */
const RISK_LEVEL_LABELS = {
    'FAIBLE': 'Faible',
    'MOYEN': 'Moyen',
    'ELEVE': 'Élevé'
};

// ============================================================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Application démarrée');
    
    // Récupération des éléments du DOM
    const form = document.getElementById('analysisForm');
    const resetBtn = document.getElementById('resetBtn');
    const substancesTextarea = document.getElementById('substances');
    
    // Écouteurs d'événements
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', handleFormReset);
    }
    
    if (substancesTextarea) {
        // Génération dynamique des champs de quantités
        substancesTextarea.addEventListener('input', updateQuantityFields);
    }
    
    console.log('Écouteurs d\'événements initialisés');
});

// ============================================================================
// GESTION DU FORMULAIRE
// ============================================================================

/**
 * Gère la soumission du formulaire
 * Empêche le rechargement de la page et déclenche l'analyse
 * 
 * @param {Event} event - Événement de soumission du formulaire
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Empêcher le rechargement de la page
    
    console.log('Formulaire soumis');
    
    // Masquer les sections de résultats et d'erreurs précédentes
    hideResultsSection();
    hideErrorSection();
    
    // Validation des données d'entrée
    const validationResult = validateFormInput();
    if (!validationResult.valid) {
        showError(validationResult.message);
        return;
    }
    
    // Construction de l'objet de données à envoyer
    const inputData = buildInputData();
    console.log('Données à envoyer:', inputData);
    
    // Affichage de l'indicateur de chargement
    showLoadingIndicator();
    
    try {
        // Envoi de la requête à l'API backend
        const result = await sendAnalysisRequest(inputData);
        
        // Masquage de l'indicateur de chargement
        hideLoadingIndicator();
        
        // Affichage des résultats
        displayResults(result);
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        hideLoadingIndicator();
        showError(error.message);
    }
}

/**
 * Réinitialise le formulaire et masque les résultats
 */
function handleFormReset() {
    console.log('Réinitialisation du formulaire');
    
    // Réinitialisation du formulaire HTML
    const form = document.getElementById('analysisForm');
    if (form) {
        form.reset();
    }
    
    // Masquage des sections de résultats et d'erreurs
    hideResultsSection();
    hideErrorSection();
    
    // Réinitialisation des champs de quantités
    const quantitiesContainer = document.getElementById('quantitiesContainer');
    if (quantitiesContainer) {
        quantitiesContainer.innerHTML = '<p class="form-help">Les champs de quantités apparaîtront automatiquement pour chaque substance saisie ci-dessus.</p>';
    }
}

/**
 * Met à jour dynamiquement les champs de quantités
 * en fonction des substances saisies
 */
function updateQuantityFields() {
    const substancesTextarea = document.getElementById('substances');
    const quantitiesContainer = document.getElementById('quantitiesContainer');
    
    if (!substancesTextarea || !quantitiesContainer) {
        return;
    }
    
    // Extraction des substances (une par ligne)
    const substancesText = substancesTextarea.value.trim();
    const substances = substancesText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    // Vider le conteneur
    quantitiesContainer.innerHTML = '';
    
    if (substances.length === 0) {
        quantitiesContainer.innerHTML = '<p class="form-help">Les champs de quantités apparaîtront automatiquement pour chaque substance saisie ci-dessus.</p>';
        return;
    }
    
    // Créer un champ de quantité pour chaque substance
    substances.forEach((substance, index) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'quantity-input-group';
        
        const label = document.createElement('label');
        label.textContent = substance;
        label.htmlFor = `quantity_${index}`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `quantity_${index}`;
        input.name = `quantity_${substance}`;
        input.className = 'form-control-inline';
        input.placeholder = 'mL ou g';
        input.min = '0';
        input.step = '0.1';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        quantitiesContainer.appendChild(inputGroup);
    });
}

// ============================================================================
// VALIDATION DES DONNÉES
// ============================================================================

/**
 * Valide les données du formulaire avant envoi
 * 
 * @returns {Object} - {valid: boolean, message: string}
 */
function validateFormInput() {
    const substancesTextarea = document.getElementById('substances');
    
    // Vérification que le champ substances n'est pas vide
    if (!substancesTextarea || !substancesTextarea.value.trim()) {
        return {
            valid: false,
            message: 'Veuillez saisir au moins une substance chimique.'
        };
    }
    
    // Extraction et validation des substances
    const substances = substancesTextarea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    if (substances.length === 0) {
        return {
            valid: false,
            message: 'Veuillez saisir au moins une substance chimique.'
        };
    }
    
    // Validation réussie
    return {
        valid: true,
        message: 'OK'
    };
}

/**
 * Construit l'objet de données à envoyer à l'API
 * 
 * @returns {Object} - Objet JSON contenant substances, quantités, et contexte
 */
function buildInputData() {
    const substancesTextarea = document.getElementById('substances');
    const ventilationCheckbox = document.getElementById('ventilation');
    const temperatureInput = document.getElementById('temperature');
    const humidityInput = document.getElementById('humidity');
    
    // Extraction des substances
    const substances = substancesTextarea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    // Construction de l'objet de données
    const inputData = {
        substances: substances
    };
    
    // Ajout des quantités si renseignées
    const quantities = {};
    let hasQuantities = false;
    
    substances.forEach((substance, index) => {
        const quantityInput = document.getElementById(`quantity_${index}`);
        if (quantityInput && quantityInput.value) {
            quantities[substance] = parseFloat(quantityInput.value);
            hasQuantities = true;
        }
    });
    
    if (hasQuantities) {
        inputData.quantites = quantities;
    }
    
    // Ajout du contexte de laboratoire
    const contexte = {};
    let hasContexte = false;
    
    if (ventilationCheckbox) {
        contexte.ventilation = ventilationCheckbox.checked;
        hasContexte = true;
    }
    
    if (temperatureInput && temperatureInput.value) {
        contexte.temperature_c = parseFloat(temperatureInput.value);
        hasContexte = true;
    }
    
    if (humidityInput && humidityInput.value) {
        contexte.humidite_percent = parseFloat(humidityInput.value);
        hasContexte = true;
    }
    
    if (hasContexte) {
        inputData.contexte_labo = contexte;
    }
    
    return inputData;
}

// ============================================================================
// COMMUNICATION AVEC L'API
// ============================================================================

/**
 * Envoie une requête d'analyse à l'API backend
 * 
 * @param {Object} inputData - Données d'entrée pour l'analyse
 * @returns {Promise<Object>} - Résultat de l'analyse
 * @throws {Error} - En cas d'erreur de communication ou de réponse
 */
async function sendAnalysisRequest(inputData) {
    try {
        console.log(`Envoi de la requête à ${ANALYZE_ENDPOINT}`);
        
        const response = await fetch(ANALYZE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputData)
        });
        
        // Vérification du code de statut HTTP
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `Erreur HTTP ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // Extraction de la réponse JSON
        const result = await response.json();
        console.log('Résultat reçu:', result);
        
        return result;
        
    } catch (error) {
        // Gestion des erreurs de réseau
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(
                'Impossible de contacter le serveur. ' +
                'Vérifiez que le backend Node.js est démarré sur ' + API_BASE_URL
            );
        }
        
        throw error;
    }
}

// ============================================================================
// AFFICHAGE DES RÉSULTATS
// ============================================================================

/**
 * Affiche les résultats de l'analyse dans la page
 * 
 * @param {Object} result - Résultat de l'analyse depuis l'API
 */
function displayResults(result) {
    console.log('Affichage des résultats');
    
    // Affichage du score global et du niveau de risque
    displayGlobalScore(result.score_global, result.niveau_risque);
    
    // Affichage de l'explication globale
    displayGlobalExplanation(result.details?.explication_globale || '');
    
    // Affichage des détails par catégorie
    displayCategoryDetails(result.details);
    
    // Affichage des substances analysées
    displaySubstances(result.substances_analysees || []);
    
    // Affichage des recommandations
    displayRecommendations(result.recommandations || []);
    
    // Affichage des avertissements (si présents)
    displayWarnings(result.avertissements || []);
    
    // Affichage de la section de résultats
    showResultsSection();
    
    // Scroll vers les résultats
    scrollToResults();
}

/**
 * Affiche le score global et le niveau de risque
 * 
 * @param {number} score - Score global (0-100)
 * @param {string} niveau - Niveau de risque (FAIBLE, MOYEN, ELEVE)
 */
function displayGlobalScore(score, niveau) {
    const scoreElement = document.getElementById('globalScore');
    const riskLevelElement = document.getElementById('riskLevel');
    
    if (scoreElement) {
        scoreElement.textContent = Math.round(score);
    }
    
    if (riskLevelElement) {
        // Suppression des anciennes classes
        riskLevelElement.className = 'risk-badge';
        
        // Ajout de la nouvelle classe de couleur
        const riskClass = RISK_LEVEL_CLASSES[niveau] || 'risk-unknown';
        riskLevelElement.classList.add(riskClass);
        
        // Mise à jour du texte
        const riskLabel = RISK_LEVEL_LABELS[niveau] || niveau;
        riskLevelElement.textContent = riskLabel;
    }
}

/**
 * Affiche l'explication globale du risque
 * 
 * @param {string} explanation - Explication textuelle
 */
function displayGlobalExplanation(explanation) {
    const explanationElement = document.getElementById('globalExplanation');
    
    if (explanationElement && explanation) {
        explanationElement.textContent = explanation;
    }
}

/**
 * Affiche les détails pour chaque catégorie de risque
 * 
 * @param {Object} details - Détails de l'analyse par catégorie
 */
function displayCategoryDetails(details) {
    if (!details) {
        return;
    }
    
    // Inflammabilité
    if (details.inflammabilite) {
        const scoreElement = document.getElementById('inflameScore');
        const explanationElement = document.getElementById('inflameExplanation');
        
        if (scoreElement) {
            scoreElement.textContent = Math.round(details.inflammabilite.score);
        }
        
        if (explanationElement) {
            explanationElement.textContent = details.inflammabilite.explication || '';
        }
    }
    
    // Toxicité
    if (details.toxicite) {
        const scoreElement = document.getElementById('toxicityScore');
        const explanationElement = document.getElementById('toxicityExplanation');
        
        if (scoreElement) {
            scoreElement.textContent = Math.round(details.toxicite.score);
        }
        
        if (explanationElement) {
            explanationElement.textContent = details.toxicite.explication || '';
        }
    }
    
    // Incompatibilités
    const incompatScore = document.getElementById('incompatScore');
    const incompatExplanation = document.getElementById('incompatExplanation');
    
    if (details.incompatibilites && details.incompatibilites.length > 0) {
        // Affichage du score maximum parmi les incompatibilités
        const maxScore = Math.max(...details.incompatibilites.map(inc => inc.score));
        
        if (incompatScore) {
            incompatScore.textContent = Math.round(maxScore);
        }
        
        if (incompatExplanation) {
            const explanations = details.incompatibilites
                .map(inc => `• ${inc.explication}`)
                .join('\n');
            incompatExplanation.innerHTML = explanations.replace(/\n/g, '<br>');
        }
    } else {
        if (incompatScore) {
            incompatScore.textContent = '0';
        }
        
        if (incompatExplanation) {
            incompatExplanation.textContent = 'Aucune incompatibilité détectée entre les substances.';
        }
    }
}

/**
 * Affiche la liste des substances analysées
 * 
 * @param {Array} substances - Liste des substances avec leurs détails
 */
function displaySubstances(substances) {
    const container = document.getElementById('substancesDetails');
    
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    if (substances.length === 0) {
        container.innerHTML = '<p>Aucune substance analysée.</p>';
        return;
    }
    
    substances.forEach(substance => {
        const item = document.createElement('div');
        item.className = 'substance-item';
        
        const name = document.createElement('div');
        name.className = 'substance-name';
        name.textContent = substance.nom || 'Substance inconnue';
        
        const cas = document.createElement('div');
        cas.className = 'substance-cas';
        cas.textContent = `CAS: ${substance.cas || 'N/A'}`;
        
        const quantity = document.createElement('div');
        quantity.className = 'substance-quantity';
        quantity.textContent = substance.quantite ? `Quantité: ${substance.quantite} mL/g` : '';
        
        const details = document.createElement('div');
        details.className = 'substance-details';
        
        if (substance.inflammabilite) {
            const inflam = document.createElement('div');
            inflam.className = 'substance-detail-item';
            inflam.innerHTML = `<strong>🔥 Inflammabilité:</strong> ${substance.inflammabilite.niveau} (score: ${substance.inflammabilite.score})`;
            details.appendChild(inflam);
        }
        
        if (substance.toxicite) {
            const tox = document.createElement('div');
            tox.className = 'substance-detail-item';
            tox.innerHTML = `<strong>☠️ Toxicité:</strong> ${substance.toxicite.niveau} (score: ${substance.toxicite.score})`;
            details.appendChild(tox);
        }
        
        item.appendChild(name);
        item.appendChild(cas);
        if (substance.quantite) {
            item.appendChild(quantity);
        }
        item.appendChild(details);
        
        container.appendChild(item);
    });
}

/**
 * Affiche la liste des recommandations de sécurité
 * 
 * @param {Array} recommendations - Liste des recommandations
 */
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p>Aucune recommandation spécifique.</p>';
        return;
    }
    
    const list = document.createElement('ul');
    list.className = 'recommendations-list';
    
    recommendations.forEach(rec => {
        const item = document.createElement('li');
        item.className = 'recommendation-item';
        
        const icon = document.createElement('span');
        icon.className = 'recommendation-icon';
        icon.textContent = '✓';
        
        const text = document.createElement('span');
        text.className = 'recommendation-text';
        text.textContent = rec;
        
        item.appendChild(icon);
        item.appendChild(text);
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

/**
 * Affiche la liste des avertissements
 * 
 * @param {Array} warnings - Liste des avertissements
 */
function displayWarnings(warnings) {
    const card = document.getElementById('warningsCard');
    const container = document.getElementById('warnings');
    
    if (!card || !container) {
        return;
    }
    
    if (warnings.length === 0) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    container.innerHTML = '';
    
    const list = document.createElement('ul');
    list.className = 'warnings-list';
    
    warnings.forEach(warning => {
        const item = document.createElement('li');
        item.className = 'warning-item';
        
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
// GESTION DE L'INTERFACE UTILISATEUR
// ============================================================================

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
 * Affiche un message d'erreur
 * 
 * @param {string} message - Message d'erreur à afficher
 */
function showError(message) {
    const section = document.getElementById('errorSection');
    const messageElement = document.getElementById('errorMessage');
    
    if (section && messageElement) {
        messageElement.textContent = message;
        section.style.display = 'block';
        section.classList.add('fade-in');
        
        // Scroll vers l'erreur
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Masque la section d'erreur
 */
function hideErrorSection() {
    const section = document.getElementById('errorSection');
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Affiche l'indicateur de chargement
 */
function showLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (indicator) {
        indicator.style.display = 'block';
    }
    
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyse en cours...';
    }
}

/**
 * Masque l'indicateur de chargement
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (indicator) {
        indicator.style.display = 'none';
    }
    
    if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> Analyser les risques';
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
        }, 100);
    }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * 
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

console.log('app.js chargé avec succès');