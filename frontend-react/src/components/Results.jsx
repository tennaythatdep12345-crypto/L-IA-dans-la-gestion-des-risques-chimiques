import React from 'react';
import { motion } from 'framer-motion';
import { 
    Flame, 
    Skull, 
    TriangleAlert, 
    ShieldCheck, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle, 
    Activity, 
    Gauge, 
    Zap,
    Eye,
    Target
} from 'lucide-react';

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

    const explication = data.explication ?? data.explanation ?? "";
    const recommandations = data.recommandations ?? data.recommendations ?? [];

    // Color schemes based on risk level
    const getRiskColorScheme = (niveau) => {
        switch (niveau) {
            case 'ELEVE':
                return {
                    bg: 'from-red-500 to-red-600',
                    text: 'text-white',
                    badge: 'bg-red-100 text-red-800 border-red-200',
                    glow: 'shadow-red-500/25',
                    accent: 'bg-red-500'
                };
            case 'MOYEN':
                return {
                    bg: 'from-orange-500 to-amber-500',
                    text: 'text-white',
                    badge: 'bg-orange-100 text-orange-800 border-orange-200',
                    glow: 'shadow-orange-500/25',
                    accent: 'bg-orange-500'
                };
            default:
                return {
                    bg: 'from-emerald-500 to-green-500',
                    text: 'text-white',
                    badge: 'bg-green-100 text-green-800 border-green-200',
                    glow: 'shadow-emerald-500/25',
                    accent: 'bg-emerald-500'
                };
        }
    };

    const colorScheme = getRiskColorScheme(niveau_risque);

    const getScoreColor = (score) => {
        if (score >= 30) return 'text-red-600';
        if (score >= 15) return 'text-orange-600';
        return 'text-emerald-600';
    };

    const getProgressColor = (score) => {
        if (score >= 30) return 'from-red-500 to-red-600';
        if (score >= 15) return 'from-orange-500 to-amber-500';
        return 'from-emerald-500 to-green-500';
    };

    // Score card component
    const ScoreCard = ({ title, score, icon, maxScore = 50, delay = 0 }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 p-5 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
        >
            {/* Title */}
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-3 leading-snug line-clamp-2 h-10">{title}</h3>
            
            <div className="flex flex-col flex-1 justify-between">
                {/* Content section */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${score >= 30 ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' : score >= 15 ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'}`}>
                        <div className="w-5 h-5">
                            {icon}
                        </div>
                    </div>
                    <div className={`text-3xl font-black ${getScoreColor(score)}`}>{score}</div>
                    <div className="ml-auto text-2xl flex-shrink-0">
                        {score === 0 ? '✅' : score < 15 ? '⚠️' : score < 30 ? '🚨' : '☠️'}
                    </div>
                </div>
            
                {/* Progress bar section */}
                <div className="w-full">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((score / maxScore) * 100, 100)}%` }}
                            transition={{ delay: delay + 0.5, duration: 1 }}
                            className={`h-full bg-gradient-to-r ${getProgressColor(score)} rounded-full`}
                        />
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-right">Max: {maxScore}</div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
        >
            {/* Main Score Card - Hero Style */}
            <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`relative bg-gradient-to-br ${colorScheme.bg} ${colorScheme.glow} shadow-2xl rounded-3xl overflow-hidden`}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-8 right-8 text-8xl">📊</div>
                    <div className="absolute bottom-8 left-8 text-6xl">⚗️</div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5">🔬</div>
                </div>

                <div className="relative p-10">
                    <div className="flex items-center justify-between mb-8">
                        <motion.h2 
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            className={`text-3xl font-bold ${colorScheme.text} flex items-center gap-3`}
                        >
                            <Activity className="w-8 h-8" />
                            Résultat de l'Analyse
                        </motion.h2>
                        <motion.div 
                            initial={{ x: 20 }}
                            animate={{ x: 0 }}
                            className={`px-6 py-3 rounded-2xl border ${colorScheme.badge} text-lg font-bold shadow-lg backdrop-blur-sm`}
                        >
                            {niveau_risque}
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Score Display */}
                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                        >
                            <div className={`text-sm font-medium ${colorScheme.text} opacity-90 mb-2 tracking-wider uppercase`}>
                                Score Global
                            </div>
                            <div className={`text-8xl font-black ${colorScheme.text} leading-none mb-4 relative`}>
                                {score_global}
                            </div>
                            <div className={`text-lg ${colorScheme.text} opacity-75 mb-4`}>/ 100</div>
                            
                            {/* Circular progress */}
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="transform -rotate-90 w-32 h-32">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="white"
                                        strokeOpacity="0.2"
                                        strokeWidth="8"
                                        fill="transparent"
                                    />
                                    <motion.circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="white"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={`${2 * Math.PI * 56}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                                        animate={{ 
                                            strokeDashoffset: 2 * Math.PI * 56 * (1 - Math.min(score_global, 100) / 100) 
                                        }}
                                        transition={{ delay: 0.5, duration: 1.5 }}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${colorScheme.text} opacity-90`}>
                                    {Math.min(score_global, 100)}%
                                </div>
                            </div>
                        </motion.div>

                        {/* Risk Analysis */}
                        <div className="space-y-4">
                            {/* Origine du risque */}
                            {data.origines_risque && data.origines_risque.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-white/10"
                                >
                                    <h4 className={`font-bold ${colorScheme.text} mb-3 text-lg flex items-center gap-2`}>
                                        <Target className="w-5 h-5" />
                                        Origine du risque
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {data.origines_risque.map((origine, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + (index * 0.1) }}
                                                className={`flex items-center gap-2 text-sm ${colorScheme.text} bg-white/10 dark:bg-white/5 rounded-lg p-2`}
                                            >
                                                <span className="text-lg">{origine.icon}</span>
                                                <span className="truncate">{origine.text}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Scénario critique */}
                            {data.scenario_critique && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-white/10"
                                >
                                    <h4 className={`font-bold ${colorScheme.text} mb-2 text-lg flex items-center gap-2`}>
                                        <Zap className="w-5 h-5" />
                                        Scénario critique
                                    </h4>
                                    <div className={`text-sm ${colorScheme.text} leading-relaxed opacity-90`}>
                                        {data.scenario_critique}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Detailed Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreCard
                    title="Inflammabilité"
                    score={scores_details.inflammabilite}
                    icon={<Flame className="w-6 h-6" />}
                    maxScore={100}
                    delay={0.1}
                />
                <ScoreCard
                    title="Toxicité"
                    score={scores_details.toxicite}
                    icon={<Skull className="w-6 h-6" />}
                    maxScore={100}
                    delay={0.2}
                />
                <ScoreCard
                    title="Incompatibilités"
                    score={scores_details.incompatibilites}
                    icon={<TriangleAlert className="w-6 h-6" />}
                    maxScore={100}
                    delay={0.3}
                />
            </div>

            {/* Recommendations */}
            {recommandations && recommandations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl shadow-lg border border-emerald-100 dark:border-emerald-700 p-6"
                >
                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        Recommandations de Sécurité
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommandations.map((rec, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + (index * 0.1) }}
                                className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 p-4 rounded-lg border border-emerald-100/50 dark:border-emerald-700/50 shadow-sm"
                            >
                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">{rec}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Results;