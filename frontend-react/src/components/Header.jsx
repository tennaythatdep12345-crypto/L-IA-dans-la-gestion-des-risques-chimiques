import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Sparkles, Brain, Atom, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Header = ({ setCurrentPage, currentPage }) => {
    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 dark:from-slate-800 dark:via-emerald-900 dark:to-teal-900 text-white overflow-hidden"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20">
                <div className="absolute top-4 left-10 text-6xl animate-pulse">⚗️</div>
                <div className="absolute top-16 right-20 text-4xl animate-bounce delay-1000">🧬</div>
                <div className="absolute bottom-8 left-1/4 text-5xl animate-ping delay-500">💡</div>
                <div className="absolute bottom-12 right-16 text-3xl animate-pulse delay-700">🔬</div>
                <div className="absolute top-1/2 left-1/2 text-7xl animate-spin" style={{animationDuration: '20s'}}>⚛️</div>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

            <div className="container mx-auto relative z-10 px-6 py-12 md:py-16">
                <div className="flex justify-between items-center mb-8">
                    {/* Navigation */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCurrentPage('analyzer')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                currentPage === 'analyzer'
                                    ? 'bg-white/20 border border-white/40 backdrop-blur-sm'
                                    : 'hover:bg-white/10'
                            }`}
                        >
                            Analyseur
                        </button>
                        <button
                            onClick={() => setCurrentPage('knowledge')}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                                currentPage === 'knowledge'
                                    ? 'bg-white/20 border border-white/40 backdrop-blur-sm'
                                    : 'hover:bg-white/10'
                            }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            Connaissances
                        </button>
                        <button
                            onClick={() => setCurrentPage('about')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                currentPage === 'about'
                                    ? 'bg-white/20 border border-white/40 backdrop-blur-sm'
                                    : 'hover:bg-white/10'
                            }`}
                        >
                            À Propos
                        </button>
                    </div>
                    <ThemeToggle />
                </div>
                
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex items-center justify-center gap-4 mb-6"
                    >
                        <div className="relative">
                            <FlaskConical className="w-12 h-12 text-emerald-300 animate-pulse" />
                            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-300 animate-spin" />
                        </div>
                        <div className="h-8 w-px bg-white/30"></div>
                        <div className="relative">
                            <Brain className="w-12 h-12 text-cyan-300 animate-pulse delay-300" />
                            <Atom className="absolute -bottom-1 -right-1 w-6 h-6 text-purple-300 animate-bounce delay-500" />
                        </div>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-lg"
                    >
                        Système d'Analyse des Risques Chimiques
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-lg md:text-xl text-emerald-50/90 mb-6 max-w-3xl mx-auto leading-relaxed"
                    >
                        Intelligence Artificielle appliquée à la gestion des risques en laboratoire de R&D
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-sm font-semibold tracking-wide"
                    >
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        PROJET IUT GÉNIE CHIMIQUE
                    </motion.div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1200 120" className="w-full h-8 fill-white dark:fill-slate-900">
                    <path d="M0,60 C200,90 400,30 600,60 C800,90 1000,30 1200,60 L1200,120 L0,120 Z"/>
                </svg>
            </div>
        </motion.header>
    );
};
export default Header;

