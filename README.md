# IA dans la Gestion des Risques Chimiques en Laboratoire de R&D

**Projet IUT Génie Chimique - 1ère année**

---

## 📋 Description du projet

Ce projet vise à développer un **système intelligent d'évaluation des risques chimiques** pour les laboratoires de recherche et développement. Il utilise une approche d'**intelligence artificielle symbolique** basée sur des règles expertes et un système de scoring pour analyser automatiquement les dangers associés à la manipulation de substances chimiques.

### Objectifs principaux

- ✅ **Automatiser l'évaluation des risques** : Analyse rapide et standardisée des substances chimiques
- ✅ **Améliorer la sécurité en laboratoire** : Détection des incompatibilités et recommandations de sécurité
- ✅ **Former les étudiants** : Outil pédagogique pour sensibiliser aux bonnes pratiques de sécurité
- ✅ **Faciliter la conformité** : Alignement avec les normes de sécurité et réglementations (GHS, CLP)

### Contexte d'utilisation

Bien que développé dans un cadre pédagogique (IUT Génie Chimique), ce système peut être adapté pour :
- Laboratoires de recherche universitaires
- Laboratoires R&D industriels
- Formation continue en sécurité chimique
- Audit de sécurité et gestion des risques

---

## ✨ Fonctionnalités

### Analyse multi-critères des risques

Le système évalue trois catégories de risque principales :

1. **🔥 Inflammabilité**
   - Analyse basée sur le point éclair de la substance
   - Classification en 4 niveaux : TRÈS INFLAMMABLE / INFLAMMABLE / PEU INFLAMMABLE / NON INFLAMMABLE
   - Recommandations de stockage et manipulation

2. **☠️ Toxicité**
   - Évaluation basée sur les niveaux de toxicité (FDS, pictogrammes de danger)
   - 6 niveaux de toxicité : TRÈS TOXIQUE → NON TOXIQUE
   - Identification des substances CMR (Cancérogène, Mutagène, Reprotoxique)

3. **⚠️ Incompatibilités chimiques**
   - Détection des réactions dangereuses entre substances
   - Base de données d'incompatibilités + règles génériques par catégorie
   - Recommandations de stockage séparé

### Scoring et recommandations

- **Calcul d'un score global** (0-100) par agrégation pondérée des scores individuels
- **Attribution d'un niveau de risque qualitatif** : Faible / Moyen / Élevé
- **Génération automatique de recommandations** de sécurité adaptées au niveau de risque
- **Affichage visuel avec code couleur** : Vert (Faible) / Orange (Moyen) / Rouge (Élevé)

### Architecture modulaire

- **Frontend moderne** : Interface web intuitive (HTML5, CSS3, JavaScript ES6+)
- **Backend API Gateway** : Node.js + Express pour routage et communication
- **Moteur IA Python** : Flask + règles expertes + système de scoring
- **Tests automatisés** : Suite de tests unitaires et d'intégration

---

## 📁 Structure du projet
```
projet-risques-chimiques/
│
├── data/                           # Données chimiques en CSV
│   ├── substances.csv              # Base de données des substances (CAS, nom, propriétés)
│   └── incompatibilites.csv        # Base de données des incompatibilités
│
├── ai_engine/                      # Moteur IA Python (Flask)
│   ├── config/                     # Configuration centralisée (seuils, poids)
│   ├── utils/                      # Utilitaires (normalisation, chargement CSV)
│   ├── rules/                      # Modules de règles expertes
│   │   ├── inflammabilite.py       # Règles d'inflammabilité
│   │   ├── toxicite.py             # Règles de toxicité
│   │   └── incompatibilites.py     # Règles d'incompatibilités
│   └── services/                   # Services d'orchestration
│       └── analyzer.py             # Service principal d'analyse
│
├── scoring/                        # Module de calcul du score global
│   └── risk_score.py               # Agrégation pondérée des scores
│
├── backend_web/                    # Backend Node.js (API Gateway)
│   ├── server.js                   # Serveur Express
│   ├── package.json                # Dépendances npm
│   └── services/                   # Services de communication
│       └── python_client.js        # Client HTTP vers Flask
│
├── frontend/                       # Interface utilisateur web
│   ├── index.html                  # Page principale
│   ├── css/                        # Styles CSS
│   │   └── style.css               # Feuille de style complète
│   └── js/                         # JavaScript modulaire
│       ├── app.js                  # Logique principale (formulaire)
│       ├── api.js                  # Communication avec backend
│       └── render.js               # Rendu des résultats
│
├── tests/                          # Tests automatisés
│   ├── test_rules.py               # Tests unitaires des règles
│   ├── test_scoring.py             # Tests du module de scoring
│   └── test_analyzer.py            # Tests d'intégration
│
├── docs/                           # Documentation
│   ├── architecture.md             # Architecture du système
│   └── methodology.md              # Méthodologie et choix de conception
│
├── .gitignore                      # Fichiers à exclure de Git
└── README.md                       # Ce fichier
```

