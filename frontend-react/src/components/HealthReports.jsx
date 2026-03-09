import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Trash2, Edit2, Save, X, Clock, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/healthTranslations';

/*
  HOW TO ADD REPORTS LOCALLY:
  
  Open browser console (F12) and paste this code to add a new report:
  
  const newReport = {
    id: Date.now(),
    title: 'Your Report Title',
    subtitle: 'Optional subtitle',
    substance: 'Chemical Name',
    date: '2026-03-09',
    author: 'Your Name',
    content: 'Report content here...',
    riskLevel: 'MODÉRÉ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const reports = JSON.parse(localStorage.getItem('healthReports') || '[]');
  reports.push(newReport);
  localStorage.setItem('healthReports', JSON.stringify(reports));
  location.reload();
  
  Available riskLevel values: FAIBLE, MODÉRÉ, ÉLEVÉ, CRITIQUE
*/

const HealthReports = () => {
  const { language } = useLanguage();
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('healthReports');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCreating, setIsCreating] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem('healthReports', JSON.stringify(reports));
  }, [reports]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 px-4"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileText className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Rapports de Santé' : 'Health Reports'}
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {language === 'fr' 
            ? 'Consultez les rapports d\'évaluation des risques sanitaires'
            : 'View health risk assessment reports'
          }
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {language === 'fr' ? 'Aucun rapport pour le moment' : 'No reports yet'}
              </p>
            </motion.div>
          ) : (
            reports.map((report, idx) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setViewingReport(report)}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer"
              >
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {report.title}
                  </h3>
                  {report.subtitle && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      {report.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    {report.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {report.author}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(report.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3">
                    {report.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {viewingReport.title}
                  </h2>
                  {viewingReport.subtitle && (
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                      {viewingReport.subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setViewingReport(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8">
                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                  {viewingReport.author && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        {language === 'fr' ? 'Auteur' : 'Author'}
                      </p>
                      <p className="text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {viewingReport.author}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      {language === 'fr' ? 'Date' : 'Date'}
                    </p>
                    <p className="text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(viewingReport.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                  {viewingReport.substance && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        {language === 'fr' ? 'Substance' : 'Substance'}
                      </p>
                      <p className="text-slate-900 dark:text-white">
                        {viewingReport.substance}
                      </p>
                    </div>
                  )}
                </div>

                {/* Full Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {viewingReport.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HealthReports;
