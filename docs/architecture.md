# Architecture du Système d'Analyse des Risques Chimiques

**Projet IUT Génie Chimique - 1ère année**  
**Titre:** IA dans la gestion des risques chimiques en laboratoire de R&D

---

## 1. Vue d'ensemble du projet

### 1.1 Objectif

Ce projet vise à développer un système intelligent d'évaluation des risques chimiques pour les laboratoires de recherche et développement. Le système utilise une approche d'intelligence artificielle symbolique (règles expertes et scoring) pour analyser les dangers associés à la manipulation de substances chimiques.

### 1.2 Fonctionnalités principales

- **Analyse multi-critères** : Évaluation de l'inflammabilité, de la toxicité, et des incompatibilités chimiques
- **Scoring automatisé** : Calcul d'un score global de risque (0-100) et attribution d'un niveau qualitatif (Faible/Moyen/Élevé)
- **Recommandations de sécurité** : Génération automatique de conseils adaptés au niveau de risque détecté
- **Interface web intuitive** : Application web accessible via navigateur pour faciliter l'utilisation

### 1.3 Architecture globale

Le système adopte une architecture en trois couches :
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  index.html │  │   style.css  │  │  app.js/api.js  │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP POST /analyze
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND NODE.JS (API GATEWAY)                  │
│  ┌─────────────┐         ┌──────────────────────────┐      │
│  │  server.js  │ ◄────── │ services/python_client.js│      │
│  └─────────────┘         └──────────────────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP POST /analyze
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               AI ENGINE PYTHON (FLASK)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  analyzer.py                                         │  │
│  │    ↓                                                 │  │
│  │  rules (inflammabilité, toxicité, incompatibilités) │  │
│  │    ↓                                                 │  │
│  │  scoring (agrégation pondérée)                      │  │
│  │    ↓                                                 │  │
│  │  JSON response                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Structure des dossiers

### 2.1 Arborescence du projet
```
projet-risques-chimiques/
│
├── data/                           # Données chimiques en CSV
│   ├── substances.csv              # Base de données des substances
│   └── incompatibilites.csv        # Base de données des incompatibilités
│
├── ai_engine/                      # Moteur IA Python
│   ├── config/
│   │   └── settings.py             # Configuration centralisée
│   ├── utils/
│   │   ├── processor.py            # Normalisation de texte
│   │   └── csv_loader.py           # Chargement des données CSV
│   ├── rules/
│   │   ├── inflammabilite.py       # Règles d'évaluation inflammabilité
│   │   ├── toxicite.py             # Règles d'évaluation toxicité
│   │   └── incompatibilites.py     # Règles d'évaluation incompatibilités
│   └── services/
│       └── analyzer.py             # Service principal d'analyse
│
├── scoring/                        # Module de calcul du score global
│   └── risk_score.py               # Agrégation pondérée des scores
│
├── backend_web/                    # Backend Node.js
│   ├── server.js                   # Serveur Express
│   ├── package.json                # Dépendances Node.js
│   └── services/
│       └── python_client.js        # Client HTTP vers Flask
│
├── frontend/                       # Interface utilisateur web
│   ├── index.html                  # Page principale
│   ├── css/
│   │   └── style.css               # Styles de l'application
│   └── js/
│       ├── app.js                  # Logique principale (formulaire)
│       ├── api.js                  # Communication avec backend
│       └── render.js               # Rendu des résultats
│
├── tests/                          # Tests unitaires et d'intégration
│   ├── test_rules.py               # Tests des règles (inflammabilité, etc.)
│   ├── test_scoring.py             # Tests du module de scoring
│   └── test_analyzer.py            # Tests d'intégration de l'analyzer
│
├── docs/                           # Documentation
│   └── architecture.md             # Ce document
│
└── README.md                       # Guide d'installation et d'utilisation
```

### 2.2 Description des dossiers principaux

