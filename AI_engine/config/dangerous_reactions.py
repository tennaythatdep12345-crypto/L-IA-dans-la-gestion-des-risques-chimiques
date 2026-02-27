# AI_engine/config/dangerous_reactions.py
"""
Database of known DANGEROUS CHEMICAL REACTIONS
HSE Principle: Ces réactions produisent des produits extrêmement toxiques
et ne doivent JAMAIS être acceptées même avec bonnes conditions
"""

# Format: (substance1, substance2) → metadata
DANGEROUS_REACTIONS = {
    # Formation de PHOSGÈNE (COCl₂) - extrêmement toxique
    ('chloroforme', 'eau de javel'): {
        'name_fr': 'Chloroforme + Eau de Javel',
        'product': 'Phosgène (COCl₂)',
        'product_formula': 'COCl₂',
        'toxicity_level': 'EXTREMELY_HAZARDOUS',
        'min_risk_score': 50,  # Jamais en-dessous
        'min_incompatibility_score': 50,  # Lockdown au maximum
        'recommendation': 'Ne jamais mélanger. Séparation stricte obligatoire.'
    },
    
    # Formation de CHLORE GAZEUX (Cl₂) - très toxique
    ('acide chlorhydrique', 'eau de javel'): {
        'name_fr': 'Acide chlorhydrique + Eau de Javel',
        'product': 'Chlore gazeux (Cl₂)',
        'product_formula': 'Cl₂',
        'toxicity_level': 'HIGHLY_HAZARDOUS',
        'min_risk_score': 50,
        'min_incompatibility_score': 50,
        'recommendation': 'Interdiction absolue de mélange.'
    },
    
    # Formation d'ACIDE CYANHYDRIQUE (HCN) - mortel
    ('cyanure', 'acide'): {
        'name_fr': 'Cyanure + Acide',
        'product': 'Acide cyanhydrique (HCN)',
        'product_formula': 'HCN',
        'toxicity_level': 'LETHAL',
        'min_risk_score': 50,
        'min_incompatibility_score': 50,
        'recommendation': 'Danger mortel. Séparation physique requise.'
    },

    # Formation de CHLORAMINES - hautement toxiques
    ('ammoniaque', 'eau de javel'): {
        'name_fr': 'Ammoniaque + Eau de Javel',
        'product': 'Chloramines',
        'product_formula': 'NH₂Cl, NHCl₂, NCl₃',
        'toxicity_level': 'HIGHLY_HAZARDOUS',
        'min_risk_score': 45,  # Légèrement moins que phosgène
        'min_incompatibility_score': 50,
        'recommendation': 'Mélange très dangereux. Ne pas proximité.'
    },
}

def normalize_substance_name(name):
    """Normalize chemical name for lookup"""
    if not name:
        return ""
    return name.strip().lower().replace(' ', '')

def is_dangerous_reaction(substance1, substance2):
    """
    Check if two substances form a KNOWN dangerous reaction
    Returns: (is_dangerous, reaction_info)
    """
    if not substance1 or not substance2:
        return False, None
    
    norm1 = normalize_substance_name(substance1)
    norm2 = normalize_substance_name(substance2)
    
    # Check both orders (A+B or B+A)
    for (known_sub1, known_sub2), info in DANGEROUS_REACTIONS.items():
        known_norm1 = normalize_substance_name(known_sub1)
        known_norm2 = normalize_substance_name(known_sub2)
        
        if (norm1 == known_norm1 and norm2 == known_norm2) or \
           (norm1 == known_norm2 and norm2 == known_norm1):
            return True, info
    
    return False, None

def get_dangerous_reactions_list():
    """Return all dangerous reactions for reference"""
    return [
        {
            'pair': pair,
            'product': info['product'],
            'product_formula': info['product_formula'],
            'min_score': info['min_risk_score']
        }
        for pair, info in DANGEROUS_REACTIONS.items()
    ]
