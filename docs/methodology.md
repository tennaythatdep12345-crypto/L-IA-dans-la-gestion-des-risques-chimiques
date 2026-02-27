# Méthodologie du Système d'Analyse des Risques Chimiques

**Projet IUT Génie Chimique - 1ère année**  
**Titre:** IA dans la gestion des risques chimiques en laboratoire de R&D

---

## 1. Introduction

### 1.1 Objectif de ce document

Ce document présente la méthodologie adoptée pour concevoir et développer un système intelligent d'évaluation des risques chimiques en laboratoire. Il détaille les choix techniques, les processus d'analyse, et les méthodes de validation mises en œuvre.

### 1.2 Contexte et enjeux

La manipulation de substances chimiques en laboratoire de recherche et développement présente des risques significatifs :
- **Risques physiques** : Inflammabilité, explosivité, réactivité
- **Risques sanitaires** : Toxicité aiguë et chronique, effets CMR (Cancérogène, Mutagène, Reprotoxique)
- **Risques d'incompatibilité** : Réactions dangereuses entre substances (dégagement de gaz toxiques, réactions exothermiques violentes)

L'évaluation manuelle de ces risques est :
- **Chronophage** : Consultation de multiples fiches de données de sécurité (FDS)
- **Sujette à l'erreur humaine** : Oubli d'incompatibilités, sous-estimation de risques
- **Difficile à standardiser** : Variabilité entre opérateurs

Un système automatisé d'aide à la décision permet de :
- ✅ **Standardiser** l'évaluation des risques
- ✅ **Accélérer** le processus d'analyse
- ✅ **Améliorer** la sécurité en laboratoire
- ✅ **Former** les étudiants aux bonnes pratiques de sécurité

---

## 2. Approche méthodologique

### 2.1 Choix d'une approche symbolique (règles expertes)

#### 2.1.1 Pourquoi des règles plutôt que du machine learning ?

Le projet adopte une approche d'**intelligence artificielle symbolique** basée sur des règles expertes, plutôt qu'une approche par apprentissage automatique (machine learning). Ce choix se justifie par :

**Avantages de l'approche symbolique pour ce projet :**

1. **Explicabilité totale**
   - Chaque score est justifié par des règles claires et compréhensibles
   - Traçabilité complète des décisions (crucial en contexte de sécurité)
   - Validation possible par des experts en sécurité chimique

2. **Fiabilité et déterminisme**
   - Comportement prévisible : mêmes entrées → mêmes sorties
   - Pas de "boîte noire" : chaque règle est vérifiable
   - Conformité aux normes de sécurité établies

3. **Données limitées**
   - Pas besoin de milliers d'exemples étiquetés
   - Fonctionne avec une base de données modeste (quelques centaines de substances)
   - Adapté à un projet pédagogique avec ressources limitées

4. **Maintenance et évolution**
   - Ajout facile de nouvelles règles par des experts
   - Modification simple des seuils et paramètres
   - Pas de besoin de réentraînement coûteux

5. **Contexte pédagogique**
   - Code compréhensible par des étudiants de 1ère année
   - Permet d'apprendre les concepts d'IA de manière progressive
   - Facilite le débogage et la validation

**Limitations reconnues de l'approche :**
- Nécessite une expertise pour définir les règles (collaborations avec experts requis)
- Moins adaptative qu'un système par apprentissage (ne s'améliore pas automatiquement)
- Peut devenir complexe avec un très grand nombre de substances et d'incompatibilités

#### 2.1.2 Structure du système de règles

Le système est organisé en **trois catégories de risque** :
```
┌─────────────────────────────────────────────────────────┐
│              SYSTÈME D'ÉVALUATION DES RISQUES           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. INFLAMMABILITÉ                                      │
│     ├─ Règle basée sur le point éclair                 │
│     ├─ 4 niveaux : TRÈS/INFLAMMABLE/PEU/NON           │
│     └─ Score: 0-100                                     │
│                                                         │
│  2. TOXICITÉ                                            │
│     ├─ Règle basée sur le niveau qualitatif           │
│     ├─ 6 niveaux : TRÈS_TOXIQUE → NON_TOXIQUE         │
│     └─ Score: 0-100                                     │
│                                                         │
│  3. INCOMPATIBILITÉS                                    │
│     ├─ Base de données d'incompatibilités connues     │
│     ├─ Règles génériques par catégorie chimique       │
│     └─ Score: 0-100                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  AGRÉGATION PONDÉRÉE │
              │  Score global 0-100  │
              └──────────────────────┘
```

### 2.2 Conception du système de scoring

#### 2.2.1 Échelle de scoring

Tous les scores sont normalisés sur une échelle de **0 à 100** :
- **0** : Risque négligeable
- **1-39** : Risque faible (niveau FAIBLE)
- **40-69** : Risque modéré (niveau MOYEN)
- **70-100** : Risque élevé (niveau ÉLEVÉ)

Cette échelle :
- Facilite la compréhension intuitive (analogie avec les notes scolaires)
- Permet une granularité suffisante pour distinguer les niveaux de risque
- Est compatible avec les seuils réglementaires de sécurité

#### 2.2.2 Définition des poids de pondération

L'agrégation des scores individuels utilise une **somme pondérée** :
```
Score_global = (Score_inflammabilité × 0.35) +
               (Score_toxicité × 0.40) +
               (Score_incompatibilités × 0.25)
```

