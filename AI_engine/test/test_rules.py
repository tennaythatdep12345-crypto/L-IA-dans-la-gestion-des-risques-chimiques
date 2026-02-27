# tests/test_rules.py
"""
Tests unitaires pour les modules de règles expertes
Projet IUT Génie Chimique - 1ère année

Ce fichier teste la logique des règles d'évaluation des risques:
- Inflammabilité (basée sur le point éclair)
- Toxicité (basée sur les niveaux qualitatifs)
- Incompatibilités (basée sur les paires de substances)

Utilisation:
    python -m unittest tests.test_rules
    ou
    python tests/test_rules.py
"""

import unittest
import sys
import os

# Ajout du répertoire parent au path pour les imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rules.inflammabilite import (
    evaluate_inflammability,
    get_inflammability_score,
    get_inflammability_level,
    classify_by_flash_point,
    is_highly_flammable
)
from rules.toxicite import (
    evaluate_toxicity,
    get_toxicity_score,
    get_toxicity_level,
    is_highly_toxic,
    is_cmr
)
from rules.incompatibilites import (
    evaluate_incompatibility,
    get_incompatibility_score,
    are_incompatible
)


class TestInflammabilite(unittest.TestCase):
    """
    Tests pour le module d'évaluation de l'inflammabilité.
    
    Teste la classification basée sur le point éclair:
    - Très inflammable: < 23°C
    - Inflammable: 23-60°C
    - Peu inflammable: 60-100°C
    - Non inflammable: > 100°C ou None
    """
    
    def test_tres_inflammable(self):
        """
        Test pour une substance très inflammable (point éclair < 23°C).
        Exemple: acétone (point éclair = -20°C)
        """
        substance = {
            'nom': 'Acétone',
            'point_eclair': -20,
            'cas': '67-64-1'
        }
        
        result = evaluate_inflammability(substance)
        
        self.assertEqual(result['niveau'], 'TRES_INFLAMMABLE')
        self.assertGreaterEqual(result['score'], 80)
        self.assertIn('Acétone', result['explication'])
    
    def test_inflammable_moderee(self):
        """
        Test pour une substance inflammable modérée (point éclair entre 23°C et 60°C).
        Exemple: éthanol (point éclair = 13°C)
        """
        substance = {
            'nom': 'Éthanol',
            'point_eclair': 13,
            'cas': '64-17-5'
        }
        
        result = evaluate_inflammability(substance)
        
        self.assertEqual(result['niveau'], 'TRES_INFLAMMABLE')
        self.assertGreaterEqual(result['score'], 80)
    
    def test_peu_inflammable(self):
        """
        Test pour une substance peu inflammable (point éclair entre 60°C et 100°C).
        """
        substance = {
            'nom': 'Huile minérale',
            'point_eclair': 85
        }
        
        result = evaluate_inflammability(substance)
        
        self.assertEqual(result['niveau'], 'PEU_INFLAMMABLE')
        self.assertLess(result['score'], 40)
    
    def test_non_inflammable(self):
        """
        Test pour une substance non inflammable (point éclair > 100°C).
        """
        substance = {
            'nom': 'Glycérol',
            'point_eclair': 160
        }
        
        result = evaluate_inflammability(substance)
        
        self.assertEqual(result['niveau'], 'NON_INFLAMMABLE')
        self.assertLessEqual(result['score'], 10)
    
    def test_point_eclair_missing(self):
        """
        Test pour une substance sans point éclair renseigné.
        Doit retourner un niveau NON_INFLAMMABLE par défaut.
        """
        substance = {
            'nom': 'Eau',
            'point_eclair': None
        }
        
        result = evaluate_inflammability(substance)
        
        self.assertEqual(result['niveau'], 'NON_INFLAMMABLE')
        self.assertLessEqual(result['score'], 10)
    
    def test_get_inflammability_score(self):
        """
        Test de la fonction utilitaire qui retourne uniquement le score.
        """
        substance = {
            'nom': 'Méthanol',
            'point_eclair': 11
        }
        
        score = get_inflammability_score(substance)
        
        self.assertIsInstance(score, int)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_classify_by_flash_point(self):
        """
        Test de la classification directe par point éclair.
        """
        self.assertEqual(classify_by_flash_point(10), 'TRES_INFLAMMABLE')
        self.assertEqual(classify_by_flash_point(40), 'INFLAMMABLE')
        self.assertEqual(classify_by_flash_point(80), 'PEU_INFLAMMABLE')
        self.assertEqual(classify_by_flash_point(150), 'NON_INFLAMMABLE')
        self.assertEqual(classify_by_flash_point(None), 'NON_INFLAMMABLE')
    
    def test_is_highly_flammable(self):
        """
        Test de la fonction de détection des substances hautement inflammables.
        """
        substance_inflammable = {
            'nom': 'Éther diéthylique',
            'point_eclair': -45
        }
        
        substance_non_inflammable = {
            'nom': 'Eau',
            'point_eclair': None
        }
        
        self.assertTrue(is_highly_flammable(substance_inflammable))
        self.assertFalse(is_highly_flammable(substance_non_inflammable))


