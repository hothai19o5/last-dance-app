// Language Context - Quản lý ngôn ngữ cho ứng dụng
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { defaultLanguage, Language, languageNames, TranslationKeys, translations } from '../i18n';

const LANGUAGE_KEY = '@app_language';

interface LanguageContextType {
    language: Language;
    t: TranslationKeys;
    setLanguage: (lang: Language) => Promise<void>;
    languageNames: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(defaultLanguage);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved language on mount
    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
                setLanguageState(savedLanguage as Language);
            }
        } catch (error) {
            console.error('[Language] Error loading language:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const setLanguage = useCallback(async (lang: Language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
            setLanguageState(lang);
            console.log('[Language] Language changed to:', lang);
        } catch (error) {
            console.error('[Language] Error saving language:', error);
        }
    }, []);

    // Get translations for current language
    const t = translations[language];

    // Don't render children until language is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <LanguageContext.Provider
            value={{
                language,
                t,
                setLanguage,
                languageNames,
            }}
        >
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

// Hook to get just translations (shorthand)
export const useTranslation = () => {
    const { t } = useLanguage();
    return t;
};
