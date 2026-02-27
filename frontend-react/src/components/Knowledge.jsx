import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, AlertTriangle, CheckCircle, AlertCircle, Zap, Flame, Skull } from 'lucide-react';

const Knowledge = () => {
  const [substances, setSubstances] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load substances from CSV
    fetch('/substances.csv')
      .then(res => res.text())
      .then(data => parseSubstances(data))
      .catch(err => console.error('Error loading substances:', err));
  }, []);

  const parseSubstances = (csvText) => {
    const lines = csvText.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim());
    if (!lines.length) return;

    const headerLine = lines.find(line => !line.startsWith('#'));
    if (!headerLine) return;

    const headers = headerLine.split(';').map(h => h.trim());
    const rows = [];

    for (let i = lines.indexOf(headerLine) + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      const values = line.split(';').map(v => v.trim());
      const obj = {};
      headers.forEach((h, idx) => obj[h] = values[idx] || '');
      if (Object.values(obj).some(v => v)) rows.push(obj);
    }

    setSubstances(rows);
  };

  const getToxicityColor = (toxicity) => {
    if (!toxicity) return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    const lower = toxicity.toLowerCase();
    if (lower.includes('nulle') || lower.includes('none')) 
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    if (lower.includes('faible'))
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    if (lower.includes('modérée') || lower.includes('moderate'))
      return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
    if (lower.includes('élevée') || lower.includes('high'))
      return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };

  const getToxicityIcon = (toxicity) => {
    if (!toxicity) return <CheckCircle className="w-5 h-5" />;
    const lower = toxicity.toLowerCase();
    if (lower.includes('nulle') || lower.includes('none')) 
      return <CheckCircle className="w-5 h-5" />;
    if (lower.includes('faible'))
      return <AlertCircle className="w-5 h-5" />;
    if (lower.includes('modérée') || lower.includes('moderate'))
      return <AlertTriangle className="w-5 h-5" />;
    if (lower.includes('élevée') || lower.includes('high'))
      return <Skull className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const groupedSubstances = substances.reduce((acc, sub) => {
    const famille = sub.famille || 'Autres';
    if (!acc[famille]) acc[famille] = [];
    acc[famille].push(sub);
    return acc;
  }, {});

  const filteredGroups = Object.entries(groupedSubstances).reduce((acc, [key, items]) => {
    const filtered = items.filter(item => 
      item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.famille.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[key] = filtered;
    }
    return acc;
  }, {});

  const categories = Object.keys(filteredGroups).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 px-4"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
          Connaissances chimiques
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Classification des substances chimiques et évaluation de leur toxicité
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <input
          type="text"
          placeholder="Rechercher une substance..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400"
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
              Aucune substance trouvée
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
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all"
              >
                <span className="text-xl font-semibold">{category}</span>
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
                          {substance.nom}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {substance.nom_iupac}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Formule: <span className="font-mono">{substance.formule_chimique}</span>
                        </p>
                      </div>

                      {/* Toxicity Badge */}
                      <div className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm ${getToxicityColor(substance.toxicite)}`}>
                        {getToxicityIcon(substance.toxicite)}
                        <span className="text-xs">{substance.toxicite || 'N/A'}</span>
                      </div>

                      {/* Risk Level */}
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {substance.niveau_risque_incendie === 'Élevé' && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
                            <Flame className="w-4 h-4" />
                            <span className="text-xs">Inflammable</span>
                          </div>
                        )}
                        {substance.niveau_risque_incendie === 'Moyen' && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs">Modéré</span>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Légende de toxicité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                <span>Nulle</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">Non toxique</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="w-5 h-5" />
                <span>Faible</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">Toxicité faible</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                <AlertTriangle className="w-5 h-5" />
                <span>Modérée</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">Toxicité modérée</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                <Skull className="w-5 h-5" />
                <span>Élevée</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">Toxicité élevée</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Knowledge;
