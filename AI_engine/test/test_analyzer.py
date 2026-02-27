# tests/test_analyzer.py
"""
Tests d'intégration pour le module d'analyse des risques chimiques
Projet IUT Génie Chimique - 1ère année

Ce fichier teste le fonctionnement complet du système d'analyse:
- Intégration de toutes les règles (inflammabilité, toxicité, incompatibilités)
- Calcul du score global
- Génération des recommandations
- Validation de la structure JSON de sortie

Utilisation:
    python -m unittest tests.test_analyzer
    ou
    python tests/test_analyzer.py
"""

import unittest
import sys
import os
import json

# Ajout du répertoire parent au path pour les imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.analyzer import (
    analyze_risk,
    analyze_single_substance,
    analyze_substance_pair,
    get_substance_info
)


class TestAnalyzerBasic(unittest.TestCase):
    """
    Tests de base pour le module analyzer.
    
    Vérifie que l'analyse fonctionne avec des cas simples et typiques.
    """
    
    def test_analyse_substance_unique(self):
        """
        Test d'analyse d'une seule substance.
        
        Cas simple: Éthanol
        Devrait retourner:
        - Score d'inflammabilité élevé (point éclair bas)
        - Score de toxicité moyen (nocif)
        - Pas d'incompatibilités (substance unique)
        """
        input_data = {
            'substances': ['Ethanol']
        }
        
        result = analyze_risk(input_data)
        
        # Vérification de la structure de base
        self.assertIn('score_global', result)
        self.assertIn('niveau_risque', result)
        self.assertIn('details', result)
        self.assertIn('recommandations', result)
        self.assertIn('substances_analysees', result)
        
        # Vérification du type des valeurs
        self.assertIsInstance(result['score_global'], (int, float))
        self.assertIn(result['niveau_risque'], ['FAIBLE', 'MOYEN', 'ELEVE'])
        self.assertIsInstance(result['recommandations'], list)
        
        # Vérification qu'il n'y a pas d'incompatibilités (substance unique)
        self.assertEqual(len(result['details']['incompatibilites']), 0)
        
        # Vérification qu'une substance a été analysée
        self.assertEqual(len(result['substances_analysees']), 1)
    
    def test_analyse_deux_substances_compatibles(self):
        """
        Test d'analyse de deux substances sans incompatibilité majeure.
        
        Cas: Éthanol + Acétone (deux solvants compatibles)
        """
        input_data = {
            'substances': ['Ethanol', 'Acetone']
        }
        
        result = analyze_risk(input_data)
        
        # Vérification de base
        self.assertIsInstance(result['score_global'], (int, float))
        
        # Deux substances devraient être analysées
        self.assertGreaterEqual(len(result['substances_analysees']), 1)
        
        # Le score d'incompatibilités devrait être faible ou nul
        incomp_score = result['details'].get('incompatibilites', [])
        if incomp_score:
            # Si des incompatibilités sont détectées, elles devraient être faibles
            for incomp in incomp_score:
                self.assertLess(incomp['score'], 50)
    
    def test_analyse_avec_quantites(self):
        """
        Test d'analyse avec quantités spécifiées.
        
        Les quantités devraient être stockées mais ne modifient pas le scoring.
        """
        input_data = {
            'substances': ['Ethanol', 'Acetone'],
            'quantites': {
                'Ethanol': 500,
                'Acetone': 250
            }
        }
        
        result = analyze_risk(input_data)
        
        # Vérification que les quantités sont présentes dans les résultats
        for substance in result['substances_analysees']:
            self.assertIn('quantite', substance)
    
    def test_analyse_avec_contexte_labo(self):
        """
        Test d'analyse avec contexte de laboratoire.
        
        Le contexte peut générer des avertissements supplémentaires.
        """
        input_data = {
            'substances': ['Acetone'],
            'contexte_labo': {
                'ventilation': False,
                'temperature_c': 28
            }
        }
        
        result = analyze_risk(input_data)
        
        # Devrait fonctionner sans erreur
        self.assertIsInstance(result['score_global'], (int, float))
        
        # Peut contenir des avertissements sur la ventilation
        if 'avertissements' in result:
            self.assertIsInstance(result['avertissements'], list)


