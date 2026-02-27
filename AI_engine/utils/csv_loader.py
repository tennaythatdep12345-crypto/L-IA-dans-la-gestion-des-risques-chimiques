# AI_engine/utils/csv_loader.py
"""
Module de chargement des fichiers CSV contenant les données chimiques.
Utilise des chemins absolus pour garantir le chargement correct des fichiers.
"""

import csv
import os
from .processor import normalize_text, standardize_chemical_name, extract_numeric_value


# Calcul du chemin absolu vers le dossier data/
# Structure: AI_engine/utils/csv_loader.py -> ../../data/
CURRENT_FILE = os.path.abspath(__file__)  # /path/to/AI_engine/utils/csv_loader.py
UTILS_DIR = os.path.dirname(CURRENT_FILE)  # /path/to/AI_engine/utils
AI_ENGINE_DIR = os.path.dirname(UTILS_DIR)  # /path/to/AI_engine
PROJECT_ROOT = os.path.dirname(AI_ENGINE_DIR)  # /path/to/Projet_gestion_des_risques
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')  # /path/to/Projet_gestion_des_risques/data

# Chemins absolus vers les fichiers CSV
SUBSTANCES_CSV_PATH = os.path.join(DATA_DIR, 'substances.csv')
INCOMPATIBILITIES_CSV_PATH = os.path.join(DATA_DIR, 'incompatibilites.csv')


