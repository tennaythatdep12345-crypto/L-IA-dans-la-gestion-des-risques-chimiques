/**
 * Reaction Rate & Risk Multiplier Calculator
 * 
 * Calculates the reaction rate multiplier and risk adjustment based on:
 * 1. Temperature (primary factor) - accelerates chemical reactions exponentially
 * 2. Humidity (secondary factor) - provides minor adjustments
 * 
 * Based on Arrhenius equation principles for temperature-dependent reaction rates
 */

/**
 * Calculate temperature-based reaction rate multiplier
 * 
 * Scientific basis: Arrhenius equation - reaction rate doubles approximately every 10°C
 * Temperature significantly accelerates exothermic reactions and decomposition
 * 
 * @param {number} temperature - Temperature in Celsius (°C)
 * @returns {number} Reaction rate multiplier (1.0 to 3.0+)
 */
export const calculateTemperatureMultiplier = (temperature) => {
  // Reference temperature (safe baseline)
  const referenceTemp = 20;
  const tempDifference = temperature - referenceTemp;

  // Rule of Thumb (RoT): Reaction rate doubles every 10°C (Q10 coefficient ≈ 2)
  // However, for chemical hazards, we use a more conservative 1.5x per 10°C
  
  if (temperature < 20) {
    // Below safe range - reduced reaction rate
    return Math.max(0.5, 1.0 - (referenceTemp - temperature) * 0.02);
  } else if (temperature >= 20 && temperature < 30) {
    // Low impact zone (20-30°C)
    // Baseline reactions, minimal acceleration
    return 1.0 + (tempDifference * 0.02); // +0.2 per °C
  } else if (temperature >= 30 && temperature < 50) {
    // Medium impact zone (30-50°C)
    // Moderate temperature increase, noticeable reaction rate increase
    // 30°C = 1.2, 40°C = 1.6, 50°C = 2.0
    return 1.0 + ((temperature - 20) * 0.05); // +0.05 per °C (accelerated)
  } else if (temperature >= 50 && temperature < 70) {
    // High impact zone (50-70°C)
    // Significant temperature increase, rapid reaction acceleration
    // Risk of runaway reactions increases substantially
    return 2.0 + ((temperature - 50) * 0.08); // +0.08 per °C (highly accelerated)
  } else {
    // Critical zone (70°C+)
    // Extremely high risk - many chemicals become unstable
    // Potential for violent reactions, explosions, toxic gas release
    return 3.6 + ((temperature - 70) * 0.1); // +0.1 per °C
  }
};

/**
 * Calculate humidity-based risk adjustment
 * 
 * Scientific basis: Humidity affects:
 * - Hydrolysis reactions (moisture-catalyzed decomposition)
 * - Oxidation rate (moisture promotes oxidation)
 * - Corrosion and material degradation
 * - Some peroxide formations
 * 
 * However, humidity is a SECONDARY factor - it amplifies or reduces risk by 5-10%
 * 
 * @param {number} humidity - Relative humidity in percentage (0-100%)
 * @param {number} temperatureMultiplier - Current temperature multiplier
 * @returns {number} Humidity adjustment score (-10 to +10)
 */
export const calculateHumidityAdjustment = (humidity, temperatureMultiplier) => {
  // Optimal humidity range for most chemical storage: 40-60%
  const optimalHumidityMin = 40;
  const optimalHumidityMax = 60;

  let adjustment = 0;

  if (humidity < 20) {
    // Very dry conditions
    // Reduces some hydrolysis risks, but increases static electricity hazard
    adjustment = -5; // Slight reduction in risk
  } else if (humidity >= 20 && humidity < 40) {
    // Dry conditions
    // Below optimal, slight risk reduction
    adjustment = -3;
  } else if (humidity >= 40 && humidity <= 60) {
    // Optimal conditions
    // No adjustment needed
    adjustment = 0;
  } else if (humidity > 60 && humidity <= 80) {
    // Humid conditions
    // Increases hydrolysis and oxidation risks
    adjustment = +5; // Increased risk
  } else {
    // Very humid conditions (>80%)
    // High moisture accelerates degradation and hazardous reactions
    // Risk multiplier increases significantly
    adjustment = +10;
  }

  // Scale adjustment based on temperature multiplier
  // At high temperatures, humidity effects are amplified
  if (temperatureMultiplier > 2.0) {
    adjustment *= 1.5; // Amplify humidity effect at high temperatures
  }

  return adjustment;
};

/**
 * Calculate combined risk score adjustment
 * 
 * Combines temperature multiplier and humidity adjustment
 * into a practical risk score increase
 * 
 * @param {number} reactionRateMultiplier - Temperature-based multiplier
 * @param {number} humidityAdjustment - Humidity-based adjustment score
 * @returns {number} Additional risk points to add to base score (0-40 points)
 */