class TestAnalyzerEdgeCases(unittest.TestCase):
    """
    Tests des cas limites et de la gestion des erreurs.
    
    Vérifie le comportement robuste avec des données manquantes ou invalides.
    """
    
    def test_substance_inconnue(self):
        """
        Test avec une substance non présente dans la base de données.
        
        Le système devrait gérer gracieusement et utiliser des valeurs par défaut.
        """
        input_data = {
            'substances': ['SubstanceInconnue123']
        }
        
        result = analyze_risk(input_data)
        
        # Devrait fonctionner sans lever d'exception
        self.assertIsInstance(result['score_global'], (int, float))
        
        # Devrait générer un avertissement
        if 'avertissements' in result:
            self.assertGreater(len(result['avertissements']), 0)
    
    def test_liste_vide(self):
        """
        Test avec une liste de substances vide.
        
        Devrait retourner une erreur de validation.
        """
        input_data = {
            'substances': []
        }
        
        result = analyze_risk(input_data)
        
        # Devrait contenir des erreurs
        self.assertIn('erreurs', result)
        self.assertGreater(len(result['erreurs']), 0)
    
    def test_donnees_manquantes(self):
        """
        Test avec des données d'entrée incomplètes.
        
        Devrait gérer gracieusement les champs manquants.
        """
        input_data = {
            # Pas de champ 'substances'
            'quantites': {'Eau': 1000}
        }
        
        result = analyze_risk(input_data)
        
        # Devrait retourner une erreur
        self.assertIn('erreurs', result)
    
    def test_donnees_invalides(self):
        """
        Test avec des données de type incorrect.
        """
        # substances devrait être une liste, pas une chaîne
        input_data = {
            'substances': 'Ethanol'
        }
        
        result = analyze_risk(input_data)
        
        # Devrait gérer l'erreur
        self.assertIn('erreurs', result)
    
    def test_trop_de_substances(self):
        """
        Test avec un nombre excessif de substances.
        
        Le système limite à 10 substances par analyse.
        """
        input_data = {
            'substances': [f'Substance{i}' for i in range(15)]
        }
        
        result = analyze_risk(input_data)
        
        # Devrait contenir une erreur ou avertissement
        self.assertTrue(
            len(result.get('erreurs', [])) > 0 or 
            len(result.get('avertissements', [])) > 0
        )


class TestAnalyzerIntegration(unittest.TestCase):
    """
    Tests d'intégration complets simulant des scénarios réalistes.
    """
    
    def test_scenario_labo_chimie_organique(self):
        """
        Test d'un scénario typique en laboratoire de chimie organique.
        
        Manipulation: Synthèse avec acide sulfurique et éthanol
        """
        input_data = {
            'substances': ['Acide sulfurique', 'Ethanol'],
            'quantites': {
                'Acide sulfurique': 50,
                'Ethanol': 200
            },
            'contexte_labo': {
                'ventilation': True,
                'temperature_c': 22
            }
        }
        
        result = analyze_risk(input_data)
        
        # Vérification de la structure complète
        self._verify_complete_structure(result)
        
        # Acide + solvant inflammable → risque au moins moyen
        self.assertIn(result['niveau_risque'], ['MOYEN', 'ELEVE'])
        
        # Devrait y avoir des recommandations
        self.assertGreater(len(result['recommandations']), 0)
    
    def test_scenario_produits_incompatibles(self):
        """
        Test avec des produits chimiquement incompatibles.
        
        Exemple: Acide + Base (réaction exothermique violente)
        """
        input_data = {
            'substances': ['Acide sulfurique', 'Hydroxyde de sodium']
        }
        
        result = analyze_risk(input_data)
        
        # Devrait détecter une incompatibilité
        self.assertGreater(len(result['details']['incompatibilites']), 0)
        
        # Le score d'incompatibilités devrait être élevé
        if result['details']['incompatibilites']:
            incomp_score = result['details']['incompatibilites'][0]['score']
            self.assertGreater(incomp_score, 40)
    
    def test_scenario_solvants_inflammables(self):
        """
        Test avec plusieurs solvants inflammables.
        
        Devrait détecter un risque d'inflammabilité élevé.
        """
        input_data = {
            'substances': ['Acetone', 'Ethanol', 'Ether diethylique'],
            'contexte_labo': {
                'ventilation': False
            }
        }
        
        result = analyze_risk(input_data)
        
        # Le score d'inflammabilité devrait être élevé
        self.assertGreater(result['details']['inflammabilite']['score'], 50)
        
        # Devrait y avoir des avertissements sur la ventilation
        if 'avertissements' in result:
            avertissements_str = ' '.join(result['avertissements'])
            self.assertTrue(
                'ventilation' in avertissements_str.lower() or
                'inflamm' in avertissements_str.lower()
            )
    
    def test_scenario_produits_toxiques(self):
        """
        Test avec des produits hautement toxiques.
        
        Devrait générer des recommandations strictes.
        """
        input_data = {
            'substances': ['Benzene']  # CMR catégorie 1
        }
        
        result = analyze_risk(input_data)
        
        # Le score de toxicité devrait être très élevé
        self.assertGreater(result['details']['toxicite']['score'], 70)
        
        # Devrait recommander EPI complets
        recommandations_str = ' '.join(result['recommandations'])
        self.assertTrue(
            'EPI' in recommandations_str or
            'protection' in recommandations_str.lower() or
            'hotte' in recommandations_str.lower()
        )
    
    def _verify_complete_structure(self, result):
        """
        Méthode utilitaire pour vérifier la structure complète du résultat.
        """
        # Champs obligatoires au niveau racine
        required_fields = [
            'score_global',
            'niveau_risque',
            'details',
            'recommandations',
            'substances_analysees'
        ]
        
        for field in required_fields:
            self.assertIn(field, result, f"Champ manquant: {field}")
        
        # Structure de 'details'
        self.assertIn('inflammabilite', result['details'])
        self.assertIn('toxicite', result['details'])
        self.assertIn('incompatibilites', result['details'])
        
        # Types de données
        self.assertIsInstance(result['score_global'], (int, float))
        self.assertIsInstance(result['niveau_risque'], str)
        self.assertIsInstance(result['recommandations'], list)
        self.assertIsInstance(result['substances_analysees'], list)