def load_substances(filepath=None):
    """
    Charge les substances chimiques depuis le fichier CSV.
    
    Args:
        filepath (str, optional): Chemin personnalisé vers le fichier CSV.
                                  Si None, utilise le chemin par défaut.
    
    Returns:
        dict: Dictionnaire indexé par numéro CAS
              {
                  "cas_number": {
                      "cas": "...",
                      "nom": "...",
                      "point_eclair": float or None,
                      "toxicite": "TOXIQUE" | "NON_TOXIQUE",
                      "categorie": "..."
                  }
              }
    """
    if filepath is None:
        filepath = SUBSTANCES_CSV_PATH
    
    substances = {}
    
    # Vérification de l'existence du fichier
    if not os.path.exists(filepath):
        print(f"ERREUR: Le fichier {filepath} n'existe pas.")
        print(f"Chemin recherché: {os.path.abspath(filepath)}")
        return substances
    
    try:
        with open(filepath, 'r', encoding='utf-8') as csvfile:
            # Utilisation du délimiteur point-virgule (format CSV français)
            reader = csv.DictReader(csvfile, delimiter=';')
            
            for row in reader:
                # Extraction du numéro CAS
                cas = clean_field(row.get('cas', ''))
                
                # Ignorer les lignes de commentaire
                if cas.startswith('#') or not cas:
                    continue
                
                # Extraction des autres champs
                nom = clean_field(row.get('nom', ''))
                point_eclair_str = clean_field(row.get('point_eclair_celsius', ''))
                toxicite_str = clean_field(row.get('toxicite', ''))  # FIX: Use 'toxicite' not 'toxique'
                classification = clean_field(row.get('classification_ghs', ''))
                
                # Conversion du point éclair en nombre
                point_eclair = extract_numeric_value(point_eclair_str)
                
                # Normalisation du nom pour la recherche
                nom_normalise = standardize_chemical_name(nom)
                
                # Stockage dans le dictionnaire
                substances[cas] = {
                    'cas': cas,
                    'nom': nom,
                    'nom_normalise': nom_normalise,
                    'point_eclair': point_eclair,
                    'toxicite': toxicite_str,  # Use actual toxicity level from CSV
                    'famille': classification,
                    'categorie': classification, 
                }
    
    except Exception as e:
        print(f"ERREUR lors du chargement du fichier {filepath}: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"INFO: {len(substances)} substances chargées depuis {filepath}")
    return substances


def load_incompatibilities(filepath=None):
    """
    Charge les incompatibilités chimiques depuis le fichier CSV.
    
    Args:
        filepath (str, optional): Chemin personnalisé vers le fichier CSV.
                                  Si None, utilise le chemin par défaut.
    
    Returns:
        list: Liste de dictionnaires représentant les incompatibilités
              [
                  {
                      "substance_a": "...",
                      "substance_b": "...",
                      "niveau_risque": "FAIBLE" | "MOYEN" | "ÉLEVÉ"
                  }
              ]
    """
    if filepath is None:
        filepath = INCOMPATIBILITIES_CSV_PATH
    
    incompatibilities = []
    
    # Vérification de l'existence du fichier
    if not os.path.exists(filepath):
        print(f"ERREUR: Le fichier {filepath} n'existe pas.")
        print(f"Chemin recherché: {os.path.abspath(filepath)}")
        return incompatibilities
    
    print(f"[CSV_LOADER DEBUG] Loading incompatibilities from: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as csvfile:
            # Skip comment lines and empty lines at the beginning
            for line in csvfile:
                stripped = line.strip()
                if not stripped.startswith('#') and stripped:
                    # Found first non-comment, non-empty line
                    # Put it back by seeking to the beginning and creating a new reader
                    csvfile.seek(0)
                    # Skip to this line
                    lines = csvfile.readlines()
                    # Find first valid header line
                    header_idx = 0
                    for idx, l in enumerate(lines):
                        s = l.strip()
                        if not s.startswith('#') and s:
                            header_idx = idx
                            break
                    # Create reader starting from header
                    import io
                    csv_content = ''.join(lines[header_idx:])
                    csvfile_cleaned = io.StringIO(csv_content)
                    break
            
            # Utilisation du délimiteur point-virgule
            reader = csv.DictReader(csvfile_cleaned, delimiter=';')
            
            print(f"[CSV_LOADER DEBUG] Reader created, fieldnames: {reader.fieldnames}")
            
            for idx, row in enumerate(reader):
                # Extraction des substances
                substance_a = clean_field(row.get('substance_a', ''))
                substance_b = clean_field(row.get('substance_b', ''))
                niveau_risque = clean_field(row.get('niveau_risque', ''))
                type_reaction = clean_field(row.get('type_reaction', ''))
                justification = clean_field(row.get('justification', ''))
                produit_reaction = clean_field(row.get('produit_reaction', ''))
                formule_produit = clean_field(row.get('formule_produit', ''))
                equation_reaction = clean_field(row.get('equation_reaction', ''))
                
                print(f"[CSV_LOADER DEBUG] Row {idx}: {substance_a} + {substance_b}")
                
                # Ignorer les lignes de commentaire ou vides
                if substance_a.startswith('#') or not substance_a:
                    print(f"[CSV_LOADER DEBUG] Skipping row {idx} (comment or empty)")
                    continue
                
                # Normalisation des noms
                substance_a_norm = standardize_chemical_name(substance_a)
                substance_b_norm = standardize_chemical_name(substance_b)
                
                # Ajout à la liste si les deux substances sont définies
                if substance_a and substance_b:
                    incompatibilities.append({
                        'substance_a': substance_a,
                        'substance_a_normalise': substance_a_norm,
                        'substance_b': substance_b,
                        'substance_b_normalise': substance_b_norm,
                        'niveau_risque': niveau_risque.upper() if niveau_risque else 'MOYEN',
                        'type_reaction': type_reaction,
                        'justification': justification,
                        'produit_reaction': produit_reaction,
                        'formule_produit': formule_produit,
                        'equation_reaction': equation_reaction,
                    })
                    print(f"[CSV_LOADER DEBUG] Added incompatibility: {substance_a} + {substance_b}")

    
    except Exception as e:
        print(f"ERREUR lors du chargement du fichier {filepath}: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"INFO: {len(incompatibilities)} incompatibilités chargées depuis {filepath}")
    return incompatibilities


def clean_field(value):
    """
    Nettoie un champ de données CSV.
    
    Args:
        value (str): Valeur brute du champ CSV
    
    Returns:
        str: Valeur nettoyée, ou chaîne vide si vide/None
    """
    if value is None:
        return ""
    
    # Conversion en chaîne et suppression des espaces
    cleaned = str(value).strip()
    
    # Gestion des valeurs "vides" explicites
    if cleaned.lower() in ['', 'n/a', 'na', 'null', 'none', '-']:
        return ""
    
    return cleaned


def find_substance_by_name(name, substances_dict):
    """
    Recherche une substance par son nom (insensible à la casse et aux accents).
    
    Args:
        name (str): Nom de la substance recherchée
        substances_dict (dict): Dictionnaire de substances
    
    Returns:
        dict or None: Données de la substance si trouvée, None sinon
    """
    if not name or not substances_dict:
        return None
    
    # Normalisation du nom recherché
    name_normalized = standardize_chemical_name(name)
    
    # Recherche par nom normalisé
    for cas, substance in substances_dict.items():
        if substance.get('nom_normalise') == name_normalized:
            return substance
    
    return None


def find_substance_by_cas(cas_number, substances_dict):
    """
    Recherche une substance par son numéro CAS.
    
    Args:
        cas_number (str): Numéro CAS de la substance
        substances_dict (dict): Dictionnaire de substances
    
    Returns:
        dict or None: Données de la substance si trouvée, None sinon
    """
    if not cas_number or not substances_dict:
        return None
    
    # Nettoyage du numéro CAS
    cas_cleaned = clean_field(cas_number)
    
    return substances_dict.get(cas_cleaned)


def check_incompatibility(substance1, substance2, incompatibilities_list):
    """
    Vérifie s'il existe une incompatibilité entre deux substances.
    Recherche bidirectionnelle (A-B ou B-A).
    
    Args:
        substance1 (str): Nom ou CAS de la première substance
        substance2 (str): Nom ou CAS de la deuxième substance
        incompatibilities_list (list): Liste d'incompatibilités
    
    Returns:
        dict or None: Données d'incompatibilité si trouvée, None sinon
    """
    if not substance1 or not substance2 or not incompatibilities_list:
        return None
    
    # Normalisation des noms
    sub1_norm = standardize_chemical_name(substance1)
    sub2_norm = standardize_chemical_name(substance2)
    
    # Recherche dans les incompatibilités
    for incomp in incompatibilities_list:
        a_norm = incomp.get('substance_a_normalise', '')
        b_norm = incomp.get('substance_b_normalise', '')
        
        # Vérification bidirectionnelle
        if (a_norm == sub1_norm and b_norm == sub2_norm) or \
           (a_norm == sub2_norm and b_norm == sub1_norm):
            return incomp
    
    return None


def get_substances_count(substances_dict):
    """Retourne le nombre de substances chargées."""
    return len(substances_dict) if substances_dict else 0


def get_incompatibilities_count(incompatibilities_list):
    """Retourne le nombre d'incompatibilités chargées."""
    return len(incompatibilities_list) if incompatibilities_list else 0


# Test du module (exécuté uniquement si lancé directement)
if __name__ == "__main__":
    print("=== Test du chargement des CSV ===")
    print(f"Chemin du fichier: {CURRENT_FILE}")
    print(f"Dossier data: {DATA_DIR}")
    print(f"Fichier substances: {SUBSTANCES_CSV_PATH}")
    print(f"Fichier incompatibilités: {INCOMPATIBILITIES_CSV_PATH}")
    print()
    
    # Test chargement substances
    substances = load_substances()
    print(f"\n✓ {get_substances_count(substances)} substances chargées")
    
    # Test chargement incompatibilités
    incomp = load_incompatibilities()
    print(f"✓ {get_incompatibilities_count(incomp)} incompatibilités chargées")
    
    # Afficher quelques exemples
    if substances:
        print("\nExemple de substance:")
        first_cas = list(substances.keys())[0]
        print(f"  {substances[first_cas]}")