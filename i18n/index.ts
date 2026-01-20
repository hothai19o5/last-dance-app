// i18n configuration
import { en, TranslationKeys } from './translations/en';
import { vi } from './translations/vi';

export type Language = 'en' | 'vi';

export const translations: Record<Language, TranslationKeys> = {
    en,
    vi,
};

export const languageNames: Record<Language, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
};

export const defaultLanguage: Language = 'en';

export { en, vi };
export type { TranslationKeys };

