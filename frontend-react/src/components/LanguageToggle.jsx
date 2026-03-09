import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-2 text-sm font-semibold text-white"
      aria-label={language === 'fr' ? 'Switch to English' : 'Basculer vers Français'}
      title={language === 'fr' ? 'English' : 'Français'}
    >
      <Globe className="w-5 h-5" />
      <span>{language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageToggle;
