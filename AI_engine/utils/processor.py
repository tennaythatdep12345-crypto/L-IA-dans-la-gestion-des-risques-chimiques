# ai_engine/utils/processor.py
"""
Module de normalisation et prétraitement de texte pour le système expert
Projet IUT Génie Chimique - 1ère année
Approche : règles symboliques sans machine learning
"""

import unicodedata
import re


def normalize_text(text):
    """
    Normalise une chaîne de texte pour améliorer la correspondance avec les données CSV.
    
    Opérations effectuées:
    - Conversion en minuscules
    - Suppression des accents
    - Suppression des espaces multiples
    - Suppression des espaces en début et fin
    
    Args:
        text (str): Texte à normaliser
    
    Returns:
        str: Texte normalisé
    
    Exemple:
        >>> normalize_text("  Éthanol  95%  ")
        "ethanol 95%"
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Conversion en minuscules
    text = text.lower()
    
    # Suppression des accents
    text = remove_accents(text)
    
    # Suppression des espaces multiples
    text = re.sub(r'\s+', ' ', text)
    
    # Suppression des espaces en début et fin
    text = text.strip()
    
    return text


def remove_accents(text):
    """
    Supprime tous les accents d'une chaîne de texte.
    
    Utilise la décomposition Unicode (NFD) pour séparer les caractères de base
    des signes diacritiques, puis filtre les signes diacritiques.
    
    Args:
        text (str): Texte avec accents
    
    Returns:
        str: Texte sans accents
    
    Exemple:
        >>> remove_accents("éèêë àâ ùû ïî ç")
        "eeee aa uu ii c"
    """
    if not text:
        return ""
    
    # Décomposition Unicode NFD (caractère de base + diacritique séparé)
    nfd_form = unicodedata.normalize('NFD', text)
    
    # Filtrage: on garde uniquement les caractères qui ne sont pas des marques diacritiques
    # La catégorie 'Mn' désigne les marques non-espacées (accents, trémas, etc.)
    text_without_accents = ''.join(
        char for char in nfd_form
        if unicodedata.category(char) != 'Mn'
    )
    
    return text_without_accents


def standardize_chemical_name(name):
    """
    Standardise un nom de produit chimique pour faciliter la correspondance.
    
    Opérations effectuées:
    - Normalisation du texte (minuscules, sans accents)
    - Suppression des séparateurs courants (virgules, tirets, parenthèses)
    - Conservation uniquement des lettres, chiffres et espaces
    
    Args:
        name (str): Nom du produit chimique
    
    Returns:
        str: Nom standardisé
    
    Exemple:
        >>> standardize_chemical_name("Acide sulfurique (H2SO4)")
        "acide sulfurique h2so4"
    """
    if not name:
        return ""
    
    # Normalisation de base
    name = normalize_text(name)
    
    # Suppression des parenthèses et leur contenu (optionnel: on les garde ici)
    # Si on voulait les supprimer: name = re.sub(r'\([^)]*\)', '', name)
    
    # Suppression des caractères spéciaux sauf lettres, chiffres et espaces
    # On garde les parenthèses et tirets car ils peuvent être informatifs
    name = re.sub(r'[^\w\s-]', ' ', name)
    
    # Suppression des tirets (les remplacer par des espaces)
    name = name.replace('-', ' ')
    
    # Suppression des espaces multiples
    name = re.sub(r'\s+', ' ', name)
    
    # Suppression des espaces en début et fin
    name = name.strip()
    
    return name


def clean_input(text):
    """
    Nettoie une entrée utilisateur générique.
    
    Fonction polyvalente pour nettoyer tout type d'entrée textuelle.
    Utilisée pour les noms de produits, quantités, commentaires, etc.
    
    Args:
        text (str): Texte à nettoyer
    
    Returns:
        str: Texte nettoyé
    
    Exemple:
        >>> clean_input("  500  mL   ")
        "500 ml"
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Normalisation
    text = normalize_text(text)
    
    return text


def extract_numeric_value(text):
    """
    Extrait la première valeur numérique trouvée dans une chaîne de texte.
    
    Utile pour extraire des quantités, des points éclair, des concentrations, etc.
    
    Args:
        text (str): Texte contenant potentiellement un nombre
    
    Returns:
        float or None: Valeur numérique extraite, ou None si aucune trouvée
    
    Exemple:
        >>> extract_numeric_value("Point éclair: 23°C")
        23.0
        >>> extract_numeric_value("500 mL")
        500.0
    """
    if not text:
        return None
    
    # Recherche d'un nombre (entier ou décimal)
    # Pattern: nombres avec point ou virgule comme séparateur décimal
    match = re.search(r'-?\d+[.,]?\d*', str(text))
    
    if match:
        # Remplacement de la virgule par un point pour la conversion
        number_str = match.group(0).replace(',', '.')
        try:
            return float(number_str)
        except ValueError:
            return None
    
    return None


def is_valid_chemical_name(name):
    """
    Vérifie si un nom de produit chimique est valide (non vide et non trivial).
    
    Args:
        name (str): Nom à vérifier
    
    Returns:
        bool: True si le nom est valide, False sinon
    
    Exemple:
        >>> is_valid_chemical_name("Ethanol")
        True
        >>> is_valid_chemical_name("")
        False
        >>> is_valid_chemical_name("   ")
        False
    """
    if not name or not isinstance(name, str):
        return False
    
    # Nettoyage
    cleaned = clean_input(name)
    
    # Vérification: au moins 2 caractères alphanumériques
    alphanumeric_count = sum(c.isalnum() for c in cleaned)
    
    return alphanumeric_count >= 2


def similarity_match(text1, text2):
    """
    Vérifie si deux textes correspondent approximativement.
    
    Méthode simple: comparaison après standardisation.
    Pour un matching plus avancé, on pourrait utiliser la distance de Levenshtein,
    mais cela reste volontairement simple pour un système pédagogique.
    
    Args:
        text1 (str): Premier texte
        text2 (str): Deuxième texte
    
    Returns:
        bool: True si les textes correspondent, False sinon
    
    Exemple:
        >>> similarity_match("Acide sulfurique", "acide sulfurique")
        True
        >>> similarity_match("H2SO4", "h2so4")
        True
    """
    if not text1 or not text2:
        return False
    
    # Standardisation des deux textes
    standard1 = standardize_chemical_name(text1)
    standard2 = standardize_chemical_name(text2)
    
    # Comparaison exacte après standardisation
    return standard1 == standard2


def contains_keywords(text, keywords):
    """
    Vérifie si un texte contient au moins un des mots-clés fournis.
    
    Args:
        text (str): Texte à analyser
        keywords (list): Liste de mots-clés à rechercher
    
    Returns:
        bool: True si au moins un mot-clé est trouvé, False sinon
    
    Exemple:
        >>> contains_keywords("acide chlorhydrique", ["acide", "base"])
        True
    """
    if not text or not keywords:
        return False
    
    # Normalisation du texte
    normalized_text = normalize_text(text)
    
    # Normalisation des mots-clés et recherche
    for keyword in keywords:
        normalized_keyword = normalize_text(keyword)
        if normalized_keyword in normalized_text:
            return True
    
    return False