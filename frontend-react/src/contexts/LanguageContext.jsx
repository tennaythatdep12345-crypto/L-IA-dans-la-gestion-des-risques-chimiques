import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('fr'); // 'fr' or 'en'

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
    };

    const value = {
        language,
        setLanguage,
        toggleLanguage,
        isEnglish: language === 'en',
        isFrench: language === 'fr'
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