class TestToxicite(unittest.TestCase):
    """
    Tests pour le module d'évaluation de la toxicité.
    
    Teste la classification basée sur les niveaux qualitatifs:
    - TRES_TOXIQUE: CMR, toxicité aiguë élevée
    - TOXIQUE: Toxique, corrosif
    - NOCIF: Nocif, irritant sévère
    - IRRITANT: Irritant modéré
    - PEU_TOXIQUE: Toxicité faible
    - NON_TOXIQUE: Pas de danger identifié
    """
    
    def test_tres_toxique(self):
        """
        Test pour une substance très toxique (CMR, toxicité aiguë cat. 1-2).
        """
        substance = {
            'nom': 'Benzène',
            'toxicite': 'TRES_TOXIQUE'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertEqual(result['niveau'], 'TRES_TOXIQUE')
        self.assertGreaterEqual(result['score'], 90)
        self.assertIn('Benzène', result['explication'])
    
    def test_toxique(self):
        """
        Test pour une substance toxique.
        """
        substance = {
            'nom': 'Acide chlorhydrique',
            'toxicite': 'TOXIQUE'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertEqual(result['niveau'], 'TOXIQUE')
        self.assertGreaterEqual(result['score'], 60)
        self.assertLessEqual(result['score'], 80)
    
    def test_nocif(self):
        """
        Test pour une substance nocive.
        """
        substance = {
            'nom': 'Ammoniaque',
            'toxicite': 'NOCIF'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertEqual(result['niveau'], 'NOCIF')
        self.assertGreaterEqual(result['score'], 35)
        self.assertLessEqual(result['score'], 55)
    
    def test_irritant(self):
        """
        Test pour une substance irritante.
        """
        substance = {
            'nom': 'Savon',
            'toxicite': 'IRRITANT'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertEqual(result['niveau'], 'IRRITANT')
        self.assertGreaterEqual(result['score'], 15)
        self.assertLessEqual(result['score'], 35)
    
    def test_peu_toxique(self):
        """
        Test pour une substance peu toxique.
        """
        substance = {
            'nom': 'Chlorure de sodium',
            'toxicite': 'PEU_TOXIQUE'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertEqual(result['niveau'], 'PEU_TOXIQUE')
        self.assertLessEqual(result['score'], 15)
    
    def test_non_toxique(self):
        """
        Test pour une substance non toxique.
        """
        substance = {
            'nom': 'Eau distillée',
            'toxicite': 'NON_TOXIQUE'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertEqual(result['niveau'], 'NON_TOXIQUE')
        self.assertEqual(result['score'], 0)
    
    def test_toxicite_missing(self):
        """
        Test pour une substance sans niveau de toxicité renseigné.
        Doit utiliser le niveau par défaut (NOCIF par précaution).
        """
        substance = {
            'nom': 'Produit inconnu',
            'toxicite': None
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertIn(result['niveau'], ['NOCIF', 'NON_TOXIQUE', 'PEU_TOXIQUE'])
        self.assertIsInstance(result['score'], int)
    
    def test_toxicite_non_reconnue(self):
        """
        Test pour un niveau de toxicité non reconnu.
        Doit gérer gracieusement et utiliser une valeur par défaut.
        """
        substance = {
            'nom': 'Produit xyz',
            'toxicite': 'NIVEAU_INVALIDE'
        }
        
        result = evaluate_toxicity(substance)
        
        self.assertIsInstance(result['score'], int)
        self.assertIsInstance(result['niveau'], str)
    
    def test_get_toxicity_score(self):
        """
        Test de la fonction utilitaire qui retourne uniquement le score.
        """
        substance = {
            'nom': 'Formaldéhyde',
            'toxicite': 'TRES_TOXIQUE'
        }
        
        score = get_toxicity_score(substance)
        
        self.assertIsInstance(score, int)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_is_highly_toxic(self):
        """
        Test de la fonction de détection des substances hautement toxiques.
        """
        substance_toxique = {
            'nom': 'Cyanure',
            'toxicite': 'TRES_TOXIQUE'
        }
        
        substance_non_toxique = {
            'nom': 'Eau',
            'toxicite': 'NON_TOXIQUE'
        }
        
        self.assertTrue(is_highly_toxic(substance_toxique))
        self.assertFalse(is_highly_toxic(substance_non_toxique))
    
    def test_is_cmr(self):
        """
        Test de la fonction de détection des substances CMR.
        """
        substance_cmr = {
            'nom': 'Benzène',
            'toxicite': 'TRES_TOXIQUE'
        }
        
        substance_non_cmr = {
            'nom': 'Éthanol',
            'toxicite': 'NOCIF'
        }
        
        self.assertTrue(is_cmr(substance_cmr))
        self.assertFalse(is_cmr(substance_non_cmr))


class TestIncompatibilites(unittest.TestCase):
    """
    Tests pour le module d'évaluation des incompatibilités chimiques.
    
    Teste la détection d'incompatibilités:
    - Par base de données directe
    - Par catégories chimiques (acide+base, oxydant+réducteur, etc.)
    - Gestion des cas sans incompatibilité
    """
    
    def setUp(self):
        """
        Préparation des données de test.
        Création d'une liste d'incompatibilités factices.
        """
        self.incompatibilities_list = [
            {
                'substance_a': 'acide sulfurique',
                'substance_a_normalise': 'acide sulfurique',
                'substance_b': 'hydroxyde de sodium',
                'substance_b_normalise': 'hydroxyde de sodium',
                'niveau_risque': 'ELEVE'
            },
            {
                'substance_a': 'eau de javel',
                'substance_a_normalise': 'eau de javel',
                'substance_b': 'acide chlorhydrique',
                'substance_b_normalise': 'acide chlorhydrique',
                'niveau_risque': 'SEVERE'
            }
        ]
    
    def test_incompatibilite_directe_elevee(self):
        """
        Test d'une incompatibilité directe connue avec risque élevé.
        Exemple: acide + base forte
        """
        substance1 = {
            'nom': 'Acide sulfurique',
            'categorie': 'acide'
        }
        
        substance2 = {
            'nom': 'Hydroxyde de sodium',
            'categorie': 'base'
        }
        
        result = evaluate_incompatibility(substance1, substance2, self.incompatibilities_list)
        
        self.assertTrue(result['incompatible'])
        self.assertGreater(result['score'], 0)
        self.assertIn('ELEVE', result['niveau_risque'])
    
    def test_incompatibilite_severe(self):
        """
        Test d'une incompatibilité sévère.
        Exemple: eau de javel + acide
        """
        substance1 = {
            'nom': 'Eau de javel',
            'categorie': 'oxydant'
        }
        
        substance2 = {
            'nom': 'Acide chlorhydrique',
            'categorie': 'acide'
        }
        
        result = evaluate_incompatibility(substance1, substance2, self.incompatibilities_list)
        
        self.assertTrue(result['incompatible'])
        self.assertGreater(result['score'], 50)
    
    def test_incompatibilite_par_categorie(self):
        """
        Test de détection d'incompatibilité par catégorie chimique.
        Même si non listée explicitement, acide+base doivent être détectés.
        """
        substance1 = {
            'nom': 'Acide nitrique',
            'categorie': 'acide'
        }
        
        substance2 = {
            'nom': 'Potasse',
            'categorie': 'base'
        }
        
        result = evaluate_incompatibility(substance1, substance2, self.incompatibilities_list)
        
        self.assertTrue(result['incompatible'])
        self.assertGreater(result['score'], 0)
    
    def test_pas_incompatibilite(self):
        """
        Test pour deux substances sans incompatibilité connue.
        """
        substance1 = {
            'nom': 'Éthanol',
            'categorie': 'solvant'
        }
        
        substance2 = {
            'nom': 'Acétone',
            'categorie': 'solvant'
        }
        
        result = evaluate_incompatibility(substance1, substance2, self.incompatibilities_list)
        
        self.assertFalse(result['incompatible'])
        self.assertEqual(result['score'], 0)
        self.assertEqual(result['niveau_risque'], 'AUCUN')
    
    def test_substance_manquante(self):
        """
        Test avec une substance non définie.
        Doit gérer gracieusement sans erreur.
        """
        substance1 = {
            'nom': '',
            'categorie': ''
        }
        
        substance2 = {
            'nom': 'Éthanol',
            'categorie': 'solvant'
        }
        
        result = evaluate_incompatibility(substance1, substance2, self.incompatibilities_list)
        
        self.assertFalse(result['incompatible'])
        self.assertEqual(result['score'], 0)
    
    def test_get_incompatibility_score(self):
        """
        Test de la fonction utilitaire qui retourne uniquement le score.
        """
        substance1 = {
            'nom': 'Acide sulfurique',
            'categorie': 'acide'
        }
        
        substance2 = {
            'nom': 'Hydroxyde de sodium',
            'categorie': 'base'
        }
        
        score = get_incompatibility_score(substance1, substance2, self.incompatibilities_list)
        
        self.assertIsInstance(score, int)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
    
    def test_are_incompatible(self):
        """
        Test de la fonction booléenne de détection d'incompatibilité.
        """
        substance1 = {
            'nom': 'Acide sulfurique',
            'categorie': 'acide'
        }
        
        substance2 = {
            'nom': 'Hydroxyde de sodium',
            'categorie': 'base'
        }
        
        substance3 = {
            'nom': 'Éthanol',
            'categorie': 'solvant'
        }
        
        self.assertTrue(are_incompatible(substance1, substance2, self.incompatibilities_list))
        self.assertFalse(are_incompatible(substance1, substance3, self.incompatibilities_list))
    
    def test_oxydant_reducteur(self):
        """
        Test de l'incompatibilité oxydant + réducteur (par catégorie).
        """
        substance1 = {
            'nom': 'Peroxyde d\'hydrogène',
            'categorie': 'oxydant'
        }
        
        substance2 = {
            'nom': 'Zinc',
            'categorie': 'reducteur'
        }
        
        result = evaluate_incompatibility(substance1, substance2, self.incompatibilities_list)
        
        # Devrait être détecté comme incompatible via les règles de catégorie
        self.assertTrue(result['incompatible'])
        self.assertGreater(result['score'], 0)


class TestIntegration(unittest.TestCase):
    """
    Tests d'intégration vérifiant que les modules fonctionnent ensemble.
    """
    
    def test_substance_complete(self):
        """
        Test d'une évaluation complète d'une substance avec toutes ses propriétés.
        """
        substance = {
            'nom': 'Éthanol',
            'cas': '64-17-5',
            'point_eclair': 13,
            'toxicite': 'NOCIF',
            'categorie': 'solvant'
        }
        
        # Test inflammabilité
        inflam_result = evaluate_inflammability(substance)
        self.assertIsInstance(inflam_result['score'], int)
        
        # Test toxicité
        tox_result = evaluate_toxicity(substance)
        self.assertIsInstance(tox_result['score'], int)
        
        # Vérification que les scores sont cohérents
        self.assertGreaterEqual(inflam_result['score'], 0)
        self.assertLessEqual(inflam_result['score'], 100)
        self.assertGreaterEqual(tox_result['score'], 0)
        self.assertLessEqual(tox_result['score'], 100)


# Point d'entrée pour exécution directe
if __name__ == '__main__':
    unittest.main(verbosity=2)