#### **`data/`**
Contient les bases de données chimiques au format CSV :
- **`substances.csv`** : Informations sur chaque substance (CAS, nom, point éclair, niveau de toxicité, catégorie)
- **`incompatibilites.csv`** : Paires de substances incompatibles avec niveau de risque

#### **`ai_engine/`**
Cœur du système d'IA symbolique en Python :
- **`config/`** : Paramètres globaux (seuils, poids, scores)
- **`utils/`** : Utilitaires de traitement de données
- **`rules/`** : Modules de règles expertes par catégorie de risque
- **`services/`** : Service d'orchestration de l'analyse

#### **`scoring/`**
Module de calcul du score global par agrégation pondérée des scores individuels.

#### **`backend_web/`**
Serveur Node.js servant de passerelle API entre le frontend et le moteur IA Flask.

#### **`frontend/`**
Interface web utilisateur avec architecture modulaire (HTML, CSS, JS).

#### **`tests/`**
Suite de tests automatisés pour valider la logique métier et l'intégration.

---

## 3. Architecture du moteur IA (Python)

### 3.1 Principes de conception

Le moteur IA repose sur une approche **symbolique et déterministe** :
- **Pas de machine learning** : règles expertes explicites
- **Explicabilité totale** : chaque score est justifié par des règles compréhensibles
- **Configuration centralisée** : tous les seuils et poids dans `config/settings.py`

### 3.2 Modules du moteur IA

#### **`config/settings.py`**
Centralise tous les paramètres :
- Seuils de niveau de risque global (Faible < 40, Moyen 40-69, Élevé ≥ 70)
- Poids des catégories (inflammabilité: 35%, toxicité: 40%, incompatibilités: 25%)
- Seuils de classification (point éclair, DL50, etc.)
- Scores par niveau (TRES_TOXIQUE: 95, TOXIQUE: 70, etc.)

#### **`utils/processor.py`**
Fonctions de normalisation de texte :
- Suppression des accents
- Conversion en minuscules
- Standardisation des noms chimiques
- Extraction de valeurs numériques

#### **`utils/csv_loader.py`**
Chargement et indexation des données CSV :
- Lecture de `substances.csv` et `incompatibilites.csv`
- Création d'index pour recherche rapide (par CAS, par nom)
- Fonctions de recherche et de correspondance

#### **`rules/inflammabilite.py`**
Évaluation du risque d'inflammabilité :
- **Entrée** : Point éclair de la substance (°C)
- **Règles** :
  - Point éclair < 23°C → TRES_INFLAMMABLE (score 90)
  - Point éclair 23-60°C → INFLAMMABLE (score 60)
  - Point éclair 60-100°C → PEU_INFLAMMABLE (score 20)
  - Point éclair > 100°C → NON_INFLAMMABLE (score 5)
- **Sortie** : Score (0-100) + explication textuelle

#### **`rules/toxicite.py`**
Évaluation du risque toxicologique :
- **Entrée** : Niveau de toxicité qualitatif (TRES_TOXIQUE, TOXIQUE, NOCIF, etc.)
- **Règles** : Mapping niveau → score (défini dans `settings.py`)
- **Sortie** : Score (0-100) + explication textuelle

#### **`rules/incompatibilites.py`**
Détection des incompatibilités chimiques :
- **Entrée** : Paire de substances
- **Règles** :
  1. Recherche dans la base de données d'incompatibilités
  2. Règles génériques par catégorie (acide + base, oxydant + réducteur, etc.)
- **Sortie** : Score d'incompatibilité (0-100) + explication

#### **`services/analyzer.py`**
Orchestrateur principal de l'analyse :
1. Validation des données d'entrée
2. Chargement des bases de données CSV
3. Pour chaque substance :
   - Évaluation inflammabilité
   - Évaluation toxicité
4. Pour chaque paire de substances :
   - Détection d'incompatibilités
5. Agrégation via `scoring/risk_score.py`
6. Génération de recommandations
7. Retour JSON structuré