**Justification des poids :**

| Catégorie          | Poids | Justification                                                    |
|--------------------|-------|------------------------------------------------------------------|
| Toxicité           | 40%   | Impact direct et permanent sur la santé humaine (priorité)       |
| Inflammabilité     | 35%   | Risque d'accident grave (incendie, explosion)                    |
| Incompatibilités   | 25%   | Risque conditionnel (dépend de la présence de plusieurs substances) |

Ces poids sont :
- **Configurables** : Définis dans `config/settings.py` pour faciliter les ajustements
- **Justifiés** : Basés sur les priorités de sécurité en laboratoire (santé > accidents > incompatibilités)
- **Validés** : Somme = 1.0 pour garantir que le score global reste dans [0, 100]

#### 2.2.3 Définition des seuils

##### Inflammabilité (basée sur le point éclair)

Les seuils sont conformes aux **normes de classification** des produits inflammables :

| Niveau              | Point éclair (°C) | Score | Référence normative        |
|---------------------|-------------------|-------|----------------------------|
| TRÈS INFLAMMABLE    | < 23              | 90    | Catégorie 1 (GHS)          |
| INFLAMMABLE         | 23 - 60           | 60    | Catégorie 2-3 (GHS)        |
| PEU INFLAMMABLE     | 60 - 100          | 20    | Catégorie 4 (GHS)          |
| NON INFLAMMABLE     | > 100 ou absent   | 5     | Hors classification        |

*GHS : Globally Harmonized System of Classification and Labelling of Chemicals*

##### Toxicité (basée sur le niveau qualitatif)

Les niveaux sont dérivés des **pictogrammes de danger** et **mentions de danger** du règlement CLP (Classification, Labelling and Packaging) :

| Niveau           | Score | Exemples de mentions de danger                    |
|------------------|-------|---------------------------------------------------|
| TRÈS TOXIQUE     | 95    | H300, H310, H330 (toxicité aiguë cat. 1-2), CMR  |
| TOXIQUE          | 70    | H301, H311, H331 (toxicité aiguë cat. 3), corrosif|
| NOCIF            | 45    | H302, H312, H332 (toxicité aiguë cat. 4), irritant|
| IRRITANT         | 25    | H315, H319 (irritation cutanée/oculaire)         |
| PEU TOXIQUE      | 10    | Dangers mineurs                                   |
| NON TOXIQUE      | 0     | Pas de danger identifié                           |

##### Incompatibilités (basée sur la réactivité)

Les scores d'incompatibilité sont attribués selon le **niveau de risque** de la réaction :

| Niveau de risque | Score | Type de réaction                                               |
|------------------|-------|----------------------------------------------------------------|
| SÉVÈRE           | 90    | Réaction explosive, dégagement de gaz très toxiques (ex: HCN)  |
| ÉLEVÉ            | 60    | Réaction violente, incendie, dégagement de gaz toxiques        |
| MOYEN            | 30    | Réaction exothermique modérée, dégagement de chaleur           |
| FAIBLE           | 15    | Interaction mineure, déconseillée par précaution               |

### 2.3 Structure des données

#### 2.3.1 Format de stockage : CSV

Les données chimiques sont stockées au format **CSV (Comma-Separated Values)** pour :
- **Simplicité** : Format texte lisible et éditable manuellement
- **Portabilité** : Compatible avec Excel, LibreOffice, Python, etc.
- **Pédagogie** : Facilite la compréhension pour des étudiants débutants
- **Pas de base de données** : Évite la complexité d'un SGBD pour un projet pédagogique

#### 2.3.2 Fichier substances.csv

**Structure :**
```csv
cas,nom,point_eclair,toxicite,categorie
64-17-5,Éthanol,13,NOCIF,solvant
67-64-1,Acétone,-20,NOCIF,solvant
7664-93-9,Acide sulfurique,,TOXIQUE,acide
```

**Colonnes :**
- **`cas`** : Numéro CAS (Chemical Abstracts Service) - identifiant unique international
- **`nom`** : Nom commun de la substance
- **`point_eclair`** : Point éclair en °C (peut être vide si non inflammable)
- **`toxicite`** : Niveau qualitatif de toxicité (TRES_TOXIQUE, TOXIQUE, NOCIF, etc.)
- **`categorie`** : Famille chimique (acide, base, solvant, oxydant, etc.)

**Sources de données :**
- Fiches de Données de Sécurité (FDS) officielles
- Base de données PubChem (National Institutes of Health)
- Règlement CLP européen (EC No 1272/2008)

#### 2.3.3 Fichier incompatibilites.csv

**Structure :**
```csv
substance_a,substance_b,niveau_risque
acide sulfurique,hydroxyde de sodium,ELEVE
eau de javel,acide chlorhydrique,SEVERE
acide nitrique,matière organique,ELEVE
```

**Colonnes :**
- **`substance_a`** : Nom de la première substance
- **`substance_b`** : Nom de la deuxième substance
- **`niveau_risque`** : Niveau de risque de l'incompatibilité (SEVERE, ELEVE, MOYEN, FAIBLE)

**Sources de données :**
- Tableaux d'incompatibilité chimique (Chemical Compatibility Chart)
- Guides de sécurité en laboratoire (INRS, HSE)
- Littérature scientifique sur les réactions dangereuses

---

## 3. Workflow et pipeline de traitement

### 3.1 Vue d'ensemble du processus