---

## 🚀 Installation et configuration

### Prérequis

- **Python 3.8+** (pour le moteur IA Flask)
- **Node.js 14+** et **npm** (pour le backend Node.js)
- **Navigateur web moderne** (Chrome, Firefox, Edge)

### Étape 1 : Installation du moteur IA Python
```bash
# Création d'un environnement virtuel (recommandé)
python -m venv venv

# Activation de l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur macOS/Linux:
source venv/bin/activate

# Installation de Flask
pip install flask --break-system-packages
# Ou si vous avez un fichier requirements.txt:
# pip install -r requirements.txt
```

### Étape 2 : Installation du backend Node.js
```bash
# Navigation vers le dossier backend
cd backend_web

# Installation des dépendances npm
npm install

# Retour au dossier racine
cd ..
```

### Étape 3 : Lancement de l'application

**Terminal 1 : Démarrage du moteur IA Flask**
```bash
# Depuis la racine du projet
python backend_flask/app.py

# Sortie attendue:
# * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

**Terminal 2 : Démarrage du backend Node.js**
```bash
# Depuis la racine du projet
cd backend_web
npm start

# Sortie attendue:
# Serveur Node.js démarré sur le port 3000
# URL du serveur: http://localhost:3000
```

**Navigateur : Ouverture du frontend**

Ouvrir `frontend/index.html` dans votre navigateur web, ou utiliser un serveur HTTP local :
```bash
# Option 1: Serveur HTTP Python
cd frontend
python -m http.server 8080
# Puis ouvrir http://localhost:8080

# Option 2: Serveur HTTP Node.js (si http-server est installé)
npx http-server frontend -p 8080
# Puis ouvrir http://localhost:8080
```

### Ports par défaut

| Service              | Port | URL                        |
|----------------------|------|----------------------------|
| Moteur IA Flask      | 5000 | http://localhost:5000      |
| Backend Node.js      | 3000 | http://localhost:3000      |
| Frontend             | 8080 | http://localhost:8080      |

---

## 📖 Utilisation

### Interface utilisateur

1. **Saisie des substances chimiques**
   - Entrez les noms des substances dans le champ de texte (une substance par ligne)
   - Exemples : `Éthanol`, `Acétone`, `Acide sulfurique`

2. **Quantités (optionnel)**
   - Les champs de quantités apparaissent automatiquement pour chaque substance
   - Entrez les quantités en mL ou g

3. **Contexte de laboratoire (optionnel)**
   - Cochez "Ventilation adéquate" si une hotte aspirante est disponible
   - Indiquez la température du laboratoire en °C
   - Indiquez l'humidité relative en % (optionnel)

4. **Analyse**
   - Cliquez sur le bouton **"Analyser les risques"**
   - L'application envoie les données au backend, qui les transmet au moteur IA
   - Les résultats s'affichent automatiquement

### Format d'entrée

**Exemple de saisie :**
```
Éthanol
Acétone
Acide sulfurique
```

**Exemple de JSON envoyé à l'API :**
```json
{
  "substances": ["Éthanol", "Acétone", "Acide sulfurique"],
  "quantites": {
    "Éthanol": 500,
    "Acétone": 250,
    "Acide sulfurique": 100
  },
  "contexte_labo": {
    "ventilation": true,
    "temperature_c": 22,
    "humidite_percent": 50
  }
}
```

### Résultats affichés

L'interface affiche :

1. **Score global** (0-100) et **niveau de risque** avec badge coloré
   - 🟢 Vert : Risque Faible (score < 40)
   - 🟠 Orange : Risque Moyen (score 40-69)
   - 🔴 Rouge : Risque Élevé (score ≥ 70)

2. **Détails par catégorie**
   - 🔥 Inflammabilité : Score + explication
   - ☠️ Toxicité : Score + explication
   - ⚠️ Incompatibilités : Liste des incompatibilités détectées

3. **Substances analysées**
   - Informations détaillées pour chaque substance
   - Numéro CAS, quantité, scores individuels

4. **Recommandations de sécurité**
   - Liste personnalisée de recommandations adaptées au niveau de risque
   - Exemples : "Porter des gants de protection", "Manipuler sous hotte aspirante", etc.

5. **Avertissements** (si pertinents)
   - Alertes contextuelles basées sur les conditions de laboratoire

---

## 🧪 Tests

Le projet inclut une suite complète de tests automatisés pour garantir la fiabilité du système.

### Tests unitaires des règles

**Fichier :** `tests/test_rules.py`

Teste les modules de règles individuellement :
- Tests d'inflammabilité (4 niveaux, données manquantes)
- Tests de toxicité (6 niveaux, matching flou)
- Tests d'incompatibilités (paires connues, règles génériques)
```bash
# Exécution des tests de règles
python -m unittest tests.test_rules -v
```

### Tests du module de scoring

**Fichier :** `tests/test_scoring.py`

Teste l'agrégation des scores :
- Calcul de la somme pondérée
- Détermination du niveau de risque
- Gestion des données manquantes
- Validation des seuils
```bash
# Exécution des tests de scoring
python -m unittest tests.test_scoring -v
```

### Tests d'intégration

**Fichier :** `tests/test_analyzer.py`

Teste le système complet end-to-end :
- Analyse d'une substance unique
- Analyse de substances compatibles
- Analyse de substances incompatibles
- Gestion des erreurs
- Sérialisation JSON
```bash
# Exécution des tests d'intégration
python -m unittest tests.test_analyzer -v
```

### Exécution de tous les tests
```bash
# Tous les tests avec sortie détaillée
python -m unittest discover tests -v

