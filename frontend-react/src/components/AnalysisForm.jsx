import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RotateCcw, AlertCircle, Flame, TestTube, AlertTriangle } from 'lucide-react';

const AnalysisForm = ({ onAnalyze, isLoading, error }) => {
    const [formData, setFormData] = useState({
        substanceA: '',
        substanceB: '',
        ventilation: true,
        temperature: 22,
        humidity: 50
    });

    const [incompatibilities, setIncompatibilities] = useState([]);
    const [substances, setSubstances] = useState([]);

    useEffect(() => {
        // Charger les incompatibilités chimiques
        const loadIncompatibilities = async () => {
            try {
                const response = await fetch('/incompatibilites.csv');
                const text = await response.text();
                const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
                const reactions = lines.slice(1).map(line => {
                    const parts = line.split(';').map(s => s.trim());
                    return {
                        cas_a: parts[0],
                        cas_b: parts[1],
                        substance_a: parts[2],
                        substance_b: parts[3],
                        niveau_risque: parts[4],
                        type_reaction: parts[5],
                        justification: parts[6],
                        produit_reaction: parts[7],
                        formule_produit: parts[8],
                        equation_reaction: parts[9],
                        recommandation: parts[10]
                    };
                }).filter(r => r.substance_a && r.substance_b);
                console.log('[AnalysisForm] Incompatibilities loaded:', reactions.length, 'reactions');
                console.log('[AnalysisForm] Sample:', reactions.slice(0, 3));
                setIncompatibilities(reactions);
            } catch (err) {
                console.error("Erreur chargement incompatibilités:", err);
            }
        };

        // Charger les substances avec formules chimiques
        const loadSubstances = async () => {
            try {
                const response = await fetch('/substances.csv');
                const text = await response.text();
                const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
                const subs = lines.slice(1).map(line => {
                    const parts = line.split(';');
                    return {
                        cas: parts[0]?.trim(),
                        nom: parts[1]?.trim(),
                        formule_chimique: parts[3]?.trim()
                    };
                }).filter(s => s.nom && s.formule_chimique);
                setSubstances(subs);
            } catch (err) {
                console.error("Erreur chargement substances:", err);
            }
        };

        loadIncompatibilities();
        loadSubstances();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Create array of substances, filtering out empty ones
        const substances = [formData.substanceA.trim(), formData.substanceB.trim()]
            .filter(s => s.length > 0);

        onAnalyze({
            ...formData,
            substances: substances
        });
    };

    const handleReset = () => {
        setFormData({
            substanceA: '',
            substanceB: '',
            ventilation: true,
            temperature: 22,
            humidity: 50
        });
    };

    // Lọc phản ứng dựa trên các chất được chọn
    const getRelevantReactions = () => {
        const substanceA = formData.substanceA.trim().toLowerCase();
        const substanceB = formData.substanceB.trim().toLowerCase();

        console.log('[getRelevantReactions] substanceA:', substanceA, 'substanceB:', substanceB);
        console.log('[getRelevantReactions] incompatibilities count:', incompatibilities.length);

        if (!substanceA && !substanceB) return [];

        const filtered = incompatibilities.filter(reaction => {
            const subA = reaction.substance_a.toLowerCase();
            const subB = reaction.substance_b.toLowerCase();

            // Nếu cả hai chất được nhập
            if (substanceA && substanceB) {
                return (subA.includes(substanceA) || subB.includes(substanceA)) &&
                       (subA.includes(substanceB) || subB.includes(substanceB));
            }

            // Nếu chỉ có substanceA
            if (substanceA) {
                return subA.includes(substanceA) || subB.includes(substanceA);
            }

            // Nếu chỉ có substanceB
            if (substanceB) {
                return subA.includes(substanceB) || subB.includes(substanceB);
            }

            return false;
        });

        console.log('[getRelevantReactions] found', filtered.length, 'reactions');
        if (filtered.length > 0) {
            console.log('[getRelevantReactions] first reaction:', filtered[0]);
        }
        return filtered;
    };

    // Lấy công thức hóa học của một chất
    const getChemicalFormula = (substanceName) => {
        const sub = substances.find(s => s.nom.toLowerCase() === substanceName.toLowerCase());
        return sub?.formule_chimique || substanceName;
    };

    // Lấy sản phẩm phản ứng dựa trên justification
    const getProductFormulas = (reaction) => {
        const justif = reaction.justification.toLowerCase();
        const products = [];

        // Phân tích từ khóa trong justification để xác định sản phẩm
        if (justif.includes('phosgène')) products.push('COCl₂');
        if (justif.includes('chlore gazeux') || justif.includes('chlore')) products.push('Cl₂');
        if (justif.includes('chlorure d\'ammonium')) products.push('NH₄Cl');
        if (justif.includes('acide peracétique')) products.push('CH₃COOOH');
        if (justif.includes('peroxyde')) products.push('Peroxydes organiques');
        if (justif.includes('polymères')) products.push('Polymères');
        if (justif.includes('nitration')) products.push('Composés nitrés');
        if (justif.includes('oxydation') || justif.includes('oxydant')) products.push('Composés oxydés');
        if (justif.includes('acide perphosphorique')) products.push('H₃PO₂O₃');
        if (justif.includes('chaleur')) products.push('Chaleur (ΔH > 0)');

        // Si aucun produit spécifique n'est détecté
        if (products.length === 0) {
            products.push('Produits réactionnels instables');
        }

        return products.join(' + ');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 md:p-8"
        >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 p-2 rounded-lg">
                    <span className="text-2xl">📋</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Formulaire d'Analyse</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Saisissez les substances et conditions</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="substanceA" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            Substance A <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="substanceA"
                            name="substanceA"
                            type="text"
                            required
                            placeholder="Ex: Éthanol ou 64-17-5"
                            value={formData.substanceA}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-cyan-500 focus:border-emerald-500 dark:focus:border-cyan-500 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="substanceB" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            Substance B
                        </label>
                        <input
                            id="substanceB"
                            name="substanceB"
                            type="text"
                            placeholder="Ex: Acide sulfurique ou 7664-93-9"
                            value={formData.substanceB}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-cyan-500 focus:border-emerald-500 dark:focus:border-cyan-500 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                    💡 Saisissez le nom chimique ou le numéro CAS. La substance B est optionnelle (pour analyse d'incompatibilités).
                </p>

                <div className="bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border-2 border-emerald-200 dark:border-emerald-700/50 overflow-hidden shadow-md">
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>🧪</span>
                            Conditions de Laboratoire
                        </h3>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Ventilation checkbox - Full width */}
                        <div>
                            <label className="flex items-center gap-3 p-4 bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 cursor-pointer hover:border-emerald-400 dark:hover:border-cyan-400 hover:shadow-md transition-all group">
                                <input
                                    type="checkbox"
                                    name="ventilation"
                                    checked={formData.ventilation}
                                    onChange={handleChange}
                                    className="w-6 h-6 text-emerald-600 dark:text-cyan-500 rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-cyan-500 border-gray-300 dark:border-slate-500 dark:bg-slate-600 cursor-pointer"
                                />
                                <span className="text-base font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-cyan-400 transition-colors">Ventilation adéquate (hotte)</span>
                                {formData.ventilation && <span className="ml-auto text-emerald-600 dark:text-cyan-400">✓</span>}
                            </label>
                        </div>

                        {/* Temperature and Humidity - Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="temperature" className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2 tracking-wider">🌡️ Température</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="temperature"
                                        id="temperature"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-cyan-500 focus:border-emerald-500 dark:focus:border-cyan-500 text-slate-700 dark:text-slate-200 font-semibold text-center text-lg shadow-sm transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">°C</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="humidity" className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2 tracking-wider">💧 Humidité</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="humidity"
                                        id="humidity"
                                        value={formData.humidity}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-cyan-500 focus:border-emerald-500 dark:focus:border-cyan-500 text-slate-700 dark:text-slate-200 font-semibold text-center text-lg shadow-sm transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Produits de Réaction Chimique Section */}
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50 rounded-lg flex items-center justify-center text-xl">🧪</div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Réactions Chimiques Potentielles</h3>
                    </div>

                    {getRelevantReactions().length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {getRelevantReactions().map((reaction, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-4 rounded-lg border-l-4 transition-all ${
                                        reaction.niveau_risque === 'Élevé' 
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600' 
                                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                                                <span className="text-red-600 dark:text-red-400">{reaction.substance_a}</span>
                                                <span className="text-slate-500 dark:text-slate-400 mx-2">+</span>
                                                <span className="text-orange-600 dark:text-orange-400">{reaction.substance_b}</span>
                                            </p>
                                            
                                            {/* Phương trình hóa học */}
                                            <div className="bg-white dark:bg-slate-700/50 rounded p-3 mb-2 border border-slate-200 dark:border-slate-600">
                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono text-center leading-relaxed">
                                                    {reaction.equation_reaction ? (
                                                        reaction.equation_reaction
                                                    ) : (
                                                        <>
                                                            <span className="text-red-600 dark:text-red-400 font-semibold">{getChemicalFormula(reaction.substance_a)}</span>
                                                            <span className="text-slate-400 mx-2">+</span>
                                                            <span className="text-orange-600 dark:text-orange-400 font-semibold">{getChemicalFormula(reaction.substance_b)}</span>
                                                            <span className="text-slate-400 mx-2">→</span>
                                                            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                                                {getProductFormulas(reaction)}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Produit et Formule */}
                                            {(reaction.produit_reaction || reaction.formule_produit) && (
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    {reaction.produit_reaction && (
                                                        <div className="bg-slate-100 dark:bg-slate-700/70 rounded p-2">
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">Produit:</p>
                                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{reaction.produit_reaction}</p>
                                                        </div>
                                                    )}
                                                    {reaction.formule_produit && (
                                                        <div className="bg-slate-100 dark:bg-slate-700/70 rounded p-2">
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">Formule:</p>
                                                            <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{reaction.formule_produit}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                            reaction.niveau_risque === 'Élevé'
                                                ? 'bg-red-200 dark:bg-red-900/60 text-red-700 dark:text-red-200'
                                                : 'bg-orange-200 dark:bg-orange-900/60 text-orange-700 dark:text-orange-200'
                                        }`}>
                                            {reaction.niveau_risque}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">
                                        {reaction.justification}
                                    </p>
                                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                        <p className="font-medium">{reaction.recommandation}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                            <TestTube size={32} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">
                                {formData.substanceA || formData.substanceB 
                                    ? "Aucune réaction chimique connue pour ces substances"
                                    : "Sélectionnez des substances pour voir les réactions potentielles"
                                }
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">{error}</div>
                    </motion.div>
                )}

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 dark:from-emerald-500 dark:to-cyan-500 dark:hover:from-emerald-600 dark:hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Analyse...</span>
                            </>
                        ) : (
                            <>
                                <Search size={20} />
                                <span>Analyser les Risques</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isLoading}
                        className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default AnalysisForm;
