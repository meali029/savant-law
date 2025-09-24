export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
export type Locale = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<Locale, string> = {
    en: 'English',
    zh: '中文'
};
