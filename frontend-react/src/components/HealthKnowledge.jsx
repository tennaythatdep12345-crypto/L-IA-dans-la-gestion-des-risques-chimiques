import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, AlertTriangle, Zap, AlertCircle, Heart } from 'lucide-react';
import healthRiskDataRaw from '../data/healthRiskData.json';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/healthTranslations';

const HealthKnowledge = () => {
  const { language } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get carcinogenic substances
  const chemicalArray = Array.isArray(healthRiskDataRaw.chemicals) 
    ? healthRiskDataRaw.chemicals 
    : Object.values(healthRiskDataRaw.chemicals);

  // Filter and group by carcinogenicity level
  const groupedByCarcinogenicity = useMemo(() => {
    const grouping = {
      'Group 1 (Carcinogène avéré)': [],
      'Group 2A (Probablement carcinogène)': [],
      'Group 2B (Peut-être carcinogène)': [],
      'Autres (risque modéré)': []
    };

    chemicalArray.forEach(chem => {
      const carcinogen = chem.carcinogenicity?.toLowerCase() || 'low';
      const classification = chem.classification || '';
      
      if (classification.includes('Group 1')) {
        grouping['Group 1 (Carcinogène avéré)'].push(chem);
      } else if (classification.includes('Group 2A')) {
        grouping['Group 2A (Probablement carcinogène)'].push(chem);
      } else if (classification.includes('Group 2B')) {
        grouping['Group 2B (Peut-être carcinogène)'].push(chem);
      } else if (carcinogen === 'high' || carcinogen === 'medium') {
        grouping['Autres (risque modéré)'].push(chem);
      }
    });

    // Remove empty categories
    Object.keys(grouping).forEach(key => {
      if (grouping[key].length === 0) delete grouping[key];
    });

    return grouping;
  }, []);

  // Filter by search term
  const filteredGroups = useMemo(() => {
    const filtered = {};
    Object.entries(groupedByCarcinogenicity).forEach(([category, chemicals]) => {
      const filtered_chemicals = chemicals.filter(chem =>
        chem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chem.cas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chem.synonyms || []).some(syn => syn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (filtered_chemicals.length > 0) {
        filtered[category] = filtered_chemicals;
      }
    });
    return filtered;
  }, [searchTerm]);

  const getCarcinogenicityColor = (level) => {
    const lower = level?.toLowerCase() || 'low';
    if (lower === 'high') 
      return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    if (lower === 'medium')
      return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
    return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
  };

  const getCarcinogenicityIcon = (level) => {
    const lower = level?.toLowerCase() || 'low';
    if (lower === 'high') return <AlertTriangle className="w-5 h-5" />;
    if (lower === 'medium') return <Zap className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getCategoryBgColor = (category) => {
    if (category.includes('Group 1')) 
      return 'from-red-500 to-red-600';
    if (category.includes('Group 2A'))
      return 'from-orange-500 to-orange-600';
    if (category.includes('Group 2B'))
      return 'from-amber-500 to-amber-600';
    return 'from-yellow-500 to-yellow-600';
  };

  const getCategoryTitle = (category) => {
    if (category.includes('Group 1')) return getTranslation(language, 'group1');
    if (category.includes('Group 2A')) return getTranslation(language, 'group2a');
    if (category.includes('Group 2B')) return getTranslation(language, 'group2b');
    return getTranslation(language, 'others');
  };

  const categories = Object.keys(filteredGroups).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 px-4"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-10 h-10 text-red-500" />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            {getTranslation(language, 'carcinogenicSubstances')}
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {getTranslation(language, 'learnAboutCarcinogens')}
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <input
          type="text"
          placeholder={getTranslation(language, 'searchByName')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-400"
        />
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {getTranslation(language, 'noMatchingChemicals')}
            </p>
          </motion.div>
        ) : (
          categories.map((category, idx) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className={`w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r ${getCategoryBgColor(category)} hover:opacity-90 text-white transition-all`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold">{getCategoryTitle(category)}</span>
                  <span className="text-sm opacity-80 ml-2">({filteredGroups[category].length} {language === 'fr' ? 'substances' : 'substances'})</span>
                </div>
                <motion.div
                  animate={{ rotate: expandedCategory === category ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6" />
                </motion.div>
              </button>

              {/* Substances List */}
              <motion.div
                animate={{ height: expandedCategory === category ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 space-y-3">
                  {filteredGroups[category].map((substance, subIdx) => (
                    <motion.div
                      key={substance.cas}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: subIdx * 0.05 }}
                      className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      {/* Substance Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {substance.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {getTranslation(language, 'cas')}: <span className="font-mono">{substance.cas}</span>
                        </p>
                        {substance.molecularFormula && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {language === 'fr' ? 'Formule' : 'Formula'}: <span className="font-mono">{substance.molecularFormula}</span>
                          </p>
                        )}
                        {substance.summary && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                            {typeof substance.summary === 'object' 
                              ? substance.summary[language] || substance.summary.en
                              : substance.summary}
                          </p>
                        )}
                      </div>

                      {/* Carcinogenicity Badge */}
                      <div className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${getCarcinogenicityColor(substance.carcinogenicity)}`}>
                        {getCarcinogenicityIcon(substance.carcinogenicity)}
                        <span className="text-xs text-center">
                          {substance.carcinogenicity?.charAt(0).toUpperCase() + substance.carcinogenicity?.slice(1) || 'N/A'}
                        </span>
                      </div>

                      {/* Additional Risk Badges */}
                      <div className="flex flex-col gap-2">
                        {substance.mutagenicity?.toLowerCase() === 'high' && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg whitespace-nowrap">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs">{getTranslation(language, 'mutagenic')}</span>
                          </div>
                        )}
                        {substance.reproductiveToxicity?.toLowerCase() === 'high' && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-lg whitespace-nowrap">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs">{getTranslation(language, 'reproductiveToxic')}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))
        )}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-6xl mx-auto px-4 mt-16"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{getTranslation(language, 'iarcClassification')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-red-600 pl-4 py-2">
              <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">{getTranslation(language, 'group1')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {getTranslation(language, 'group1Desc')}
              </p>
            </div>
            <div className="border-l-4 border-orange-600 pl-4 py-2">
              <h3 className="font-bold text-orange-700 dark:text-orange-300 mb-2">{getTranslation(language, 'group2a')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {getTranslation(language, 'group2aDesc')}
              </p>
            </div>
            <div className="border-l-4 border-amber-600 pl-4 py-2">
              <h3 className="font-bold text-amber-700 dark:text-amber-300 mb-2">{getTranslation(language, 'group2b')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {getTranslation(language, 'group2bDesc')}
              </p>
            </div>
            <div className="border-l-4 border-gray-600 pl-4 py-2">
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">{getTranslation(language, 'others')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {language === 'fr' ? 'Substances avec risques sanitaires modérés à significatifs' : 'Substances with moderate to significant health risks'}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">{language === 'fr' ? 'Risques additionnels' : 'Additional Risks'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                  {getTranslation(language, 'mutagenic')}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{language === 'fr' ? 'Peut causer des mutations génétiques' : 'Can cause genetic mutations'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded text-xs font-semibold">
                  {getTranslation(language, 'reproductiveToxic')}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{language === 'fr' ? 'Affecte la fertilité ou le développement' : 'Affects fertility or development'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HealthKnowledge;