#### **`scoring/risk_score.py`**
Calcul du score global :
- **Méthode** : Somme pondérée
```
  score_global = (score_inflam × 0.35) + (score_tox × 0.40) + (score_incomp × 0.25)
```
- **Attribution du niveau** :
  - score < 40 → FAIBLE
  - 40 ≤ score < 70 → MOYEN
  - score ≥ 70 → ÉLEVÉ

### 3.3 Flux de données dans l'AI Engine
```
1. Réception de input_data (JSON)
   ↓
2. Validation et normalisation (processor.py)
   ↓
3. Chargement des données (csv_loader.py)
   ↓
4. Pour chaque substance :
   ├─ Évaluation inflammabilité (rules/inflammabilite.py)
   ├─ Évaluation toxicité (rules/toxicite.py)
   └─ Stockage des scores individuels
   ↓
5. Évaluation des incompatibilités (rules/incompatibilites.py)
   ↓
6. Agrégation des scores (scoring/risk_score.py)
   ↓
7. Génération de recommandations (analyzer.py)
   ↓
8. Construction de la réponse JSON
   ↓
9. Retour au backend Node.js
```

---

## 4. Architecture du backend Node.js

### 4.1 Rôle du backend

Le backend Node.js agit comme une **passerelle API (API Gateway)** entre le frontend web et le moteur IA Flask. Il permet de :
- Exposer une API REST pour le frontend
- Gérer CORS et sécurité
- Transmettre les requêtes au moteur IA Flask
- Logger les requêtes pour le débogage

### 4.2 Modules du backend

#### **`server.js`**
Serveur Express principal :
- Configuration du serveur HTTP (port 3000 par défaut)
- Middleware CORS pour accepter les requêtes du frontend
- Middleware de parsing JSON
- Routes :
  - `GET /` : Informations sur l'API
  - `GET /health` : Vérification de l'état du serveur et du moteur IA
  - `POST /analyze` : Route principale d'analyse (proxy vers Flask)
  - `GET /substances` : Liste des substances disponibles (optionnel)
- Gestion des erreurs (timeout, connexion refusée, etc.)

#### **`services/python_client.js`**
Client HTTP pour communiquer avec Flask :
- Encapsulation des requêtes HTTP vers `http://localhost:5000/analyze`
- Gestion des timeouts (30 secondes par défaut)
- Retry automatique en cas d'échec de connexion
- Fonctions utilitaires :
  - `analyzeWithPython(inputData)` : Analyse principale
  - `checkPythonEngineHealth()` : Vérification de l'état de Flask
  - `getAvailableSubstances()` : Liste des substances

#### **`package.json`**
Fichier de configuration npm :
- Dépendances :
  - `express` : Framework web
  - `axios` : Client HTTP pour appeler Flask
  - `cors` : Gestion CORS
- Scripts :
  - `npm start` : Lance le serveur Node.js

### 4.3 Flux de données dans le backend
```
Frontend (fetch POST /analyze)
   ↓
Backend Node.js (server.js)
   ├─ Validation de la requête
   ├─ Logging
   └─ Appel à python_client.js
      ↓
   HTTP POST vers Flask (localhost:5000/analyze)
      ↓
   Réception de la réponse JSON
      ↓
   Retour au frontend avec le même JSON
```

---

## 5. Architecture du frontend

### 5.1 Principes de conception

Le frontend adopte une architecture **modulaire en JavaScript pur** (sans framework) :
- **Séparation des responsabilités** : logique métier, communication API, rendu
- **Pas de rechargement de page** : utilisation de `fetch` API et manipulation DOM
- **Progressive enhancement** : HTML sémantique, CSS moderne, JS progressif

### 5.2 Modules du frontend

#### **`index.html`**
Page principale structurée en sections :
- **Header** : Titre et description du projet
- **Formulaire d'analyse** :
  - Textarea pour saisir les substances (une par ligne)
  - Champs de quantités générés dynamiquement
  - Contexte de laboratoire (ventilation, température, humidité)
  - Boutons "Analyser" et "Réinitialiser"
