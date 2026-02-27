import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Skull, TriangleAlert, ShieldCheck, Info } from 'lucide-react';

const Results = ({ data }) => {
    if (!data) return null;

    // ✅ Accept BOTH schemas: backend (score_global, scores_details...) OR frontend (scoreGlobal, inflammabilite...)
const score_global =
  data.score_global ??
  data.scoreGlobal ??
  data.globalScore ??
  data.totalScore ??
  0;

const niveau_risque =
  data.niveau_risque ??
  data.niveauRisque ??
  (score_global >= 70 ? "ELEVE" : score_global >= 40 ? "MOYEN" : "FAIBLE");

const scores_details =
  data.scores_details ??
  data.scores_details ??
  data.scoresDetails ??
  {
    inflammabilite: data.inflammabilite ?? data.inflammability ?? 0,
    toxicite: data.toxicite ?? data.toxicity ?? 0,
    incompatibilites: data.incompatibilites ?? data.incompatibilities ?? 0,
  };

const explication =
  data.explication ??
  data.explanation ??
  "Analyse calculée à partir des fichiers CSV.";

const recommandations =
  data.recommandations ??
  data.recommendations ??
  [];

const substances_analysees =
  data.substances_analysees ??
  data.substancesAnalysees ??
  data.substances ??
  [];


    const getRiskColor = (level) => {
        switch (level) {
            case 'ELEVE': return 'bg-red-500 text-white';
            case 'MOYEN': return 'bg-orange-500 text-white';
            case 'FAIBLE': return 'bg-emerald-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 70) return 'text-red-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-emerald-600';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
        >
            {/* Global Score Card */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>📊</span> Résultat de l'Analyse
                    </h2>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-wider ${getRiskColor(niveau_risque)}`}>
                        {niveau_risque}
                    </span>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Score Global</div>
                            <div className={`text-6xl font-black ${getScoreColor(score_global)} leading-none`}>
                                {score_global}
                            </div>
                            <div className="text-slate-400 text-sm mt-1">/ 100</div>
                        </div>

                        <div className="h-px w-full md:w-px md:h-24 bg-slate-200"></div>

                        <div className="flex-1 max-w-lg space-y-4">
                            {/* Origine du risque */}
                            {data.origines_risque && data.origines_risque.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-bold text-blue-900 mb-3 text-sm">🎯 Origine du risque</h4>
                                    <div className="space-y-2">
                                        {data.origines_risque.map((origine, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + (index * 0.05) }}
                                                className="flex items-center gap-2 text-xs text-blue-800"
                                            >
                                                <span className="text-sm">{origine.icon}</span>
                                                <span>{origine.text}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Scénario critique */}
                            {data.scenario_critique && (
                                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-bold text-red-900 mb-2 text-sm">⚡ Scénario critique identifié</h4>
                                    <div className="text-xs text-red-800 leading-relaxed">
                                        {data.scenario_critique}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <RiskCategoryCard
                            icon={<Flame className="text-orange-500" />}
                            title="Inflammabilité"
                            score={scores_details?.inflammabilite}
                        />
                        <RiskCategoryCard
                            icon={<Skull className="text-purple-500" />}
                            title="Toxicité"
                            score={scores_details?.toxicite}
                        />
                        <RiskCategoryCard
                            icon={<TriangleAlert className="text-yellow-500" />}
                            title="Incompatibilités"
                            score={scores_details?.incompatibilites}
                        />
                    </div>
                </div>
            </div>

            {/* Chemical Reactions */}
            {data.reactions_chimiques && data.reactions_chimiques.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-md border border-red-100 p-6">
                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">⚗️</span>
                        Produits de Réaction Chimique
                    </h3>
                    {data.reactions_chimiques.map((reaction, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (index * 0.1) }}
                            className="bg-white/80 rounded-lg p-4 mb-4 border border-red-100/50 last:mb-0"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="text-red-600 font-bold text-sm">⚠️</div>
                                <div className="flex-1">
                                    <div className="font-semibold text-red-900 mb-1">{reaction.substances}</div>
                                    <div className="text-sm text-red-700">{reaction.justification}</div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    reaction.risk_level === 'Élevé' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                }`}>
                                    {reaction.risk_level}
                                </span>
                            </div>
                            
                            <div className="bg-slate-100 rounded-lg p-3 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold text-slate-700">Produit formé:</span>
                                        <div className="text-red-800 font-bold">{reaction.product}</div>
                                    </div>
                                    {reaction.formula && (
                                        <div>
                                            <span className="font-semibold text-slate-700">Formule:</span>
                                            <div className="font-mono text-red-800 font-bold">{reaction.formula}</div>
                                        </div>
                                    )}
                                </div>
                                {reaction.equation && (
                                    <div className="mt-3 p-2 bg-white rounded border border-slate-200">
                                        <span className="font-semibold text-slate-700 text-sm">Équation:</span>
                                        <div className="font-mono text-sm text-slate-800 mt-1">{reaction.equation}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-md border border-emerald-100 p-6">
                <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Recommandations de Sécurité
                </h3>
                <ul className="space-y-3">
                    {recommandations && recommandations.map((rec, index) => (
                        <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (index * 0.1) }}
                            className="flex items-start gap-3 bg-white/60 p-3 rounded-lg border border-emerald-100/50"
                        >
                            <div className="min-w-6 text-emerald-600 font-bold">•</div>
                            <span className="text-slate-700 text-sm">{rec}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>

        </motion.div>
    );
};

const RiskCategoryCard = ({ icon, title, score }) => (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors">
        <div className="mb-2 p-2 bg-white rounded-full shadow-sm">
            {icon}
        </div>
        <div className="text-sm font-semibold text-slate-600 mb-1">{title}</div>
        <div className={`text-xl font-bold ${score > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
            {score || 0}
        </div>
    </div>
);

export default Results;
