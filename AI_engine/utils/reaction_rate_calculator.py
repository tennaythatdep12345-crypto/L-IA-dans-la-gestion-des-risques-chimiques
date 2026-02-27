"""
Reaction Rate & Risk Multiplier Calculator (Python)

Calculates the reaction rate multiplier and risk adjustment based on:
1. Temperature (primary factor) - accelerates chemical reactions exponentially
2. Humidity (secondary factor) - provides minor adjustments

Based on Arrhenius equation principles for temperature-dependent reaction rates
"""

def calculate_temperature_multiplier(temperature):
    """
    Calculate temperature-based reaction rate multiplier
    
    Scientific basis: Arrhenius equation - reaction rate doubles approximately every 10°C
    Temperature significantly accelerates exothermic reactions and decomposition
    
    Args:
        temperature (float): Temperature in Celsius (°C)
    
    Returns:
        float: Reaction rate multiplier (1.0 to 3.0+)
    """
    reference_temp = 20
    temp_difference = temperature - reference_temp
    
    # Rule of Thumb (RoT): Reaction rate doubles every 10°C (Q10 coefficient ≈ 2)
    # However, for chemical hazards, we use a more conservative 1.5x per 10°C
    
    if temperature < 20:
        # Below safe range - reduced reaction rate
        return max(0.5, 1.0 - (reference_temp - temperature) * 0.02)
    elif 20 <= temperature < 30:
        # Low impact zone (20-30°C)
        # Baseline reactions, minimal acceleration
        return 1.0 + (temp_difference * 0.02)  # +0.02 per °C
    elif 30 <= temperature < 50:
        # Medium impact zone (30-50°C)
        # Moderate temperature increase, noticeable reaction rate increase
        # 30°C = 1.2, 40°C = 1.6, 50°C = 2.0
        return 1.0 + ((temperature - 20) * 0.05)  # +0.05 per °C (accelerated)
    elif 50 <= temperature < 70:
        # High impact zone (50-70°C)
        # Significant temperature increase, rapid reaction acceleration
        # Risk of runaway reactions increases substantially
        return 2.0 + ((temperature - 50) * 0.08)  # +0.08 per °C (highly accelerated)
    else:
        # Critical zone (70°C+)
        # Extremely high risk - many chemicals become unstable
        # Potential for violent reactions, explosions, toxic gas release
        return 3.6 + ((temperature - 70) * 0.1)  # +0.1 per °C


def calculate_humidity_adjustment(humidity, temperature_multiplier):
    """
    Calculate humidity-based risk adjustment
    
    Scientific basis: Humidity affects:
    - Hydrolysis reactions (moisture-catalyzed decomposition)
    - Oxidation rate (moisture promotes oxidation)
    - Corrosion and material degradation
    - Some peroxide formations
    
    However, humidity is a SECONDARY factor - it amplifies or reduces risk by 5-10%
    
    Args:
        humidity (float): Relative humidity in percentage (0-100%)
        temperature_multiplier (float): Current temperature multiplier
    
    Returns:
        float: Humidity adjustment score (-10 to +10)
    """
    optimal_humidity_min = 40
    optimal_humidity_max = 60
    
    adjustment = 0
    
    if humidity < 20:
        # Very dry conditions
        # Reduces some hydrolysis risks, but increases static electricity hazard
        adjustment = -5  # Slight reduction in risk
    elif 20 <= humidity < 40:
        # Dry conditions
        # Below optimal, slight risk reduction
        adjustment = -3
    elif 40 <= humidity <= 60:
        # Optimal conditions
        # No adjustment needed
        adjustment = 0
    elif 60 < humidity <= 80:
        # Humid conditions
        # Increases hydrolysis and oxidation risks
        adjustment = 5  # Increased risk
    else:
        # Very humid conditions (>80%)
        # High moisture accelerates degradation and hazardous reactions
        # Risk multiplier increases significantly
        adjustment = 10
    
    # Scale adjustment based on temperature multiplier
    # At high temperatures, humidity effects are amplified
    if temperature_multiplier > 2.0:
        adjustment *= 1.5  # Amplify humidity effect at high temperatures
    
    return adjustment