- **Section de résultats** (masquée initialement) :
  - Score global + badge de niveau de risque coloré
  - Détails par catégorie (inflammabilité, toxicité, incompatibilités)
  - Liste des substances analysées
  - Recommandations de sécurité
  - Avertissements (si présents)
- **Section d'erreur** (masquée initialement)
- **Footer** : Avertissement sur l'usage pédagogique

#### **`css/style.css`**
Feuille de style complète :
- **Variables CSS** : Couleurs, espacements, tailles de police
- **Système de design** : Cartes, badges, boutons, formulaires
- **Code couleur des risques** :
  - Faible : vert (`#10b981`)
  - Moyen : orange (`#f59e0b`)
  - Élevé : rouge (`#ef4444`)
- **Responsive design** : Adaptation tablette et mobile
- **Animations** : Transitions fluides, indicateur de chargement

#### **`js/app.js`**
Logique principale de l'application :
- **Initialisation** : Ajout des écouteurs d'événements au chargement de la page
- **Gestion du formulaire** :
  - Validation des données d'entrée
  - Construction de l'objet `inputData` JSON
  - Génération dynamique des champs de quantités
- **Communication avec l'API** :
  - Utilisation de `fetch` pour POST vers `/analyze`
  - Gestion des erreurs réseau et timeouts
- **Affichage des résultats** :
  - Appel aux fonctions de `render.js`
  - Scroll automatique vers les résultats

#### **`js/api.js`**
Module de communication avec le backend :
- **Encapsulation de toutes les requêtes HTTP**
- **Configuration centralisée** :
  - URL de base (détectée automatiquement : localhost ou production)
  - Timeout (30 secondes)
  - Headers par défaut
- **Fonctions principales** :
  - `analyzeChemicalRisk(inputData)` : Analyse principale
  - `checkBackendHealth()` : Vérification de l'état du backend
  - `getAvailableSubstances()` : Liste des substances
- **Gestion des erreurs** :
  - Timeout
  - Connexion refusée
  - Erreurs HTTP (400, 500, 503, 504)

#### **`js/render.js`**
Module de rendu dynamique du DOM :
- **Séparation logique/présentation**
- **Fonctions de rendu** :
  - `renderResults(resultData)` : Orchestrateur principal
  - `renderGlobalScore(score, niveau)` : Score global + badge coloré
  - `renderCategoryDetails(details)` : Détails par catégorie
  - `renderSubstances(substances)` : Liste des substances
  - `renderRecommendations(recommendations)` : Liste de recommandations
  - `renderWarnings(warnings)` : Avertissements
- **Sécurité** : Échappement HTML pour prévenir XSS
- **Animations** : Ajout de classes CSS pour transitions fluides

### 5.3 Flux de données dans le frontend
```
1. Utilisateur remplit le formulaire
   ↓
2. Soumission du formulaire (app.js)
   ├─ Validation des données
   ├─ Construction de inputData JSON
   └─ Affichage de l'indicateur de chargement
   ↓
3. Envoi de la requête (api.js)
   ├─ POST vers /analyze
   └─ Gestion des erreurs réseau
   ↓
4. Réception de la réponse JSON
   ↓
5. Rendu des résultats (render.js)
   ├─ Affichage du score global
   ├─ Affichage des détails par catégorie
   ├─ Affichage des substances
   ├─ Affichage des recommandations
   └─ Scroll vers les résultats
```

---

## 6. Stratégie de tests

### 6.1 Objectifs des tests

- **Validation de la logique métier** : Vérifier que les règles d'évaluation fonctionnent correctement
- **Non-régression** : S'assurer que les modifications n'introduisent pas de bugs
- **Documentation vivante** : Les tests servent d'exemples d'utilisation

### 6.2 Types de tests

