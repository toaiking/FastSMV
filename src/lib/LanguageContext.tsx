import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from './translations';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smv_language');
    if (saved === 'en' || saved === 'vi') return saved;
    return 'vi'; // Default language is Vietnamese
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smv_language', lang);
  };

  const t = (text: string): string => {
    return getTranslation(text, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