Le traitement d'une analyse suit un pipeline en **9 étapes** :
```
1. SAISIE UTILISATEUR (Frontend)
   │
   ├─ Substances : ["Éthanol", "Acétone"]
   ├─ Quantités : {Éthanol: 500, Acétone: 250}
   └─ Contexte : {ventilation: true, température: 22}
   │
   ▼
2. VALIDATION ET CONSTRUCTION JSON (app.js)
   │
   └─ inputData = {substances: [...], quantites: {...}, contexte_labo: {...}}
   │
   ▼
3. ENVOI HTTP POST (api.js → Backend Node.js)
   │
   ▼
4. TRANSMISSION AU MOTEUR IA (python_client.js → Flask)
   │
   ▼
5. PRÉTRAITEMENT (processor.py)
   │
   ├─ Normalisation : "Éthanol" → "ethanol"
   ├─ Suppression accents : "Acétone" → "acetone"
   └─ Standardisation : "H2SO4" → "acide sulfurique"
   │
   ▼
6. CHARGEMENT DES DONNÉES (csv_loader.py)
   │
   ├─ Lecture de substances.csv
   ├─ Lecture de incompatibilites.csv
   └─ Indexation pour recherche rapide
   │
   ▼
7. APPLICATION DES RÈGLES
   │
   ├─ Pour chaque substance :
   │   ├─ Inflammabilité (inflammabilite.py)
   │   │   └─ Lecture point_eclair → Règle → Score
   │   └─ Toxicité (toxicite.py)
   │       └─ Lecture toxicite → Règle → Score
   │
   └─ Pour chaque paire de substances :
       └─ Incompatibilités (incompatibilites.py)
           └─ Recherche dans CSV + règles génériques → Score
   │
   ▼
8. AGRÉGATION (risk_score.py)
   │
   ├─ Calcul du score global (somme pondérée)
   ├─ Détermination du niveau de risque (FAIBLE/MOYEN/ÉLEVÉ)
   └─ Génération de recommandations
   │
   ▼
9. GÉNÉRATION DE LA RÉPONSE JSON (analyzer.py)
   │
   └─ {score_global, niveau_risque, details, recommandations}
   │
   ▼
RETOUR AU FRONTEND (render.js)
   │
   └─ Affichage visuel avec code couleur
```

### 3.2 Détail des étapes de traitement

#### 3.2.1 Prétraitement des données

**Objectif :** Améliorer la robustesse de la correspondance entre les saisies utilisateur et la base de données.

**Opérations effectuées (processor.py) :**

1. **Normalisation de texte**
   - Conversion en minuscules : "ÉTHANOL" → "éthanol"
   - Suppression des accents : "Acétone" → "Acetone"
   - Suppression des espaces multiples : "Acide  sulfurique" → "Acide sulfurique"
   - Nettoyage des caractères spéciaux : "H₂SO₄" → "H2SO4"

2. **Standardisation des noms chimiques**
   - Suppression des parenthèses informatives : "Acide sulfurique (95%)" → "Acide sulfurique"
   - Normalisation des tirets : "2-propanol" → "2 propanol"
   - Gestion des synonymes courants (pourrait être étendu)

3. **Extraction de valeurs numériques**
   - Parsing de quantités : "500 mL" → 500.0
   - Parsing de températures : "22°C" → 22.0
   - Gestion des séparateurs décimaux : "1,5" → 1.5

**Exemple de transformation :**
```
Entrée brute : "  Acétone (99.5%)  "
↓ normalize_text()
"acetone (99.5%)"
↓ standardize_chemical_name()
"acetone 995"
```

#### 3.2.2 Application des règles d'inflammabilité

**Processus (inflammabilite.py) :**
```
1. Récupération du point éclair de la substance
   │
   ├─ Si absent → Score = 5 (NON_INFLAMMABLE)
   └─ Si présent → Application des seuils
   │
2. Comparaison avec les seuils définis
   │
   ├─ Point éclair < 23°C → TRÈS INFLAMMABLE (score 90)
   ├─ 23°C ≤ Point éclair < 60°C → INFLAMMABLE (score 60)
   ├─ 60°C ≤ Point éclair < 100°C → PEU INFLAMMABLE (score 20)
   └─ Point éclair ≥ 100°C → NON INFLAMMABLE (score 5)
   │
3. Génération de l'explication
   │
   └─ "Éthanol : point éclair = 13°C (< 23°C). Risque très élevé d'inflammation."
```

**Recommandations générées selon le niveau :**
- **TRÈS INFLAMMABLE** : Stockage au réfrigérateur, interdiction de flamme nue, utilisation sous hotte
- **INFLAMMABLE** : Stockage à l'écart de sources de chaleur, ventilation adéquate
- **PEU INFLAMMABLE** : Précautions standard
- **NON INFLAMMABLE** : Aucune précaution spécifique liée à l'inflammabilité

#### 3.2.3 Application des règles de toxicité

**Processus (toxicite.py) :**
```
1. Récupération du niveau de toxicité de la substance
   │
   ├─ Si absent → Niveau par défaut (NOCIF, par précaution)
   └─ Si présent → Normalisation du texte
   │
2. Matching avec les niveaux définis
   │
   ├─ "TRES_TOXIQUE" ou "CMR" → Score 95
   ├─ "TOXIQUE" → Score 70
   ├─ "NOCIF" → Score 45
   ├─ "IRRITANT" → Score 25
   ├─ "PEU_TOXIQUE" → Score 10
   └─ "NON_TOXIQUE" → Score 0
   │
3. Génération de l'explication
   │
   └─ "Benzène : TRÈS TOXIQUE (CMR catégorie 1). Manipulation interdite sans EPI complets."
```