#### **Tests unitaires** (`test_rules.py`)
Testent les modules de règles individuellement :
- **`test_inflammabilite.py`** :
  - Test avec point éclair très bas (< 23°C) → TRES_INFLAMMABLE
  - Test avec point éclair moyen (23-60°C) → INFLAMMABLE
  - Test avec point éclair élevé (> 60°C) → PEU_INFLAMMABLE
  - Test avec point éclair manquant → NON_INFLAMMABLE
- **`test_toxicite.py`** :
  - Test pour chaque niveau (TRES_TOXIQUE, TOXIQUE, NOCIF, etc.)
  - Test avec niveau manquant → valeur par défaut
- **`test_incompatibilites.py`** :
  - Test avec paire incompatible connue → score élevé
  - Test avec paire compatible → score 0
  - Test avec incompatibilité par catégorie (acide + base)

#### **Tests du module de scoring** (`test_scoring.py`)
Testent l'agrégation des scores :
- Test avec scores moyens → vérification du calcul pondéré
- Test avec scores maximaux → score global = 100
- Test avec scores minimaux → score global = 0
- Test des seuils de niveau de risque (FAIBLE/MOYEN/ÉLEVÉ)
- Test de la cohérence des poids (somme = 1.0)

#### **Tests d'intégration** (`test_analyzer.py`)
Testent le système complet :
- Test avec une substance unique → vérification de la structure JSON complète
- Test avec deux substances compatibles → pas d'incompatibilités
- Test avec deux substances incompatibles → détection d'incompatibilités
- Test avec données manquantes → gestion gracieuse des erreurs
- Test de sérialisation JSON → vérification que la sortie est bien du JSON valide

### 6.3 Exécution des tests
```bash
# Tous les tests
python -m unittest discover tests

# Tests unitaires des règles
python -m unittest tests.test_rules

# Tests du scoring
python -m unittest tests.test_scoring

# Tests d'intégration
python -m unittest tests.test_analyzer
```

### 6.4 Couverture de tests

Les tests couvrent :
- ✅ Tous les modules de règles (inflammabilité, toxicité, incompatibilités)
- ✅ Le module de scoring et d'agrégation
- ✅ L'analyzer (orchestrateur)
- ✅ Les cas limites (données manquantes, valeurs invalides)
- ❌ Les modules utilitaires (processor.py, csv_loader.py) → à ajouter

---

## 7. Diagramme de flux de données