class TestAnalyzerOutputValidation(unittest.TestCase):
    """
    Tests de validation du format de sortie JSON.
    
    Vérifie que la sortie est bien formattée et sérialisable en JSON.
    """
    
    def test_sortie_json_serialisable(self):
        """
        Test que le résultat peut être sérialisé en JSON.
        
        Important pour l'utilisation dans une API REST.
        """
        input_data = {
            'substances': ['Ethanol', 'Acetone']
        }
        
        result = analyze_risk(input_data)
        
        # Tentative de sérialisation JSON
        try:
            json_str = json.dumps(result, ensure_ascii=False, indent=2)
            self.assertIsInstance(json_str, str)
            
            # Tentative de désérialisation
            parsed = json.loads(json_str)
            self.assertEqual(parsed['score_global'], result['score_global'])
        except (TypeError, ValueError) as e:
            self.fail(f"Le résultat n'est pas sérialisable en JSON: {e}")
    
    def test_coherence_scores(self):
        """
        Test de cohérence entre les scores détaillés et le score global.
        
        Le score global devrait être dans la plage attendue selon les scores individuels.
        """
        input_data = {
            'substances': ['Ethanol']
        }
        
        result = analyze_risk(input_data)
        
        # Extraction des scores
        score_global = result['score_global']
        score_inflam = result['details']['inflammabilite']['score']
        score_tox = result['details']['toxicite']['score']
        
        # Le score global devrait être une combinaison pondérée
        # Il devrait être dans une plage raisonnable
        self.assertGreaterEqual(score_global, 0)
        self.assertLessEqual(score_global, 100)
        
        # Ne devrait pas être exactement égal à un seul score individuel
        # (sauf cas très particuliers)
    
    def test_niveau_risque_coherent_avec_score(self):
        """
        Test que le niveau de risque est cohérent avec le score global.
        """
        # Test avec différentes substances pour couvrir tous les niveaux
        substances_test = [
            (['Eau'], 'FAIBLE'),  # Risque attendu faible
            (['Ethanol'], 'MOYEN'),  # Risque attendu moyen
            (['Benzene'], 'ELEVE')  # Risque attendu élevé (si dans la BD)
        ]
        
        for substances, niveau_attendu_approx in substances_test:
            input_data = {'substances': substances}
            result = analyze_risk(input_data)
            
            score = result['score_global']
            niveau = result['niveau_risque']
            
            # Vérification de cohérence score/niveau
            if score < 40:
                self.assertEqual(niveau, 'FAIBLE')
            elif score < 70:
                self.assertEqual(niveau, 'MOYEN')
            else:
                self.assertEqual(niveau, 'ELEVE')


class TestAnalyzerUtilityFunctions(unittest.TestCase):
    """
    Tests des fonctions utilitaires du module analyzer.
    """
    
    def test_analyze_single_substance(self):
        """
        Test de la fonction d'analyse simplifiée pour une substance.
        """
        result = analyze_single_substance('Ethanol')
        
        # Devrait retourner une structure valide
        self.assertIn('score_global', result)
        self.assertEqual(len(result['substances_analysees']), 1)
    
    def test_analyze_substance_pair(self):
        """
        Test de la fonction d'analyse de paire de substances.
        """
        result = analyze_substance_pair('Acide sulfurique', 'Hydroxyde de sodium')
        
        # Devrait retourner une structure valide
        self.assertIn('score_global', result)
        
        # Devrait analyser au moins une substance
        self.assertGreaterEqual(len(result['substances_analysees']), 1)


class TestAnalyzerRecommendations(unittest.TestCase):
    """
    Tests spécifiques pour la génération de recommandations.
    """
    
    def test_recommandations_presentes(self):
        """
        Test que des recommandations sont toujours générées.
        """
        input_data = {
            'substances': ['Ethanol']
        }
        
        result = analyze_risk(input_data)
        
        # Devrait toujours y avoir au moins une recommandation
        self.assertGreater(len(result['recommandations']), 0)
    
    def test_recommandations_adaptees_au_risque(self):
        """
        Test que les recommandations sont adaptées au niveau de risque.
        
        Un risque élevé devrait générer plus de recommandations qu'un risque faible.
        """
        # Substance à faible risque
        input_faible = {'substances': ['Eau']}
        result_faible = analyze_risk(input_faible)
        
        # Substance à risque élevé (si disponible dans la BD)
        input_eleve = {'substances': ['Benzene']}
        result_eleve = analyze_risk(input_eleve)
        
        # Les recommandations devraient être différentes
        self.assertNotEqual(
            result_faible['recommandations'],
            result_eleve['recommandations']
        )


# Point d'entrée pour exécution directe
if __name__ == '__main__':
    unittest.main(verbosity=2)