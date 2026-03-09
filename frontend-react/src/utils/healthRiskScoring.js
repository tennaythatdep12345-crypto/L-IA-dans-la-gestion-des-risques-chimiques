/**
 * Health Risk Scoring System
 * Calculates health risk scores and determines risk levels
 */

// Risk level weights
const riskWeights = {
  carcinogenicity: {
    low: 10,
    medium: 25,
    high: 40
  },
  mutagenicity: {
    low: 5,
    medium: 15,
    high: 25
  },
  genotoxicity: {
    low: 5,
    medium: 15,
    high: 20
  },
  chronicToxicity: {
    low: 5,
    medium: 10,
    high: 15
  }
};

/**
 * Calculate base health risk score
 * @param {Object} chemical - Chemical data object
 * @returns {number} Base score (0-100)
 */
export function calculateBaseScore(chemical) {
  if (!chemical) return 0;

  let score = 0;

  // Add carcinogenicity score
  if (chemical.carcinogenicity) {
    score += riskWeights.carcinogenicity[chemical.carcinogenicity.toLowerCase()] || 0;
  }

  // Add mutagenicity score
  if (chemical.mutagenicity) {
    score += riskWeights.mutagenicity[chemical.mutagenicity.toLowerCase()] || 0;
  }

  // Add genotoxicity score
  if (chemical.genotoxicity) {
    score += riskWeights.genotoxicity[chemical.genotoxicity.toLowerCase()] || 0;
  }

  // Add chronic toxicity score
  if (chemical.chronicToxicity) {
    score += riskWeights.chronicToxicity[chemical.chronicToxicity.toLowerCase()] || 0;
  }

  return Math.min(score, 100);
}

/**
 * Adjust score based on exposure context
 * @param {number} baseScore - Base health risk score
 * @param {Object} exposureContext - Exposure parameters
 * @param {Object} chemical - Chemical data object
 * @returns {number} Adjusted score (0-100)
 */
export function adjustScoreByExposure(baseScore, exposureContext, chemical) {
  let adjustedScore = baseScore;

  if (!exposureContext || !chemical) return baseScore;

  const { exposureRoute, exposureDuration } = exposureContext;

  // Inhalation route adjustment
  if (exposureRoute === 'inhalation' && chemical.exposureRoutes?.includes('inhalation')) {
    const carcinogenic = ['high', 'medium'].includes(chemical.carcinogenicity?.toLowerCase());
    const genotoxic = ['high', 'medium'].includes(chemical.genotoxicity?.toLowerCase());
    
    if (carcinogenic || genotoxic) {
      adjustedScore += 10;
    }
  }

  // Skin contact adjustment
  if (exposureRoute === 'skin' && chemical.exposureRoutes?.includes('skin')) {
    if (chemical.carcinogenicity?.toLowerCase() === 'high') {
      adjustedScore += 5;
    }
  }

  // Ingestion adjustment
  if (exposureRoute === 'ingestion' && chemical.exposureRoutes?.includes('ingestion')) {
    if (chemical.carcinogenicity?.toLowerCase() === 'high' && chemical.chronicToxicity?.toLowerCase() === 'high') {
      adjustedScore += 8;
    }
  }

  // Exposure duration adjustment
  if (exposureDuration === 'chronic') {
    adjustedScore += 10;
  } else if (exposureDuration === 'repeated') {
    adjustedScore += 5;
  }

  // Clamp to 0-100 range
  return Math.min(Math.max(adjustedScore, 0), 100);
}

/**
 * Calculate final health risk score
 * @param {Object} chemical - Chemical data object
 * @param {Object} exposureContext - Exposure parameters (optional)
 * @returns {number} Final score (0-100)
 */
export function calculateHealthRiskScore(chemical, exposureContext) {
  const baseScore = calculateBaseScore(chemical);
  return adjustScoreByExposure(baseScore, exposureContext, chemical);
}

/**
 * Get risk level badge based on score
 * @param {number} score - Health risk score
 * @returns {Object} Risk level information
 */
