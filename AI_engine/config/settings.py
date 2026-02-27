# ai_engine/config/settings.py
"""
Configuration centralisée pour le moteur d'IA de gestion des risques chimiques
Projet IUT Génie Chimique - 1ère année
Approche : IA explicable basée sur des règles expertes (sans machine learning)
"""

# ==============================================================================
# SEUILS DE NIVEAUX DE RISQUE GLOBAL
# ==============================================================================
# Définition des seuils de score pour classer le risque global d'un produit
# Score total = somme pondérée des catégories (inflammabilité, toxicité, incompatibilités)

RISK_LEVEL_THRESHOLDS = {
    "FAIBLE": 0,      # Score < 40 : risque acceptable avec précautions standard
    "MOYEN": 40,      # Score 40-69 : précautions renforcées nécessaires
    "ELEVE": 70       # Score >= 70 : manipulation sous hotte, EPI renforcés
}

# Score maximum théorique (100 points)
MAX_TOTAL_SCORE = 100


# ==============================================================================
# POIDS DES CATÉGORIES DE RISQUE
# ==============================================================================
# Pondération pour calculer le score global
# La somme des poids doit être égale à 1.0 pour une répartition équilibrée

CATEGORY_WEIGHTS = {
    "inflammabilite": 0.35,      # 35% - risque d'incendie/explosion
    "toxicite": 0.40,            # 40% - impact sur la santé humaine (priorité)
    "incompatibilites": 0.25     # 25% - risque de réactions dangereuses
}


# ==============================================================================
# SEUILS POUR L'INFLAMMABILITÉ
# ==============================================================================
# Classification basée sur le point éclair (flash point) en degrés Celsius
# Conformément aux normes de classification des produits inflammables

FLASH_POINT_THRESHOLDS = {
    "TRES_INFLAMMABLE": 23,      # Point éclair < 23°C (ex: acétone, éther)
    "INFLAMMABLE": 60,           # Point éclair entre 23°C et 60°C (ex: éthanol)
    "PEU_INFLAMMABLE": 100       # Point éclair > 60°C (ex: huiles)
}

# Scores associés à chaque niveau d'inflammabilité (sur 100)
INFLAMMABILITY_SCORES = {
    "TRES_INFLAMMABLE": 90,      # Risque très élevé
    "INFLAMMABLE": 60,           # Risque modéré
    "PEU_INFLAMMABLE": 20,       # Risque faible
    "NON_INFLAMMABLE": 0         # Risque nul (substances comme l'eau)
}


# ==============================================================================
# SEUILS POUR LA TOXICITÉ
# ==============================================================================
# Mapping entre niveaux qualitatifs de toxicité et scores numériques
# Basé sur les pictogrammes de danger et mentions de danger (CMR, toxicité aiguë, etc.)

TOXICITY_SCORES = {
    "TRES_TOXIQUE": 95,          # CMR catégorie 1, toxicité aiguë cat. 1-2
    "TOXIQUE": 70,               # Toxique cat. 3, corrosif
    "NOCIF": 45,                 # Nocif, irritant sévère
    "IRRITANT": 25,              # Irritant modéré
    "PEU_TOXIQUE": 10,           # Toxicité faible ou non classé
    "NON_TOXIQUE": 0             # Pas de danger identifié
}

# Seuil de DL50 (mg/kg) pour classification automatique si disponible
DL50_THRESHOLDS = {
    "TRES_TOXIQUE": 25,          # DL50 orale <= 25 mg/kg
    "TOXIQUE": 200,              # DL50 orale entre 25 et 200 mg/kg
    "NOCIF": 2000                # DL50 orale entre 200 et 2000 mg/kg
}


# ==============================================================================
# INCOMPATIBILITÉS CHIMIQUES
# ==============================================================================
# Score de base pour chaque incompatibilité détectée
INCOMPATIBILITY_BASE_SCORE = 30

# Score maximum pour la catégorie incompatibilités
MAX_INCOMPATIBILITY_SCORE = 100

# Multiplicateur si incompatibilité avec réaction violente/explosive
SEVERE_INCOMPATIBILITY_MULTIPLIER = 2.0


# ==============================================================================
# VALEURS PAR DÉFAUT
# ==============================================================================
# Utilisées lorsque les données sont manquantes ou incomplètes

DEFAULT_SCORE = 50               # Score par défaut en cas de données manquantes
DEFAULT_FLASH_POINT = None       # Pas de point éclair par défaut
DEFAULT_TOXICITY_LEVEL = "NOCIF" # Niveau de toxicité par défaut (principe de précaution)

# Score maximum par catégorie (avant pondération)
MAX_CATEGORY_SCORE = 100


# ==============================================================================
# PARAMÈTRES DE RECOMMANDATIONS
# ==============================================================================
# Seuils pour déclencher des recommandations spécifiques

# Seuil pour recommander le port de gants résistants aux produits chimiques
GLOVES_RECOMMENDATION_THRESHOLD = 40

# Seuil pour recommander l'utilisation obligatoire de la hotte
FUME_HOOD_THRESHOLD = 60

# Seuil pour recommander des EPI complets (combinaison, masque filtrant)
FULL_PPE_THRESHOLD = 80


# ==============================================================================
# PARAMÈTRES D'AFFICHAGE
# ==============================================================================
# Configuration pour l'interface utilisateur et les rapports

# Codes couleur pour les niveaux de risque
RISK_COLORS = {
    "FAIBLE": "#28a745",    # Vert
    "MOYEN": "#ffc107",     # Orange
    "ELEVE": "#dc3545"      # Rouge
}

# Nombre de décimales pour l'affichage des scores
SCORE_DECIMAL_PLACES = 1