**Matching flou (fuzzy matching) :**
Pour gérer les variantes d'écriture, le système applique des règles de correspondance approximative :
- "très toxique" → TRES_TOXIQUE
- "CMR" → TRES_TOXIQUE
- "cancérogène" → TRES_TOXIQUE
- "corrosif" → TOXIQUE

#### 3.2.4 Détection des incompatibilités

**Processus (incompatibilites.py) :**
```
1. Pour chaque paire de substances (A, B) :
   │
   ├─ Recherche dans incompatibilites.csv
   │   │
   │   ├─ Correspondance exacte (A-B ou B-A)
   │   └─ Si trouvé → Récupération du niveau_risque
   │
   ├─ Si non trouvé → Application de règles génériques par catégorie
   │   │
   │   ├─ Acide + Base → ÉLEVÉ (réaction exothermique)
   │   ├─ Oxydant + Réducteur → ÉLEVÉ (risque d'incendie)
   │   ├─ Oxydant + Matière organique → MOYEN
   │   ├─ Acide + Cyanure → SÉVÈRE (dégagement HCN)
   │   └─ Autres → AUCUN
   │
2. Attribution du score selon le niveau
   │
   ├─ SÉVÈRE → Score 90
   ├─ ÉLEVÉ → Score 60
   ├─ MOYEN → Score 30
   └─ FAIBLE → Score 15
   │
3. Génération de l'explication
   │
   └─ "Acide sulfurique + Hydroxyde de sodium : INCOMPATIBILITÉ ÉLEVÉE.
       Réaction exothermique violente. NE JAMAIS mélanger."
```

**Règles génériques par catégorie :**
Ces règles permettent de détecter des incompatibilités même si elles ne sont pas explicitement listées dans le CSV :

| Catégorie A      | Catégorie B        | Niveau de risque | Raison                              |
|------------------|--------------------|--------------------|-------------------------------------|
| Acide            | Base               | ÉLEVÉ              | Réaction acide-base exothermique    |
| Oxydant          | Réducteur          | ÉLEVÉ              | Risque d'incendie ou explosion      |
| Oxydant          | Inflammable        | ÉLEVÉ              | Risque d'inflammation               |
| Acide            | Cyanure            | SÉVÈRE             | Dégagement de HCN (toxique mortel)  |
| Acide            | Sulfure            | ÉLEVÉ              | Dégagement de H₂S (toxique)         |
| Eau              | Réactif hydrophobe | MOYEN              | Réaction violente possible          |

#### 3.2.5 Agrégation des scores

**Processus (risk_score.py) :**
```
1. Récupération des scores individuels
   │
   ├─ Score_inflammabilité (max parmi les substances)
   ├─ Score_toxicité (max parmi les substances)
   └─ Score_incompatibilités (max parmi les paires)
   │
2. Application de la formule de pondération
   │
   Score_global = (Score_inflam × 0.35) +
                  (Score_tox × 0.40) +
                  (Score_incomp × 0.25)
   │
3. Détermination du niveau de risque
   │
   ├─ Score < 40 → FAIBLE
   ├─ 40 ≤ Score < 70 → MOYEN
   └─ Score ≥ 70 → ÉLEVÉ
   │
4. Génération de l'explication globale
   │
   └─ "Score global : 65/100 (MOYEN). Le risque principal est lié à
       l'inflammabilité (score : 85). Manipulation avec précautions renforcées."
```

**Exemple de calcul :**
```
Substance : Éthanol
├─ Inflammabilité : 90 (TRÈS INFLAMMABLE)
├─ Toxicité : 45 (NOCIF)
└─ Incompatibilités : 0 (aucune autre substance)

Score_global = (90 × 0.35) + (45 × 0.40) + (0 × 0.25)
             = 31.5 + 18 + 0
             = 49.5 → MOYEN
```

#### 3.2.6 Génération des recommandations

**Processus (analyzer.py + modules de règles) :**

Les recommandations sont générées à **trois niveaux** :

1. **Recommandations globales** (selon le niveau de risque global)
   - FAIBLE : Précautions standard, port de blouse et lunettes
   - MOYEN : Port d'EPI, manipulation sous hotte recommandée
   - ÉLEVÉ : EPI complets obligatoires, hotte obligatoire, présence d'un binôme

2. **Recommandations par catégorie** (selon les scores individuels)
   - Inflammabilité élevée : Éloigner toute source d'ignition, prévoir extincteur
   - Toxicité élevée : Manipulation sous hotte obligatoire, laveur oculaire à proximité
   - Incompatibilités : Stockage séparé, ne jamais mélanger

3. **Recommandations contextuelles** (selon le contexte de laboratoire)
   - Absence de ventilation + substance toxique → Avertissement renforcé
   - Température élevée + substance inflammable → Avertissement sur évaporation

**Déduplication :** Les recommandations sont dédupliquées pour éviter les répétitions.

### 3.3 Format de la réponse JSON

