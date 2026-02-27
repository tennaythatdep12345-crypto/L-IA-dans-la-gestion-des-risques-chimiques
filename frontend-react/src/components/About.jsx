import React from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Globe, Award, Target, Users, Zap } from 'lucide-react';

const About = () => {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* About Me Section */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent text-center"
          >
            À Propos de Moi
          </motion.h2>
          
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="grid md:grid-cols-3 gap-8 items-start">
              {/* Profile Image */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center md:justify-start"
              >
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-6xl shadow-lg">
                  👨‍💻
                </div>
              </motion.div>

              {/* Bio */}
              <motion.div
                variants={itemVariants}
                className="md:col-span-2"
              >
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                  Étudiant - IUT Génie Chimique
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-4">
                  Je suis un étudiant passionné par l'intersection entre la chimie et l'intelligence artificielle. 
                  Mon objectif est de créer des outils innovants qui rendent la gestion des risques chimiques plus accessible et efficace.
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-4">
                  Spécialisé dans le développement full-stack, j'aime combiner des connaissances techniques solides 
                  avec une compréhension profonde des enjeux de sécurité en laboratoire.
                </p>
                <div className="flex gap-4 mt-6">
                  <a href="mailto:your.email@example.com" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg transition">
                    <Github className="w-5 h-5" />
                    GitHub
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Project Section */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent text-center"
          >
            À Propos du Projet
          </motion.h2>
          
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-8"
          >
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Système d'Analyse des Risques Chimiques
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-4">
              Ce projet est une application web intelligente conçue pour analyser et évaluer les risques associés 
              aux réactions chimiques en laboratoire. Il combine des données de sécurité chimique avec des algorithmes 
              d'intelligence artificielle pour fournir une évaluation rapide et précise des risques.
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              L'application aide les chimistes, les responsables de laboratoire et les étudiants à comprendre les dangers 
              potentiels des interactions chimiques et à prendre des décisions éclairées concernant la gestion des substances.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Target, title: "Analyse Précise", desc: "Évaluation détaillée des risques en temps réel" },
              { icon: Zap, title: "Performance", desc: "Résultats instantanés avec calculs optimisés" },
              { icon: Award, title: "Base de Données", desc: "Informations validées de sources fiables" },
              { icon: Users, title: "Pédagogique", desc: "Outil d'apprentissage pour étudiants" },
              { icon: Globe, title: "Accessibilité", desc: "Interface intuitive en français" },
              { icon: Zap, title: "Intelligence Artificielle", desc: "Algorithmes avancés d'analyse et de scoring" }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-6 border border-emerald-200 dark:border-slate-600 hover:shadow-md transition"
              >
                <feature.icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3" />
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl font-bold mb-6 text-slate-800 dark:text-white text-center"
          >
            Stack Technologique
          </motion.h2>
          
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 text-lg">Frontend</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>⚛️ React 19</li>
                  <li>🎨 Tailwind CSS</li>
                  <li>✨ Framer Motion</li>
                  <li>⚡ Vite</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-teal-600 dark:text-teal-400 mb-4 text-lg">Backend</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>📦 Node.js / Express</li>
                  <li>🔗 REST API</li>
                  <li>🌐 CORS Enabled</li>
                  <li>📡 Python Integration</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-cyan-600 dark:text-cyan-400 mb-4 text-lg">AI Engine</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>🐍 Python</li>
                  <li>🧠 Algorithmes de Scoring</li>
                  <li>📊 Analyse de Données</li>
                  <li>⚗️ Règles Chimiques</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={itemVariants}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
            Vous avez des questions ou des suggestions ? N'hésitez pas à nous contacter !
          </p>
          <motion.div
            className="inline-flex gap-4"
            whileHover={{ scale: 1.05 }}
          >
            <a 
              href="mailto:contact@example.com"
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
            >
              Nous Contacter
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
