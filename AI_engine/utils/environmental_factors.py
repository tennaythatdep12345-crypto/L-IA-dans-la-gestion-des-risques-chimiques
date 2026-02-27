# AI_engine/utils/environmental_factors.py
"""
Apply MULTIPLICATIVE environmental factors to base risk score
HSE LOGIC: Conditions reduce risk partially, NEVER eliminate it
Minimum safety threshold: 100 for dangerous reactions
"""

def apply_environmental_adjustments(base_score, temperature_c, humidity_percent, ventilation, is_dangerous_reaction=False):
    """
    LOGIQUE MULTIPLICATIVE (pas additive):
    - Temperature is MAJOR factor (Arrhenius principle)
    - Humidity is MINOR factor (-5% to +5%)
    - Ventilation reduces risk max 15%, never below safety threshold
    
    Args:
        base_score: 0-100 (score avant env)
        temperature_c: int
        humidity_percent: 0-100
        ventilation: bool
        is_dangerous_reaction: bool - Only apply MIN threshold of 100 if dangerous
    
    Returns:
        adjusted_score (int, 0-100)
    """
    adjusted_score = float(base_score)
    min_safety_threshold = 100 if is_dangerous_reaction else 0  # Only lockdown if dangerous
    
    print(f"[ENV_FACTORS DEBUG] Starting with base score: {base_score}")
    
    # ============================================
    # A. TEMPÉRATURE (Facteur MAJEUR)
    # ============================================
    # Réaction d'Arrhenius: vitesse réaction double ~tous les 10°C
    # Q10 = 1.5 (coefficient thermique chimique)
    
    if temperature_c < 20:
        temp_multiplier = 0.70  # Réduit 30%
        temp_description = "Très froid - Réduit réactivité"
    elif temperature_c <= 30:
        temp_multiplier = 1.0   # Baseline
        temp_description = "Température normale"
    elif temperature_c <= 50:
        temp_multiplier = 1.0 + (temperature_c - 30) * 0.02  # +2% par °C
        temp_description = f"Chaud - +{(temp_multiplier-1)*100:.0f}%"
    else:
        temp_multiplier = 1.4 + (temperature_c - 50) * 0.04  # +4% par °C au-dessus de 50
        temp_description = f"TRÈS CHAUD - +{(temp_multiplier-1)*100:.0f}% ⚠️"
    
    adjusted_score *= temp_multiplier
    print(f"[ENV_FACTORS DEBUG] Température {temperature_c}°C: ×{temp_multiplier:.2f} ({temp_description})")
    
    # ============================================
    # B. HUMIDITÉ (Facteur MINEUR)
    # ============================================
    # Impact très limité: ±5% seulement
    
    if humidity_percent < 20:
        humidity_multiplier = 0.95  # -5%
        humidity_description = "Très sec"
    elif humidity_percent <= 40:
        humidity_multiplier = 0.98  # -2%
        humidity_description = "Sec"
    elif humidity_percent <= 60:
        humidity_multiplier = 1.0   # Optimal
        humidity_description = "Optimal (40-60%)"
    elif humidity_percent <= 80:
        humidity_multiplier = 1.02  # +2%
        humidity_description = "Humide"
    else:
        humidity_multiplier = 1.05  # +5%
        humidity_description = "Très humide"
    
    adjusted_score *= humidity_multiplier
    print(f"[ENV_FACTORS DEBUG] Humidité {humidity_percent}%: ×{humidity_multiplier:.2f} ({humidity_description})")
    
    # ============================================
    # C. VENTILATION (Réduction PARTIELLE)
    # ============================================
    # Max réduction: 15% (pas plus!)
    # Ventilation ≠ élimination du risque
    
    if ventilation:
        ventilation_multiplier = 0.85  # -15%
        ventilation_description = "Réduit 15%"
    else:
        ventilation_multiplier = 1.0   # 0% (normal)
        ventilation_description = "Pas d'effet"
    
    adjusted_score *= ventilation_multiplier
    print(f"[ENV_FACTORS DEBUG] Ventilation: ×{ventilation_multiplier:.2f} ({ventilation_description})")
    
    # ============================================
    # D. SEUIL DE SÉCURITÉ MINIMUM
    # ============================================
    # Réactions dangereuses ne descendent JAMAIS en-dessous de 50
    # Substances normales peuvent avoir risque faible
    final_score = max(adjusted_score, min_safety_threshold)
    
    print(f"[ENV_FACTORS DEBUG] Score after all factors: {adjusted_score:.1f}")
    print(f"[ENV_FACTORS DEBUG] Final score (MIN={min_safety_threshold}): {final_score:.1f}")
    
    return round(final_score)

def determine_risk_level(score):
    """Détermine le niveau de risque basé sur le score"""
    if score >= 65:
        return "ELEVE"
    elif score >= 40:
        return "MOYEN"
    else:
        return "FAIBLE"
