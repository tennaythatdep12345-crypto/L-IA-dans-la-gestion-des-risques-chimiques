# tests/test_scoring.py
"""
Tests unitaires pour le module de scoring global
Projet IUT Génie Chimique - 1ère année

Ce fichier teste la logique d'agrégation des scores de risque:
- Calcul du score global pondéré
- Attribution du niveau de risque qualitatif (FAIBLE, MOYEN, ELEVE)
- Gestion des cas limites et des données manquantes

Utilisation:
    python -m unittest tests.test_scoring
    ou
    python tests/test_scoring.py
"""

import unittest
import sys
import os

# Ajout du répertoire parent au path pour les imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Scoring.risk_score import (
    calculate_global_risk_score,
    get_risk_level_only,
    is_high_risk,
    compare_risks,
    get_recommendations_by_level,
    generate_risk_summary
)
from config.settings import (
    CATEGORY_WEIGHTS,
    RISK_LEVEL_THRESHOLDS
)


class TestCalculateGlobalScore(unittest.TestCase):
    """
    Tests pour la fonction principale de calcul du score global.
    
    Vérifie que:
    - Les scores sont correctement pondérés
    - Le score global est dans la plage [0, 100]
    - Le niveau de risque est correctement déterminé
    """
    
    def test_scores_moyens(self):
        """
        Test avec des scores moyens typiques d'un laboratoire.
        
        Scores:
        - Inflammabilité: 50 (moyen)
        - Toxicité: 60 (moyen-élevé)
        - Incompatibilités: 30 (faible-moyen)
        
        Devrait donner un risque MOYEN.
        """
        individual_scores = {
            'inflammabilite': 50,
            'toxicite': 60,
            'incompatibilites': 30
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        # Vérifications de structure
        self.assertIn('score_global', result)
        self.assertIn('niveau_risque', result)
        self.assertIn('scores_details', result)
        self.assertIn('scores_ponderes', result)
        
        # Vérification du score global
        self.assertIsInstance(result['score_global'], (int, float))
        self.assertGreaterEqual(result['score_global'], 0)
        self.assertLessEqual(result['score_global'], 100)
        
        # Vérification du niveau de risque
        self.assertIn(result['niveau_risque'], ['FAIBLE', 'MOYEN', 'ELEVE'])
    
    def test_risque_faible(self):
        """
        Test avec des scores faibles.
        
        Tous les scores < 20 devraient donner un risque FAIBLE.
        """
        individual_scores = {
            'inflammabilite': 10,
            'toxicite': 15,
            'incompatibilites': 5
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result['niveau_risque'], 'FAIBLE')
        self.assertLess(result['score_global'], RISK_LEVEL_THRESHOLDS['MOYEN'])
    
    def test_risque_moyen(self):
        """
        Test avec des scores moyens.
        
        Scores dans la plage 40-69 devraient donner un risque MOYEN.
        """
        individual_scores = {
            'inflammabilite': 50,
            'toxicite': 50,
            'incompatibilites': 50
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result['niveau_risque'], 'MOYEN')
        self.assertGreaterEqual(result['score_global'], RISK_LEVEL_THRESHOLDS['MOYEN'])
        self.assertLess(result['score_global'], RISK_LEVEL_THRESHOLDS['ELEVE'])
    
    def test_risque_eleve(self):
        """
        Test avec des scores élevés.
        
        Scores > 70 devraient donner un risque ÉLEVÉ.
        """
        individual_scores = {
            'inflammabilite': 85,
            'toxicite': 90,
            'incompatibilites': 80
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result['niveau_risque'], 'ELEVE')
        self.assertGreaterEqual(result['score_global'], RISK_LEVEL_THRESHOLDS['ELEVE'])
    
    def test_scores_maximum(self):
        """
        Test avec tous les scores au maximum (100).
        
        Devrait donner un score global de 100 et risque ÉLEVÉ.
        """
        individual_scores = {
            'inflammabilite': 100,
            'toxicite': 100,
            'incompatibilites': 100
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result['score_global'], 100.0)
        self.assertEqual(result['niveau_risque'], 'ELEVE')
    
    def test_scores_minimum(self):
        """
        Test avec tous les scores au minimum (0).
        
        Devrait donner un score global de 0 et risque FAIBLE.
        """
        individual_scores = {
            'inflammabilite': 0,
            'toxicite': 0,
            'incompatibilites': 0
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result['score_global'], 0.0)
        self.assertEqual(result['niveau_risque'], 'FAIBLE')
    
    def test_ponderation_correcte(self):
        """
        Test de la pondération des scores.
        
        Vérifie que les poids définis dans config/settings.py sont appliqués correctement.
        Exemple: si toxicité a un poids de 0.4 (40%), un score de 100 en toxicité
        devrait contribuer 40 points au score global (si autres scores = 0).
        """
        # Score de toxicité uniquement
        individual_scores = {
            'inflammabilite': 0,
            'toxicite': 100,
            'incompatibilites': 0
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        # Le score global devrait être égal à: 100 * poids_toxicité
        expected_score = 100 * CATEGORY_WEIGHTS['toxicite']
        
        self.assertAlmostEqual(result['score_global'], expected_score, places=1)
        
        # Vérification que les scores pondérés sont présents
        self.assertIn('toxicite', result['scores_ponderes'])
        self.assertAlmostEqual(
            result['scores_ponderes']['toxicite'],
            expected_score,
            places=1
        )


class TestEdgeCases(unittest.TestCase):
    """
    Tests pour les cas limites et la gestion des erreurs.
    
    Vérifie le comportement avec:
    - Données manquantes
    - Valeurs invalides
    - Scores hors limites
    """
    
    def test_score_manquant(self):
        """
        Test avec un score manquant.
        
        Si une catégorie est absente, un score de 0 devrait être utilisé par défaut.
        """
        individual_scores = {
            'inflammabilite': 50,
            'toxicite': 60
            # incompatibilites manquant
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        # Devrait fonctionner sans erreur
        self.assertIsInstance(result['score_global'], (int, float))
        
        # Le score d'incompatibilités devrait être 0
        self.assertEqual(result['scores_details']['incompatibilites'], 0)
    
    def test_tous_scores_manquants(self):
        """
        Test avec tous les scores manquants (dictionnaire vide).
        
        Devrait utiliser des valeurs par défaut (0) et retourner risque FAIBLE.
        """
        individual_scores = {}
        
        result = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result['score_global'], 0.0)
        self.assertEqual(result['niveau_risque'], 'FAIBLE')
    
    def test_score_negatif(self):
        """
        Test avec un score négatif (invalide).
        
        Les scores négatifs devraient être normalisés à 0.
        """
        individual_scores = {
            'inflammabilite': -10,
            'toxicite': 50,
            'incompatibilites': 30
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        # Le score d'inflammabilité devrait être normalisé à 0
        self.assertEqual(result['scores_details']['inflammabilite'], 0)
    
    def test_score_superieur_100(self):
        """
        Test avec un score > 100 (invalide).
        
        Les scores > 100 devraient être normalisés à 100.
        """
        individual_scores = {
            'inflammabilite': 150,
            'toxicite': 50,
            'incompatibilites': 30
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        # Le score d'inflammabilité devrait être normalisé à 100
        self.assertEqual(result['scores_details']['inflammabilite'], 100)
    
    def test_score_non_numerique(self):
        """
        Test avec un score non numérique (chaîne de caractères).
        
        Devrait gérer gracieusement et utiliser 0 par défaut.
        """
        individual_scores = {
            'inflammabilite': 'invalide',
            'toxicite': 50,
            'incompatibilites': 30
        }
        
        result = calculate_global_risk_score(individual_scores)
        
        # Devrait fonctionner sans lever d'exception
        self.assertIsInstance(result['score_global'], (int, float))
        
        # Le score invalide devrait être traité comme 0
        self.assertEqual(result['scores_details']['inflammabilite'], 0)


class TestRiskLevelDetermination(unittest.TestCase):
    """
    Tests spécifiques pour la détermination du niveau de risque qualitatif.
    
    Vérifie que les seuils de config/settings.py sont correctement appliqués.
    """
    
    def test_seuil_faible_moyen(self):
        """
        Test du seuil entre FAIBLE et MOYEN.
        
        Un score juste en dessous du seuil MOYEN devrait être FAIBLE.
        Un score égal ou au-dessus devrait être MOYEN.
        """
        seuil_moyen = RISK_LEVEL_THRESHOLDS['MOYEN']
        
        # Juste en dessous du seuil
        score_faible = seuil_moyen - 1
        niveau_faible = get_risk_level_only(score_faible)
        self.assertEqual(niveau_faible, 'FAIBLE')
        
        # Au seuil exact
        niveau_moyen = get_risk_level_only(seuil_moyen)
        self.assertEqual(niveau_moyen, 'MOYEN')
        
        # Juste au-dessus du seuil
        niveau_moyen2 = get_risk_level_only(seuil_moyen + 1)
        self.assertEqual(niveau_moyen2, 'MOYEN')
    
    def test_seuil_moyen_eleve(self):
        """
        Test du seuil entre MOYEN et ÉLEVÉ.
        
        Un score juste en dessous du seuil ÉLEVÉ devrait être MOYEN.
        Un score égal ou au-dessus devrait être ÉLEVÉ.
        """
        seuil_eleve = RISK_LEVEL_THRESHOLDS['ELEVE']
        
        # Juste en dessous du seuil
        score_moyen = seuil_eleve - 1
        niveau_moyen = get_risk_level_only(score_moyen)
        self.assertEqual(niveau_moyen, 'MOYEN')
        
        # Au seuil exact
        niveau_eleve = get_risk_level_only(seuil_eleve)
        self.assertEqual(niveau_eleve, 'ELEVE')
        
        # Juste au-dessus du seuil
        niveau_eleve2 = get_risk_level_only(seuil_eleve + 1)
        self.assertEqual(niveau_eleve2, 'ELEVE')
    
    def test_get_risk_level_only(self):
        """
        Test de la fonction utilitaire get_risk_level_only.
        """
        self.assertEqual(get_risk_level_only(10), 'FAIBLE')
        self.assertEqual(get_risk_level_only(50), 'MOYEN')
        self.assertEqual(get_risk_level_only(85), 'ELEVE')


class TestUtilityFunctions(unittest.TestCase):
    """
    Tests pour les fonctions utilitaires du module de scoring.
    """
    
    def test_is_high_risk(self):
        """
        Test de la fonction is_high_risk.
        
        Devrait retourner True si le niveau de risque est ÉLEVÉ.
        """
        scores_eleves = {
            'inflammabilite': 90,
            'toxicite': 85,
            'incompatibilites': 80
        }
        
        scores_faibles = {
            'inflammabilite': 10,
            'toxicite': 15,
            'incompatibilites': 5
        }
        
        self.assertTrue(is_high_risk(scores_eleves))
        self.assertFalse(is_high_risk(scores_faibles))
    
    def test_compare_risks(self):
        """
        Test de la fonction de comparaison entre deux substances.
        """
        scores1 = {
            'inflammabilite': 80,
            'toxicite': 70,
            'incompatibilites': 60
        }
        
        scores2 = {
            'inflammabilite': 30,
            'toxicite': 40,
            'incompatibilites': 20
        }
        
        result = compare_risks(scores1, scores2, 'Substance A', 'Substance B')
        
        # Vérifications de structure
        self.assertIn('plus_risquee', result)
        self.assertIn('difference', result)
        self.assertIn('conclusion', result)
        
        # Substance A devrait être plus risquée
        self.assertEqual(result['plus_risquee'], 'Substance A')
        self.assertGreater(result['difference'], 0)
    
    def test_compare_risks_egaux(self):
        """
        Test de comparaison avec des scores identiques.
        """
        scores = {
            'inflammabilite': 50,
            'toxicite': 50,
            'incompatibilites': 50
        }
        
        result = compare_risks(scores, scores, 'Substance A', 'Substance B')
        
        self.assertIsNone(result['plus_risquee'])
        self.assertEqual(result['difference'], 0)
    
    def test_get_recommendations_by_level(self):
        """
        Test de génération de recommandations selon le niveau de risque.
        """
        recs_faible = get_recommendations_by_level('FAIBLE')
        recs_moyen = get_recommendations_by_level('MOYEN')
        recs_eleve = get_recommendations_by_level('ELEVE')
        
        # Vérification que ce sont des listes non vides
        self.assertIsInstance(recs_faible, list)
        self.assertIsInstance(recs_moyen, list)
        self.assertIsInstance(recs_eleve, list)
        
        self.assertGreater(len(recs_faible), 0)
        self.assertGreater(len(recs_moyen), 0)
        self.assertGreater(len(recs_eleve), 0)
        
        # Les recommandations pour risque élevé devraient être plus nombreuses
        self.assertGreaterEqual(len(recs_eleve), len(recs_faible))
    
    def test_generate_risk_summary(self):
        """
        Test de génération d'un résumé complet.
        """
        individual_scores = {
            'inflammabilite': 60,
            'toxicite': 70,
            'incompatibilites': 40
        }
        
        summary = generate_risk_summary(individual_scores, 'Éthanol')
        
        # Vérifications de structure
        self.assertIn('substance', summary)
        self.assertIn('score_global', summary)
        self.assertIn('niveau_risque', summary)
        self.assertIn('scores_par_categorie', summary)
        self.assertIn('recommandations', summary)
        
        # Vérification du nom de substance
        self.assertEqual(summary['substance'], 'Éthanol')
        
        # Vérification que les recommandations sont présentes
        self.assertIsInstance(summary['recommandations'], list)
        self.assertGreater(len(summary['recommandations']), 0)


class TestConsistency(unittest.TestCase):
    """
    Tests de cohérence et de reproductibilité.
    
    Vérifie que les calculs sont déterministes.
    """
    
    def test_reproductibilite(self):
        """
        Test que les mêmes entrées donnent toujours les mêmes résultats.
        """
        individual_scores = {
            'inflammabilite': 55,
            'toxicite': 65,
            'incompatibilites': 45
        }
        
        result1 = calculate_global_risk_score(individual_scores)
        result2 = calculate_global_risk_score(individual_scores)
        
        self.assertEqual(result1['score_global'], result2['score_global'])
        self.assertEqual(result1['niveau_risque'], result2['niveau_risque'])
    
    def test_somme_poids(self):
        """
        Test que la somme des poids est égale à 1.0.
        
        Ceci garantit que le score global reste dans [0, 100].
        """
        somme_poids = sum(CATEGORY_WEIGHTS.values())
        
        self.assertAlmostEqual(somme_poids, 1.0, places=5)


# Point d'entrée pour exécution directe
if __name__ == '__main__':
    unittest.main(verbosity=2)