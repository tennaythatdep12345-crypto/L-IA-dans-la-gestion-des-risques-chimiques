import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Wind,
  Hand,
  Droplet,
  Beaker,
  Target,
  Flame,
  Activity,
  RotateCcw,
  Loader
} from 'lucide-react';
import healthRiskDataRaw from '../data/healthRiskData.json';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/healthTranslations';
import {
  calculateHealthRiskScore,
  getRiskLevel,
  getRiskAttributeColor,
  getExposureRouteIcon,
  getOrganColor
} from '../utils/healthRiskScoring';

// Build searchable index from data
const healthRiskData = (() => {
  const index = new Map();
  const chemicalArray = Array.isArray(healthRiskDataRaw.chemicals) 
    ? healthRiskDataRaw.chemicals 
    : Object.values(healthRiskDataRaw.chemicals);
  
  chemicalArray.forEach((chem) => {
    // Index by name (lowercase)
    const nameKey = (chem.name || '').toLowerCase();
    if (nameKey) index.set(nameKey, chem);
    
    // Index by CAS number
    if (chem.cas && chem.cas !== 'unknown') {
      index.set(chem.cas.toLowerCase(), chem);
    }
    
    // Index by synonyms
    if (Array.isArray(chem.synonyms)) {
      chem.synonyms.forEach(syn => {
        const synKey = (syn || '').toLowerCase();
        if (synKey) index.set(synKey, chem);
      });
    }
  });
  
  return { index, array: chemicalArray };
})();

// Icon component wrapper
const IconComponent = ({ iconName, className, size = 20 }) => {
  const iconProps = { className, size };
  const icons = {
    'Wind': <Wind {...iconProps} />,
    'Hand': <Hand {...iconProps} />,
    'Droplet': <Droplet {...iconProps} />,
    'AlertTriangle': <AlertTriangle {...iconProps} />,
    'CheckCircle': <CheckCircle {...iconProps} />,
    'AlertCircle': <AlertCircle {...iconProps} />,
    'Beaker': <Beaker {...iconProps} />,
    'Target': <Target {...iconProps} />,
    'Activity': <Activity {...iconProps} />
  };
  return icons[iconName] || <AlertCircle {...iconProps} />;
};