### 7.1 Vue d'ensemble du pipeline
```
┌──────────────────────────────────────────────────────────────────────┐
│                          UTILISATEUR                                 │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ 1. Saisie des substances
                                   │    et contexte de laboratoire
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (index.html)                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Formulaire                                                  │    │
│  │ - Substances: ["Éthanol", "Acétone"]                       │    │
│  │ - Quantités: {Éthanol: 500, Acétone: 250}                 │    │
│  │ - Contexte: {ventilation: true, temperature_c: 22}        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            │ 2. app.js: Construction de inputData    │
│                            ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ inputData JSON:                                             │    │
│  │ {                                                           │    │
│  │   "substances": ["Éthanol", "Acétone"],                    │    │
│  │   "quantites": {"Éthanol": 500, "Acétone": 250},          │    │
│  │   "contexte_labo": {"ventilation": true, ...}             │    │
│  │ }                                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            │ 3. api.js: fetch POST /analyze          │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             │ HTTP POST
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS (server.js)                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 4. Réception de la requête                                  │    │
│  │    - Validation du JSON                                     │    │
│  │    - Logging                                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            │ 5. python_client.js                     │
│                            ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ HTTP POST vers Flask                                        │    │
│  │ URL: http://localhost:5000/analyze                         │    │
│  │ Body: inputData                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             │ HTTP POST
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   AI ENGINE FLASK (Python)                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 6. analyzer.py: Orchestration de l'analyse                  │    │
│  │    ├─ Chargement des données CSV                           │    │
│  │    ├─ Pour chaque substance:                               │    │
│  │    │   ├─ rules/inflammabilite.py → score_inflam          │    │
│  │    │   └─ rules/toxicite.py → score_tox                   │    │
│  │    ├─ rules/incompatibilites.py → score_incomp            │    │
│  │    └─ scoring/risk_score.py → score_global + niveau       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            │ 7. Construction de la réponse JSON      │
│                            ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ resultData JSON:                                            │    │
│  │ {                                                           │    │
│  │   "score_global": 62.5,                                    │    │
│  │   "niveau_risque": "MOYEN",                                │    │
│  │   "details": {                                             │    │
│  │     "inflammabilite": {score: 85, explication: "..."},    │    │
│  │     "toxicite": {score: 45, explication: "..."},          │    │
│  │     "incompatibilites": []                                 │    │
│  │   },                                                        │    │
│  │   "substances_analysees": [...],                           │    │
│  │   "recommandations": [...]                                 │    │
│  │ }                                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             │ HTTP 200 OK + JSON
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS (server.js)                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 8. Transmission de la réponse au frontend                   │    │
│  │    - Ajout de metadata (processing_time_ms, timestamp)     │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             │ HTTP 200 OK + JSON
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (app.js, render.js)                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 9. Réception de la réponse                                  │    │
│  │    - api.js: parsing du JSON                                │    │
│  │    - app.js: appel à displayResults()                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            │ 10. render.js: Mise à jour du DOM       │
│                            ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Affichage:                                                  │    │
│  │ ┌──────────────────────────────────────────────────┐       │    │
│  │ │ Score Global: 62.5 / 100                         │       │    │
│  │ │ Niveau: [MOYEN] (badge orange)                   │       │    │
│  │ └──────────────────────────────────────────────────┘       │    │
│  │ ┌──────────────────────────────────────────────────┐       │    │
│  │ │ Détails:                                         │       │    │
│  │ │ - Inflammabilité: 85 (Élevé)                    │       │    │
│  │ │ - Toxicité: 45 (Modéré)                         │       │    │
│  │ │ - Incompatibilités: 0 (Aucune)                  │       │    │
│  │ └──────────────────────────────────────────────────┘       │    │
│  │ ┌──────────────────────────────────────────────────┐       │    │
│  │ │ Recommandations:                                 │       │    │
│  │ │ ✓ Porter des gants de protection                │       │    │
│  │ │ ✓ Manipuler sous hotte aspirante                │       │    │
│  │ │ ✓ ...                                            │       │    │
│  │ └──────────────────────────────────────────────────┘       │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ 11. Affichage à l'utilisateur
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          UTILISATEUR                                 │
│                  (consulte les résultats)                            │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Gestion des erreurs
```
Erreur possible à chaque étape:
│
├─ Frontend: Validation échoue
│  └─ Affichage d'un message d'erreur (section errorSection)
│
├─ Backend: Flask inaccessible (ECONNREFUSED)
│  └─ Retour HTTP 503 + message explicite
│
├─ Flask: Substance inconnue
│  └─ Utilisation de valeurs par défaut + avertissement
│
└─ Timeout (> 30s)
   └─ Retour HTTP 504 + message d'expiration