**Structure complète :**
```json
{
  "score_global": 62.5,
  "niveau_risque": "MOYEN",
  "details": {
    "inflammabilite": {
      "score": 85,
      "score_moyen": 85.0,
      "explication": "Score maximum d'inflammabilité : 85"
    },
    "toxicite": {
      "score": 45,
      "score_moyen": 45.0,
      "explication": "Score maximum de toxicité : 45"
    },
    "incompatibilites": [
      {
        "substances": ["Acide sulfurique", "Hydroxyde de sodium"],
        "score": 60,
        "niveau": "ELEVE",
        "explication": "Réaction acide-base exothermique violente."
      }
    ],
    "scores_ponderes": {
      "inflammabilite": 29.75,
      "toxicite": 18.0,
      "incompatibilites": 15.0
    },
    "explication_globale": "Score global : 62.5/100 (MOYEN). Le risque principal est..."
  },
  "substances_analysees": [
    {
      "nom": "Éthanol",
      "cas": "64-17-5",
      "quantite": 500,
      "inflammabilite": {
        "score": 90,
        "niveau": "TRES_INFLAMMABLE",
        "explication": "Point éclair = 13°C (< 23°C)..."
      },
      "toxicite": {
        "score": 45,
        "niveau": "NOCIF",
        "explication": "..."
      }
    }
  ],
  "recommandations": [
    "🟠 Port d'EPI adapté : blouse, gants, lunettes de protection",
    "Manipulation sous hotte recommandée",
    "⚠️ Risque d'inflammabilité élevé : éloigner toute source d'ignition",
    "..."
  ],
  "avertissements": [
    "⚠️ Absence de ventilation avec substances toxiques : risque accru..."
  ],
  "erreurs": [],
  "processing_time_ms": 45,
  "timestamp": "2025-01-28T14:32:10.123Z"
}
```

---

## 4. Stratégie de tests

### 4.1 Philosophie de test

La stratégie de tests repose sur trois principes :

1. **Couverture complète** : Tester toutes les fonctions critiques
2. **Tests déterministes** : Résultats reproductibles (pas de hasard)
3. **Tests lisibles** : Servent de documentation vivante

### 4.2 Tests unitaires des règles (test_rules.py)

**Objectif :** Valider le comportement de chaque module de règles individuellement.

#### 4.2.1 Tests d'inflammabilité

**Cas testés :**
- ✅ Point éclair très bas (< 23°C) → TRÈS INFLAMMABLE
- ✅ Point éclair moyen (23-60°C) → INFLAMMABLE
- ✅ Point éclair élevé (60-100°C) → PEU INFLAMMABLE
- ✅ Point éclair très élevé (> 100°C) → NON INFLAMMABLE
- ✅ Point éclair manquant → NON INFLAMMABLE (par défaut)
- ✅ Point éclair invalide (texte) → Gestion d'erreur

**Exemple de test :**
```python
def test_tres_inflammable(self):
    substance = {'nom': 'Acétone', 'point_eclair': -20}
    result = evaluate_inflammability(substance)
    
    self.assertEqual(result['niveau'], 'TRES_INFLAMMABLE')
    self.assertGreaterEqual(result['score'], 80)
```

#### 4.2.2 Tests de toxicité