const HealthRiskModule = () => {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState('');
  const [exposureRoute, setExposureRoute] = useState('inhalation');
  const [exposureDuration, setExposureDuration] = useState('chronic');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get search suggestions
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchInput.toLowerCase();
    const matches = Array.from(healthRiskData.index.keys())
      .filter(key => key.includes(query))
      .slice(0, 5)
      .map(key => healthRiskData.index.get(key));

    // Remove duplicates
    const uniqueSuggestions = Array.from(new Map(
      matches.map(chem => [chem.name || chem.cas, chem])
    ).values());

    setSuggestions(uniqueSuggestions);
    setShowSuggestions(uniqueSuggestions.length > 0);
  }, [searchInput]);

  // Handle search
  const handleSearch = (query) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Simulate API call delay
    setTimeout(() => {
      const searchTerm = query.trim().toLowerCase();
      
      if (!searchTerm) {
        setError('Please enter a chemical name or CAS number');
        setIsLoading(false);
        return;
      }

      const chemical = healthRiskData.index.get(searchTerm);

      if (!chemical) {
        setError(`"${query}" not found in the health risk database.`);
        setIsLoading(false);
        return;
      }

      // Calculate health risk score
      const exposureContext = {
        exposureRoute,
        exposureDuration
      };

      const score = calculateHealthRiskScore(chemical, exposureContext);
      const riskLevel = getRiskLevel(score);

      setResult({
        chemical,
        score,
        riskLevel,
        exposureContext
      });
      setShowSuggestions(false);
      setIsLoading(false);
    }, 600);
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  // Handle suggestion click
  const handleSuggestionClick = (chemical) => {
    setSearchInput(chemical.name || chemical.cas);
    setShowSuggestions(false);
    handleSearch(chemical.name || chemical.cas);
  };

  // Reset form
  const handleReset = () => {
    setSearchInput('');
    setExposureRoute('inhalation');
    setExposureDuration('chronic');
    setResult(null);
    setError(null);
    setSuggestions([]);
  };

  // Risk attribute card
  const RiskAttributeCard = ({ title, level, description }) => {
    const colors = getRiskAttributeColor(level);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
              {title}
            </h4>
            <p className={`text-xs ${colors.text}`}>
              {level?.charAt(0).toUpperCase() + level?.slice(1).toLowerCase() || 'Unknown'}
            </p>
          </div>
          <span className={`${colors.badge} px-2 py-1 rounded text-xs font-bold`}>
            {level?.charAt(0).toUpperCase()}
          </span>
        </div>
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            {description}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          {getTranslation(language, 'healthRiskAssessment')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {getTranslation(language, 'evaluateLongTerm')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
        {/* LEFT SIDE: INPUT FORM */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {getTranslation(language, 'searchChemical')}
            </h2>

            {/* Search Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {getTranslation(language, 'chemicalNameOrCAS')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={getTranslation(language, 'placeholderExample')}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Autocomplete Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
                    >
                      {suggestions.map((chem, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(chem)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-600 last:border-0 transition-colors"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {chem.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            CAS: {chem.cas}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Exposure Route */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {getTranslation(language, 'exposureRoute')}
                </label>
                <select
                  value={exposureRoute}
                  onChange={(e) => setExposureRoute(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                >
                  <option value="inhalation">Inhalation</option>
                  <option value="skin">Skin Contact</option>
                  <option value="ingestion">Ingestion</option>
                </select>
              </div>

              {/* Exposure Duration */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {getTranslation(language, 'exposureDuration')}
                </label>
                <select
                  value={exposureDuration}
                  onChange={(e) => setExposureDuration(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                >
                  <option value="short">{getTranslation(language, 'shortTerm')}</option>
                  <option value="repeated">{getTranslation(language, 'repeated')}</option>
                  <option value="chronic">{getTranslation(language, 'chronic')}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      Analyze
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
                >
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </motion.div>
              )}

              {/* Info Box */}
              {!result && !error && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> Enter a chemical name or CAS number to get a comprehensive health risk assessment.
                  </p>
                </div>
              )}
            </form>
          </div>
        </motion.div>

        {/* RIGHT SIDE: RESULTS */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-96 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 text-center"
              >
                <Beaker size={48} className="text-slate-400 dark:text-slate-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  {getTranslation(language, 'noAnalysisYet')}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {getTranslation(language, 'enterChemicalToBegin')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Main Risk Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`bg-gradient-to-br ${result.riskLevel.gradientBg} ${result.riskLevel.text} rounded-2xl shadow-xl border-2 border-white/20 p-8`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{result.chemical.name}</h2>
                      <p className="text-sm opacity-90 font-semibold">
                        CAS: {result.chemical.cas}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold">{Math.round(result.score)}</div>
                      <p className="text-sm opacity-90">Risk Score</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className={`inline-block ${result.riskLevel.bgColor} ${result.riskLevel.textColor} border ${result.riskLevel.borderColor} px-4 py-2 rounded-full font-bold text-sm`}>
                      {result.riskLevel.level}
                    </span>
                  </div>

                  <p className="text-sm opacity-95">
                    {result.riskLevel.description}
                  </p>
                </motion.div>

                {/* Health Attributes Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <RiskAttributeCard
                    title={getTranslation(language, 'carcinogenicity')}
                    level={result.chemical.carcinogenicity}
                    description={language === 'fr' ? 'Potentiel de provoquer un cancer' : 'Potential to cause cancer'}
                  />
                  <RiskAttributeCard
                    title={getTranslation(language, 'mutagenicity')}
                    level={result.chemical.mutagenicity}
                    description={language === 'fr' ? 'Capacité à causer des mutations' : 'Ability to cause mutations'}
                  />
                  <RiskAttributeCard
                    title={getTranslation(language, 'genotoxicity')}
                    level={result.chemical.genotoxicity}
                    description={language === 'fr' ? 'Potentiel de dommages à l\'ADN' : 'DNA damage potential'}
                  />
                  <RiskAttributeCard
                    title={getTranslation(language, 'chronicToxicity')}
                    level={result.chemical.chronicToxicity}
                    description={language === 'fr' ? 'Effets nocifs à long terme' : 'Long-term harmful effects'}
                  />
                </motion.div>

                {/* Exposure Routes */}
                {result.chemical.exposureRoutes && result.chemical.exposureRoutes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-6"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Activity size={20} />
                      {getTranslation(language, 'exposureRoutes')}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {result.chemical.exposureRoutes.map((route, idx) => {
                        const iconName = getExposureRouteIcon(route);
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg"
                          >
                            <IconComponent
                              iconName={iconName}
                              className="text-emerald-600 dark:text-emerald-400"
                              size={18}
                            />
                            <span className="capitalize font-semibold text-slate-900 dark:text-slate-100">
                              {route}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Target Organs */}
                {result.chemical.targetOrgans && result.chemical.targetOrgans.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-6"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Target size={20} />
                      {getTranslation(language, 'targetOrgans')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.chemical.targetOrgans.map((organ, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          className={`${getOrganColor(organ)} px-3 py-2 rounded-lg text-sm font-semibold capitalize`}
                        >
                          {organ}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Mechanisms of Action */}
                {result.chemical.mechanisms && result.chemical.mechanisms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-6"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Flame size={20} />
                      {getTranslation(language, 'mechanisms')}
                    </h3>
                    <div className="space-y-2">
                      {result.chemical.mechanisms.map((mechanism, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        >
                          <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                          <span className="capitalize">{mechanism}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Health Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
                >
                  <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {getTranslation(language, 'summary')}
                  </h3>
                  <p className="text-blue-800 dark:text-blue-100 leading-relaxed">
                    {typeof result.chemical.summary === 'object' 
                      ? result.chemical.summary[language] || result.chemical.summary.en
                      : result.chemical.summary}
                  </p>
                </motion.div>

                {/* Classification & Source */}
                {(result.chemical.classification || result.chemical.source) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4"
                  >
                    {result.chemical.classification && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                        <strong>Classification:</strong> {result.chemical.classification}
                      </p>
                    )}
                    {result.chemical.source && Array.isArray(result.chemical.source) && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong>Source:</strong> {result.chemical.source.join(', ')}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthRiskModule;