# Sortie attendue:
# test_tres_inflammable (test_rules.TestInflammabilite) ... ok
# test_toxique (test_rules.TestToxicite) ... ok
# ...
# ----------------------------------------------------------------------
# Ran 45 tests in 2.341s
# OK
```

---

## ⚠️ Limitations et perspectives

### Limitations actuelles

#### Limitations de l'approche

- **Base de données limitée** : ~100-200 substances (vs milliers dans la réalité)
- **Incompatibilités partielles** : Couverture limitée aux paires les plus courantes
- **Niveaux qualitatifs** : Pas de prise en compte des voies d'exposition (ingestion, inhalation, contact)
- **Contexte simplifié** : Paramètres de laboratoire limités (ventilation, température)

#### Limitations techniques

- **Stockage CSV** : Recherche linéaire, pas de relations complexes
- **Pas de persistance** : Aucun historique des analyses effectuées
- **Interface basique** : Pas de visualisations graphiques (graphiques, schémas)
- **Pas d'authentification** : Système ouvert, pas de gestion d'utilisateurs

### Perspectives d'amélioration

#### Court terme (accessibles)

- ✅ **Extension de la base de données** : Ajout de 500-1000 substances courantes
- ✅ **Enrichissement des incompatibilités** : Tableaux de compatibilité complets
- ✅ **Export PDF** : Génération de rapports d'analyse au format PDF
- ✅ **Historique** : Sauvegarde des analyses en JSON ou SQLite
- ✅ **Graphiques** : Visualisations avec Chart.js ou D3.js

#### Moyen terme (avec expertise)

- 🔄 **Migration BDD** : PostgreSQL ou SQLite pour performances
- 🔄 **API externes** : Intégration PubChem, ChemSpider pour enrichissement automatique
- 🔄 **Système de recommandation** : Suggestion d'alternatives moins dangereuses
- 🔄 **Multi-utilisateurs** : Authentification, niveaux d'accès, validation par responsable sécurité

#### Long terme (R&D)

- 🔬 **Hybridation IA symbolique + statistique** : Machine learning pour affiner les poids
- 🔬 **Modèles QSAR** : Prédiction de toxicité à partir de structures chimiques
- 🔬 **NLP** : Extraction automatique d'informations depuis les FDS
- 🔬 **IoT** : Intégration capteurs (température, vapeurs) pour alertes en temps réel

---

## 📚 Documentation

- **Architecture du système** : `docs/architecture.md`
- **Méthodologie et choix de conception** : `docs/methodology.md`

---

## 🤝 Contribution

Ce projet a été développé dans un cadre pédagogique. Les contributions sont les bienvenues pour :
- Enrichir la base de données de substances et incompatibilités
- Améliorer les règles d'évaluation
- Ajouter de nouvelles fonctionnalités
- Corriger des bugs ou améliorer la documentation

### Comment contribuer

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est développé à des fins pédagogiques pour l'IUT Génie Chimique.

---

## ⚖️ Avertissement

**Ce système est un outil pédagogique d'aide à la décision.** Il ne remplace pas :
- Une évaluation professionnelle par un expert en sécurité chimique
- La consultation des Fiches de Données de Sécurité (FDS) officielles
- Le respect des réglementations en vigueur
- La formation obligatoire à la sécurité en laboratoire

**Consultez toujours les FDS et un responsable sécurité avant toute manipulation de substances chimiques.**

---

## 👥 Auteurs

**Projet IUT Génie Chimique - 1ère année**  
**Équipe de développement**

---

## 📧 Contact

Pour toute question ou suggestion concernant ce projet :
- Ouvrir une issue sur le dépôt Git
- Contacter le responsable pédagogique du département Génie Chimique

---

**Version :** 1.0  
**Dernière mise à jour :** Janvier 2025