**Cas testés :**
- ✅ Chaque niveau de toxicité (TRES_TOXIQUE → NON_TOXIQUE)
- ✅ Niveau manquant → Niveau par défaut (NOCIF)
- ✅ Niveau non reconnu → Gestion gracieuse
- ✅ Matching flou (variations d'écriture)

#### 4.2.3 Tests d'incompatibilités

**Cas testés :**
- ✅ Incompatibilité connue (présente dans CSV) → Score élevé
- ✅ Incompatibilité par catégorie (acide + base) → Détection
- ✅ Substances compatibles → Score 0
- ✅ Substance manquante → Pas d'erreur

### 4.3 Tests du module de scoring (test_scoring.py)

**Objectif :** Valider l'agrégation des scores et le calcul du niveau de risque.

**Cas testés :**

1. **Calcul de la somme pondérée**
   - ✅ Scores moyens → Vérification du résultat
   - ✅ Scores maximaux (100, 100, 100) → Score global = 100
   - ✅ Scores minimaux (0, 0, 0) → Score global = 0

2. **Détermination du niveau de risque**
   - ✅ Score 39 → FAIBLE
   - ✅ Score 40 → MOYEN (seuil exact)
   - ✅ Score 69 → MOYEN
   - ✅ Score 70 → ÉLEVÉ (seuil exact)
   - ✅ Score 100 → ÉLEVÉ

3. **Validation des poids**
   - ✅ Somme des poids = 1.0 (vérification de cohérence)

4. **Gestion des données manquantes**
   - ✅ Un score manquant → Utilisation de 0 par défaut
   - ✅ Tous les scores manquants → Score global = 0

### 4.4 Tests d'intégration (test_analyzer.py)

**Objectif :** Valider le système complet end-to-end.

**Cas testés :**

1. **Analyse d'une substance unique**
   - ✅ Structure JSON complète
   - ✅ Présence de tous les champs obligatoires
   - ✅ Cohérence des scores
   - ✅ Absence d'incompatibilités (substance unique)

2. **Analyse de substances compatibles**
   - ✅ Scores d'incompatibilités = 0
   - ✅ Score global basé uniquement sur inflammabilité et toxicité

3. **Analyse de substances incompatibles**
   - ✅ Détection d'incompatibilités
   - ✅ Score d'incompatibilités > 0
   - ✅ Recommandations de stockage séparé

4. **Gestion des erreurs**
   - ✅ Liste de substances vide → Erreur de validation
   - ✅ Substance inconnue → Avertissement + valeurs par défaut
   - ✅ Données invalides → Message d'erreur clair

5. **Sérialisation JSON**
   - ✅ Résultat sérialisable en JSON (pas d'objets Python non sérialisables)
   - ✅ Désérialisation sans perte d'information

### 4.5 Couverture de tests

**Modules testés :**
```
✅ rules/inflammabilite.py      → 100%
✅ rules/toxicite.py            → 100%
✅ rules/incompatibilites.py    → 100%
✅ scoring/risk_score.py        → 100%
✅ services/analyzer.py         → 95% (cas nominaux + erreurs)
❌ utils/processor.py           → 0% (à ajouter)
❌ utils/csv_loader.py          → 0% (à ajouter)
```

**Métrique de réussite :**
- Tous les tests doivent passer (100% success rate)
- Pas de régression lors de modifications du code
- Temps d'exécution < 5 secondes pour la suite complète

### 4.6 Exécution et validation

**Commande :**
```bash
python -m unittest discover tests -v
```

**Sortie attendue :**
```
test_tres_inflammable (test_rules.TestInflammabilite) ... ok
test_inflammable_moderee (test_rules.TestInflammabilite) ... ok
...
----------------------------------------------------------------------
Ran 45 tests in 2.341s

OK
```

---

## 5. Choix de conception

### 5.1 Architecture modulaire

#### 5.1.1 Séparation des responsabilités

Le projet adopte une architecture en **couches** avec séparation stricte des responsabilités :
```
┌─────────────────────────────────────────────────────────────┐
│  PRÉSENTATION (Frontend)                                    │
│  ├─ index.html : Structure                                  │
│  ├─ style.css : Apparence                                   │
│  └─ JS modules : Logique client                             │
│      ├─ app.js : Gestion formulaire, orchestration          │
│      ├─ api.js : Communication backend                      │
│      └─ render.js : Rendu DOM                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│  API GATEWAY (Backend Node.js)                              │
│  ├─ server.js : Serveur Express, routage                    │
│  └─ services/python_client.js : Client HTTP vers Flask      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│  LOGIQUE MÉTIER (AI Engine Python)                          │
│  ├─ config/settings.py : Configuration centralisée          │
│  ├─ utils/ : Utilitaires (processor, csv_loader)            │
│  ├─ rules/ : Règles métier (inflammabilité, etc.)           │
│  ├─ scoring/ : Agrégation des scores                        │
│  └─ services/analyzer.py : Orchestrateur                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  DONNÉES (CSV)                                              │
│  ├─ substances.csv                                          │
│  └─ incompatibilites.csv                                    │
└─────────────────────────────────────────────────────────────┘
```

**Avantages de cette architecture :**
- **Maintenabilité** : Chaque module a une responsabilité claire
- **Testabilité** : Chaque module peut être testé indépendamment
- **Évolutivité** : Possibilité de remplacer une couche sans impact sur les autres
- **Réutilisabilité** : Les modules peuvent être utilisés dans d'autres contextes

#### 5.1.2 Configuration centralisée

Tous les paramètres (seuils, poids, scores) sont regroupés dans **`config/settings.py`** pour :
- **Éviter le hardcoding** : Pas de valeurs magiques dispersées dans le code
- **Faciliter les ajustements** : Un seul fichier à modifier pour changer un seuil
- **Documenter les choix** : Commentaires expliquant la source de chaque valeur
- **Valider les paramètres** : Vérification automatique (ex: somme des poids = 1.0)

**Exemple :**
```python
# Au lieu de :
if point_eclair < 23:  # Pourquoi 23 ?
    score = 90         # Pourquoi 90 ?

# On utilise :
if point_eclair < FLASH_POINT_THRESHOLDS['TRES_INFLAMMABLE']:
    score = INFLAMMABILITY_SCORES['TRES_INFLAMMABLE']
```

### 5.2 Modularisation du frontend

#### 5.2.1 Séparation logique / communication / rendu

Le frontend JavaScript est organisé en **trois modules** :

1. **`app.js`** : Logique de l'application
   - Gestion du formulaire (validation, soumission)
   - Orchestration du flux de données
   - Gestion des événements utilisateur

2. **`api.js`** : Communication avec le backend
   - Encapsulation de toutes les requêtes HTTP
   - Gestion des erreurs réseau (timeout, connexion refusée)
   - Configuration centralisée (URL de base, headers)

3. **`render.js`** : Rendu des résultats
   - Manipulation du DOM
   - Mise à jour dynamique de l'interface
   - Application des styles (badges colorés)

**Avantages :**
- **Séparation des préoccupations** : Chaque fichier a un rôle clair
- **Réutilisabilité** : `api.js` et `render.js` peuvent être utilisés dans d'autres pages
- **Testabilité** : Chaque module peut être testé indépendamment (avec mocks)
- **Lisibilité** : Code plus court et plus facile à comprendre

#### 5.2.2 Pas de framework frontend

Le projet n'utilise **pas de framework JavaScript** (React, Vue, Angular) pour :
- **Simplicité pédagogique** : Apprentissage du JavaScript natif
- **Légèreté** : Pas de dépendances lourdes (quelques Ko de JS)
- **Compatibilité** : Fonctionne dans tous les navigateurs modernes sans compilation

### 5.3 Communication par JSON

#### 5.3.1 Format d'échange standardisé

Toutes les communications entre les couches utilisent **JSON** pour :
- **Interopérabilité** : Standard universel (Python ↔ Node.js ↔ JavaScript)
- **Lisibilité** : Format texte, facile à déboguer
- **Validation** : Structure typée et vérifiable
- **Extensibilité** : Ajout facile de nouveaux champs

#### 5.3.2 Contrat d'interface

Le format JSON agit comme un **contrat d'interface** entre les couches :
- **Frontend → Backend** : Format de requête défini (inputData)
- **Backend → AI Engine** : Même format (transparent)
- **AI Engine → Backend → Frontend** : Format de réponse défini (resultData)

**Avantage :** Si le backend change (ex: passage de Node.js à Python FastAPI), le frontend n'est pas impacté tant que le format JSON reste le même.

### 5.4 Gestion des erreurs

#### 5.4.1 Principe : Fail gracefully

Le système est conçu pour **gérer les erreurs sans crash** :
- **Validation en amont** : Vérification des données avant traitement
- **Valeurs par défaut** : Utilisation de valeurs sûres si données manquantes
- **Messages explicites** : Erreurs compréhensibles par l'utilisateur
- **Logging** : Enregistrement des erreurs pour débogage

#### 5.4.2 Hiérarchie de gestion d'erreurs
```
Frontend (app.js)
├─ Validation du formulaire
│  └─ Si invalide → Message d'erreur + arrêt
│
└─ Envoi de la requête (api.js)
   ├─ Erreur réseau → "Backend inaccessible, vérifiez que le serveur est démarré"
   ├─ Timeout → "Le serveur met trop de temps à répondre"
   └─ Erreur HTTP → Affichage du message d'erreur du backend
   
Backend (server.js)
├─ Validation de la requête
│  └─ Si invalide → HTTP 400 + message explicite
│
└─ Transmission à Flask (python_client.js)
   ├─ Flask inaccessible → HTTP 503 + "Moteur IA non accessible"
   ├─ Timeout → HTTP 504 + "Timeout de l'analyse"
   └─ Erreur Flask → Propagation de l'erreur
   
AI Engine (analyzer.py)
├─ Validation des données
│  └─ Si invalide → Retour JSON avec champ "erreurs"
│
├─ Substance inconnue
│  └─ Valeurs par défaut + avertissement (pas d'erreur bloquante)
│
└─ Erreur de traitement
   └─ Logging + retour JSON avec erreur
```

---

## 6. Limitations et perspectives d'amélioration

### 6.1 Limitations actuelles

#### 6.1.1 Limitations de l'approche par règles

1. **Couverture limitée**
   - Base de données de ~100-200 substances (vs milliers dans la réalité)
   - Incompatibilités limitées aux paires les plus courantes
   - Pas de prise en compte des mélanges complexes (>2 substances)

2. **Granularité des niveaux**
   - Toxicité : 6 niveaux qualitatifs seulement
   - Pas de distinction entre toxicité aiguë et chronique
   - Pas de prise en compte des voies d'exposition (ingestion, inhalation, contact cutané)

3. **Contexte de laboratoire simplifié**
   - Paramètres limités (ventilation, température, humidité)
   - Pas de prise en compte de l'équipement disponible
   - Pas de prise en compte de la formation de l'opérateur

4. **Rigidité des règles**
   - Seuils fixes, pas d'adaptation au contexte
   - Pas d'apprentissage à partir des retours utilisateurs
   - Règles définies manuellement (nécessite expertise)

#### 6.1.2 Limitations techniques

1. **Base de données CSV**
   - Recherche linéaire (lent avec beaucoup de données)
   - Pas de relations complexes (ex: substance → famille → propriétés)
   - Risque d'incohérence si édité manuellement

2. **Pas de persistance**
   - Pas de sauvegarde des analyses effectuées
   - Pas d'historique des manipulations
   - Pas de suivi dans le temps

3. **Interface simple**
   - Pas de visualisations graphiques (graphiques, schémas)
   - Pas d'export PDF des résultats
   - Pas de version mobile optimisée

### 6.2 Perspectives d'amélioration

#### 6.2.1 Court terme (améliorations accessibles)

1. **Extension de la base de données**
   - Ajout de 500-1000 substances couramment utilisées
   - Enrichissement des incompatibilités (tableaux de compatibilité complets)
   - Ajout de données quantitatives (DL50, CL50, limites d'exposition)

2. **Amélioration des règles**
   - Règles plus fines pour la toxicité (prise en compte des voies d'exposition)
   - Règles contextuelles (adaptation selon l'équipement disponible)
   - Règles de stockage (température, lumière, humidité)

3. **Persistance des données**
   - Sauvegarde des analyses en JSON ou SQLite
   - Historique des manipulations
   - Export PDF des rapports d'analyse

4. **Améliorations de l'interface**
   - Graphiques de répartition des risques (Chart.js)
   - Auto-complétion des noms de substances
   - Suggestions de substances basées sur les analyses précédentes

#### 6.2.2 Moyen terme (avec expertise supplémentaire)

1. **Migration vers une base de données relationnelle**
   - PostgreSQL ou SQLite pour performances
   - Modélisation des relations (substance → famille → propriétés)
   - Indexation pour recherche rapide

2. **Intégration de données externes**
   - API PubChem pour récupération automatique de données
   - API ChemSpider pour synonymes et structures chimiques
   - Scraping de FDS pour enrichissement automatique

3. **Système de recommandation**
   - Suggestion d'alternatives moins dangereuses
   - Recommandation de protocoles de manipulation
   - Optimisation du stockage (regroupement par famille)

4. **Authentification et multi-utilisateurs**
   - Comptes utilisateurs (chercheurs, étudiants, responsables sécurité)
   - Niveaux d'accès différenciés
   - Validation par un responsable sécurité avant manipulation

#### 6.2.3 Long terme (recherche et développement)

1. **Hybridation IA symbolique + IA statistique**
   - Apprentissage automatique pour affiner les poids
   - Modèle de prédiction de toxicité (QSAR - Quantitative Structure-Activity Relationship)
   - NLP pour extraction automatique d'informations depuis les FDS

2. **Prédiction de propriétés**
   - Prédiction du point éclair à partir de la structure chimique
   - Prédiction de la toxicité à partir de descripteurs moléculaires
   - Identification automatique d'incompatibilités par analyse de réactivité

3. **Système expert avancé**
   - Raisonnement par cas (Case-Based Reasoning)
   - Système de règles floues (Fuzzy Logic) pour gérer l'incertitude
   - Ontologie chimique pour raisonnement sémantique

4. **Intégration avec l'IoT**
   - Capteurs de température, humidité, concentration de vapeurs
   - Alertes en temps réel en cas de dépassement de seuils
   - Traçabilité automatique des manipulations (RFID, QR codes)

### 6.3 Extensibilité du système

#### 6.3.1 Architecture extensible

Le système a été conçu pour être facilement extensible :

1. **Ajout de nouvelles catégories de risque**
   - Créer un nouveau module dans `rules/` (ex: `radioactivite.py`)
   - Ajouter le poids dans `config/settings.py`
   - Modifier `analyzer.py` pour inclure la nouvelle catégorie

2. **Ajout de nouvelles sources de données**
   - Créer un nouveau loader dans `utils/` (ex: `api_loader.py`)
   - Implémenter l'interface standard (fonction `load_substances()`)
   - Pas de modification du reste du code

3. **Ajout de nouvelles métriques**
   - Ajouter les colonnes dans `substances.csv`
   - Créer de nouvelles règles exploitant ces données
   - Les anciennes analyses restent compatibles

#### 6.3.2 Compatibilité ascendante

Les choix de conception garantissent la **compatibilité ascendante** :
- Format JSON extensible (nouveaux champs possibles sans casser les anciens clients)
- Configuration centralisée (ajout de nouveaux paramètres sans modification du code)
- Tests automatisés (détection de régressions lors des modifications)

---

## 7. Conclusion méthodologique

### 7.1 Synthèse de l'approche

Ce projet démontre qu'une approche d'**IA symbolique** basée sur des règles expertes est pertinente pour un système d'aide à la décision en contexte de sécurité chimique, notamment pour :
- ✅ **Explicabilité** : Chaque décision est justifiable et traçable
- ✅ **Fiabilité** : Comportement déterministe et prévisible
- ✅ **Validation** : Règles vérifiables par des experts en sécurité
- ✅ **Conformité** : Alignement avec les normes et réglementations

### 7.2 Contribution pédagogique

Sur le plan pédagogique, ce projet permet aux étudiants de :
- Comprendre les **fondamentaux de l'IA** (règles, scoring, agrégation)
- Appliquer des **connaissances métier** (chimie) à un problème informatique
- Découvrir une **architecture logicielle moderne** (API, frontend/backend)
- Pratiquer les **bonnes pratiques** (tests, modularité, documentation)

### 7.3 Applicabilité réelle

Bien que développé dans un cadre pédagogique, ce système pourrait servir de **base pour un outil professionnel** :
- Déploiement en intranet de laboratoire
- Intégration avec un système de gestion de laboratoire (LIMS)
- Formation des nouveaux arrivants aux risques chimiques
- Audit de sécurité et conformité réglementaire

### 7.4 Méthodologie transposable

La méthodologie présentée ici est **transposable à d'autres domaines** nécessitant une évaluation de risques :
- Risques biologiques (manipulation de micro-organismes)
- Risques environnementaux (pollution, déchets)
- Risques industriels (process chimiques, sécurité machines)
- Évaluation de conformité réglementaire

---

**Document rédigé par :** Équipe de développement - Projet IUT Génie Chimique  
**Date de dernière mise à jour :** Janvier 2025  
**Version :** 1.0

---

## Références

### Sources techniques
- Règlement CLP (CE n° 1272/2008) - Classification, étiquetage et emballage des substances et mélanges
- GHS (Globally Harmonized System) - Système général harmonisé de classification et d'étiquetage des produits chimiques
- INRS (Institut National de Recherche et de Sécurité) - Guides de sécurité en laboratoire

### Bases de données chimiques
- PubChem (National Institutes of Health) - https://pubchem.ncbi.nlm.nih.gov/
- ChemSpider (Royal Society of Chemistry) - http://www.chemspider.com/
- GESTIS Substance Database (IFA) - https://gestis-database.dguv.de/

### Documentation technique
- Flask Documentation - https://flask.palletsprojects.com/
- Express.js Documentation - https://expressjs.com/
- Python unittest Documentation - https://docs.python.org/3/library/unittest.html