export const calculateRiskAdjustmentScore = (reactionRateMultiplier, humidityAdjustment) => {
  // Base risk adjustment from temperature multiplier
  // Converting multiplier to risk points (max 50 points addition)
  let riskScore = (reactionRateMultiplier - 1.0) * 20; // 1.0 multiplier = 0 risk, 2.0 = 20 risk, 3.0 = 40 risk

  // Add humidity adjustment (already in ±10 range)
  riskScore += humidityAdjustment * 2; // Scale humidity effect

  // Cap the risk adjustment
  return Math.min(Math.max(riskScore, 0), 50); // Clamp between 0-50 points
};

/**
 * Main function: Calculate all environmental factors
 * 
 * @param {number} temperature - Temperature in °C
 * @param {number} humidity - Humidity in %
 * @returns {Object} Comprehensive risk calculation object
 */
export const calculateEnvironmentalRiskFactors = (temperature, humidity) => {
  // Validate inputs
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    console.warn('Invalid temperature or humidity input');
    return {
      reactionRateMultiplier: 1.0,
      humidityAdjustment: 0,
      riskAdjustmentScore: 0,
      riskLevel: 'NORMAL',
      warning: 'Invalid input parameters'
    };
  }

  // Calculate components
  const reactionRateMultiplier = calculateTemperatureMultiplier(temperature);
  const humidityAdjustment = calculateHumidityAdjustment(humidity, reactionRateMultiplier);
  const riskAdjustmentScore = calculateRiskAdjustmentScore(reactionRateMultiplier, humidityAdjustment);

  // Determine risk level
  let riskLevel = 'NORMAL';
  if (reactionRateMultiplier > 3.0) {
    riskLevel = 'CRITICAL';
  } else if (reactionRateMultiplier > 2.0) {
    riskLevel = 'HIGH';
  } else if (reactionRateMultiplier > 1.5) {
    riskLevel = 'ELEVATED';
  }

  // Generate warning messages
  const warnings = [];
  if (temperature > 60) {
    warnings.push('⚠️ Temperature excessively high - chemical stability at risk');
  }
  if (humidity > 80) {
    warnings.push('⚠️ Humidity very high - hydrolysis and oxidation risks increased');
  }
  if (temperature > 50 && humidity > 70) {
    warnings.push('🚨 CRITICAL: High temperature + high humidity combination');
  }

  return {
    // Main outputs
    reactionRateMultiplier: parseFloat(reactionRateMultiplier.toFixed(2)),
    humidityAdjustment: parseFloat(humidityAdjustment.toFixed(2)),
    riskAdjustmentScore: parseFloat(riskAdjustmentScore.toFixed(1)),
    
    // Metadata
    riskLevel,
    warnings: warnings.length > 0 ? warnings : ['✅ Conditions within safe parameters'],
    
    // Debug info
    temperature,
    humidity,
  };
};

/**
 * Utility function: Get temperature-based safety recommendation
 * 
 * @param {number} temperature - Temperature in °C
 * @returns {string} Safety recommendation
 */
export const getTemperatureSafetyRecommendation = (temperature) => {
  if (temperature < 15) {
    return 'Temperature very low - ensure proper chemical storage (some chemicals may crystallize)';
  } else if (temperature >= 15 && temperature < 25) {
    return '✅ Optimal storage temperature - maintain these conditions';
  } else if (temperature >= 25 && temperature < 35) {
    return '⚠️ Temperature elevated - increase ventilation, monitor closely';
  } else if (temperature >= 35 && temperature < 50) {
    return '🔴 Temperature high - activate cooling systems, increase monitoring';
  } else {
    return '🚨 CRITICAL - Implement emergency cooling, evacuate if necessary';
  }
};

/**
 * Utility function: Get humidity-based safety recommendation
 * 
 * @param {number} humidity - Humidity in %
 * @returns {string} Safety recommendation
 */
export const getHumiditySafetyRecommendation = (humidity) => {
  if (humidity < 30) {
    return '⚡ Low humidity - manage static electricity risks';
  } else if (humidity >= 30 && humidity <= 70) {
    return '✅ Humidity within safe range';
  } else {
    return '⚠️ High humidity detected - check for moisture condensation, increase dehumidification';
  }
};

// Export all functions
export default {
  calculateTemperatureMultiplier,
  calculateHumidityAdjustment,
  calculateRiskAdjustmentScore,
  calculateEnvironmentalRiskFactors,
  getTemperatureSafetyRecommendation,
  getHumiditySafetyRecommendation,
};