export function getRiskLevel(score) {
  if (score >= 76) {
    return {
      level: 'CRITICAL',
      label: 'Critical',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      gradientBg: 'from-red-500 to-red-600',
      icon: 'AlertTriangle',
      description: 'Severe health hazard - Immediate risk assessment and control measures required'
    };
  } else if (score >= 51) {
    return {
      level: 'HIGH',
      label: 'High',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200',
      gradientBg: 'from-orange-500 to-amber-500',
      icon: 'AlertTriangle',
      description: 'Significant health hazard - Exposure control measures are necessary'
    };
  } else if (score >= 26) {
    return {
      level: 'MODERATE',
      label: 'Moderate',
      color: 'amber',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      gradientBg: 'from-amber-500 to-amber-600',
      icon: 'AlertCircle',
      description: 'Moderate health hazard - Preventive measures recommended'
    };
  } else {
    return {
      level: 'LOW',
      label: 'Low',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      gradientBg: 'from-emerald-500 to-green-500',
      icon: 'CheckCircle',
      description: 'Low health hazard - Standard safety precautions apply'
    };
  }
}

/**
 * Get color for individual risk attribute
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @returns {Object} Color scheme
 */
export function getRiskAttributeColor(riskLevel) {
  const level = riskLevel?.toLowerCase() || 'low';
  
  if (level === 'high') {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      badge: 'bg-red-200'
    };
  } else if (level === 'medium') {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      badge: 'bg-amber-200'
    };
  } else {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      badge: 'bg-green-200'
    };
  }
}

/**
 * Generate AI health summary
 * @param {Object} chemical - Chemical data object
 * @param {number} score - Health risk score
 * @returns {string} AI summary text
 */
export function generateHealthSummary(chemical, score) {
  if (!chemical) return '';

  const riskLevel = getRiskLevel(score);
  const mainHazards = [];

  if (chemical.carcinogenicity?.toLowerCase() === 'high') {
    mainHazards.push('carcinogenic');
  }
  if (chemical.mutagenicity?.toLowerCase() === 'high') {
    mainHazards.push('mutagenic');
  }
  if (chemical.genotoxicity?.toLowerCase() === 'high') {
    mainHazards.push('genotoxic');
  }
  if (chemical.chronicToxicity?.toLowerCase() === 'high') {
    mainHazards.push('chronically toxic');
  }

  const hazardText = mainHazards.length > 0 
    ? `possible ${mainHazards.slice(0, 2).join(' and ')} effects`
    : 'health hazard concerns';

  const exposureText = chemical.exposureRoutes?.length > 0
    ? `especially under ${chemical.exposureRoutes[0]} exposure`
    : 'with various exposure routes';

  const baseText = `This substance presents a ${riskLevel.label.toLowerCase()} long-term health risk due to ${hazardText}, ${exposureText}. `;

  if (chemical.classification) {
    return baseText + `It is classified as ${chemical.classification}.`;
  }

  return baseText.slice(0, -1) + '.';
}

/**
 * Get icon name for exposure route
 * @param {string} route - Exposure route
 * @returns {string} Icon name
 */
export function getExposureRouteIcon(route) {
  const routeLower = route?.toLowerCase() || '';
  
  if (routeLower.includes('inhal')) return 'Wind';
  if (routeLower.includes('skin')) return 'Hand';
  if (routeLower.includes('ingest')) return 'Droplet';
  
  return 'AlertCircle';
}

/**
 * Get color for target organ
 * @param {string} organ - Target organ name
 * @returns {string} Color class
 */
export function getOrganColor(organ) {
  const organLower = organ?.toLowerCase() || '';
  
  if (organLower.includes('liver')) return 'bg-purple-100 text-purple-800';
  if (organLower.includes('kidney')) return 'bg-blue-100 text-blue-800';
  if (organLower.includes('lung')) return 'bg-cyan-100 text-cyan-800';
  if (organLower.includes('blood')) return 'bg-red-100 text-red-800';
  if (organLower.includes('nervous') || organLower.includes('brain')) return 'bg-pink-100 text-pink-800';
  if (organLower.includes('respiratory')) return 'bg-indigo-100 text-indigo-800';
  if (organLower.includes('reproductive')) return 'bg-fuchsia-100 text-fuchsia-800';
  
  return 'bg-slate-100 text-slate-800';
}