```

---

## 8. Technologies et dépendances

### 8.1 Python (AI Engine)

#### **Langage**
- Python 3.8+

#### **Framework web**
- Flask 2.3+ : Serveur HTTP pour exposer l'API d'analyse

#### **Bibliothèques standard utilisées**
- `csv` : Lecture des fichiers de données
- `os` : Manipulation de chemins de fichiers
- `json` : Sérialisation JSON
- `unicodedata` : Normalisation de texte (suppression d'accents)
- `re` : Expressions régulières pour parsing
- `unittest` : Framework de tests

#### **Pas de dépendances externes**
- Pas de pandas, numpy, scikit-learn
- Approche minimaliste pour un projet pédagogique

### 8.2 Node.js (Backend)

#### **Langage**
- Node.js 14+

#### **Dépendances npm**
- `express` (^4.18.2) : Framework web pour l'API REST
- `axios` (^1.6.2) : Client HTTP pour appeler Flask
- `cors` (^2.8.5) : Middleware pour gérer les requêtes cross-origin

#### **Scripts npm**
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### 8.3 Frontend

#### **Langages**
- HTML5 : Structure sémantique
- CSS3 : Styles modernes (variables CSS, Grid, Flexbox)
- JavaScript ES6+ : Logique client (async/await, modules)

#### **Pas de frameworks**
- Pas de React, Vue, Angular
- JavaScript pur (vanilla JS) pour simplicité pédagogique

#### **APIs web utilisées**
- Fetch API : Requêtes HTTP asynchrones
- DOM API : Manipulation dynamique du HTML

---

## 9. Déploiement et exécution

### 9.1 Prérequis

- Python 3.8+ installé
- Node.js 14+ et npm installés
- Navigateur web moderne (Chrome, Firefox, Edge)

### 9.2 Installation
```bash
# 1. Installation des dépendances Python
pip install flask --break-system-packages

# 2. Installation des dépendances Node.js
cd backend_web
npm install
cd ..
```

### 9.3 Lancement de l'application

**Terminal 1 : Moteur IA Flask**
```bash
python backend_flask/app.py
# Serveur Flask démarre sur http://localhost:5000
```

**Terminal 2 : Backend Node.js**
```bash
cd backend_web
npm start
# Serveur Node.js démarre sur http://localhost:3000
```

**Navigateur : Frontend**
```
Ouvrir frontend/index.html dans un navigateur
OU
Utiliser un serveur HTTP local:
python -m http.server 8080 --directory frontend
# Puis ouvrir http://localhost:8080
```

### 9.4 Tests
```bash
# Exécution de tous les tests
python -m unittest discover tests

# Tests avec verbose
python -m unittest discover tests -v
```

---

## 10. Évolutions futures possibles

### 10.1 Fonctionnalités

- **Historique des analyses** : Stockage des analyses précédentes en base de données
- **Export PDF** : Génération de rapports d'analyse au format PDF
- **Authentification** : Système de comptes utilisateurs pour les laboratoires
- **Base de données étendue** : Ajout de plus de substances et d'incompatibilités
- **API publique** : Documentation OpenAPI/Swagger pour intégration externe

### 10.2 Techniques

- **Containerisation** : Docker + Docker Compose pour déploiement simplifié
- **CI/CD** : Pipeline automatisé de tests et déploiement (GitHub Actions)
- **Monitoring** : Logs centralisés et métriques de performance
- **Cache** : Redis pour mise en cache des résultats d'analyse
- **Base de données** : Migration de CSV vers PostgreSQL pour performances

### 10.3 Améliorations de l'IA

- **Apprentissage par renforcement** : Ajustement des poids selon retours utilisateurs
- **Détection automatique** : Reconnaissance de formules chimiques (NLP)
- **Prédiction de DL50** : Modèle QSAR (Quantitative Structure-Activity Relationship)
- **Visualisations** : Graphiques interactifs des risques (Chart.js, D3.js)

---

## 11. Conclusion

Ce système d'analyse des risques chimiques démontre une architecture logicielle moderne et modulaire, adaptée à un projet pédagogique de niveau IUT. L'approche par IA symbolique (règles + scoring) garantit l'**explicabilité** des résultats, critère essentiel en contexte de sécurité chimique.

La séparation en trois couches (Frontend / Backend Node.js / AI Engine Flask) permet une **évolutivité** aisée et une **maintenance** facilitée. Les tests automatisés assurent la **fiabilité** du système et servent de documentation vivante pour les futurs développeurs.

Ce projet constitue une base solide pour un **système décisionnel d'aide à la sécurité en laboratoire**, tout en restant accessible et compréhensible pour des étudiants en génie chimique.

---

**Document rédigé par :** Équipe de développement - Projet IUT Génie Chimique  
**Date de dernière mise à jour :** Janvier 2025  
**Version :** 1.0