def calculate_risk_adjustment_score(reaction_rate_multiplier, humidity_adjustment):
    """
    Calculate combined risk score adjustment
    
    Combines temperature multiplier and humidity adjustment
    into a practical risk score increase
    
    Args:
        reaction_rate_multiplier (float): Temperature-based multiplier
        humidity_adjustment (float): Humidity-based adjustment score
    
    Returns:
        float: Additional risk points to add to base score (0-50 points)
    """
    # Base risk adjustment from temperature multiplier
    # Converting multiplier to risk points (max 50 points addition)
    risk_score = (reaction_rate_multiplier - 1.0) * 20  # 1.0 = 0, 2.0 = 20, 3.0 = 40
    
    # Add humidity adjustment (already in ±10 range)
    risk_score += humidity_adjustment * 2  # Scale humidity effect
    
    # Cap the risk adjustment
    return min(max(risk_score, 0), 50)  # Clamp between 0-50 points


def calculate_environmental_risk_factors(temperature, humidity):
    """
    Main function: Calculate all environmental factors
    
    Args:
        temperature (float): Temperature in °C
        humidity (float): Humidity in %
    
    Returns:
        dict: Comprehensive risk calculation object
    """
    # Validate inputs
    if not isinstance(temperature, (int, float)) or not isinstance(humidity, (int, float)):
        return {
            'reaction_rate_multiplier': 1.0,
            'humidity_adjustment': 0,
            'risk_adjustment_score': 0,
            'risk_level': 'NORMAL',
            'warning': 'Invalid input parameters'
        }
    
    # Calculate components
    reaction_rate_multiplier = calculate_temperature_multiplier(temperature)
    humidity_adjustment = calculate_humidity_adjustment(humidity, reaction_rate_multiplier)
    risk_adjustment_score = calculate_risk_adjustment_score(reaction_rate_multiplier, humidity_adjustment)
    
    # Determine risk level
    risk_level = 'NORMAL'
    if reaction_rate_multiplier > 3.0:
        risk_level = 'CRITICAL'
    elif reaction_rate_multiplier > 2.0:
        risk_level = 'HIGH'
    elif reaction_rate_multiplier > 1.5:
        risk_level = 'ELEVATED'
    
    # Generate warning messages
    warnings = []
    if temperature > 60:
        warnings.append('⚠️ Temperature excessively high - chemical stability at risk')
    if humidity > 80:
        warnings.append('⚠️ Humidity very high - hydrolysis and oxidation risks increased')
    if temperature > 50 and humidity > 70:
        warnings.append('🚨 CRITICAL: High temperature + high humidity combination')
    
    return {
        # Main outputs
        'reaction_rate_multiplier': round(reaction_rate_multiplier, 2),
        'humidity_adjustment': round(humidity_adjustment, 2),
        'risk_adjustment_score': round(risk_adjustment_score, 1),
        
        # Metadata
        'risk_level': risk_level,
        'warnings': warnings if warnings else ['✅ Conditions within safe parameters'],
        
        # Debug info
        'temperature': temperature,
        'humidity': humidity,
    }


def get_temperature_safety_recommendation(temperature):
    """
    Utility function: Get temperature-based safety recommendation
    
    Args:
        temperature (float): Temperature in °C
    
    Returns:
        str: Safety recommendation
    """
    if temperature < 15:
        return 'Temperature very low - ensure proper chemical storage (some chemicals may crystallize)'
    elif 15 <= temperature < 25:
        return '✅ Optimal storage temperature - maintain these conditions'
    elif 25 <= temperature < 35:
        return '⚠️ Temperature elevated - increase ventilation, monitor closely'
    elif 35 <= temperature < 50:
        return '🔴 Temperature high - activate cooling systems, increase monitoring'
    else:
        return '🚨 CRITICAL - Implement emergency cooling, evacuate if necessary'


def get_humidity_safety_recommendation(humidity):
    """
    Utility function: Get humidity-based safety recommendation
    
    Args:
        humidity (float): Humidity in %
    
    Returns:
        str: Safety recommendation
    """
    if humidity < 30:
        return '⚡ Low humidity - manage static electricity risks'
    elif 30 <= humidity <= 70:
        return '✅ Humidity within safe range'
    else:
        return '⚠️ High humidity detected - check for moisture condensation, increase dehumidification'
