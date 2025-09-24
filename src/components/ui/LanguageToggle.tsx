'use client';

import { useState } from 'react';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
    SUPPORTED_LANGUAGES,
    LANGUAGE_LABELS,
    type Locale
} from '../../i18n/language';

export function LanguageToggle() {
    const { locale, setLocale } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    // Build our array of { code, label }
    const languages = SUPPORTED_LANGUAGES.map<{
        code: Locale;
        label: string;
    }>((code) => ({
        code,
        label: LANGUAGE_LABELS[code]
    }));

    const toggleDropdown = () => setIsOpen((o) => !o);
    const selectLanguage = (langCode: Locale) => {
        setLocale(langCode);
        setIsOpen(false);
    };

    const currentLabel = LANGUAGE_LABELS[locale] ?? locale.toUpperCase();

    return (
        <div className="relative inline-block text-left z-[99999]">
            <button
                onClick={toggleDropdown}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-white inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none dark:hover:bg-gray-800"
            >
                <Globe className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="mr-2 text-gray-700 dark:text-gray-300">{currentLabel}</span>
                {isOpen
                    ? <ChevronUp className="h-4 w-4 text-gray-500" />
                    : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>

            {isOpen && (
                <ul className="absolute right-0 mt-2 w-40 bg-white dark:text-gray-300 dark:bg-gray-900 dark:border-gray-700 border border-gray-200 rounded-md shadow-lg z-[99999]">
                    {languages.map(({ code, label }) => (
                        <li key={code}>
                            <button
                                onClick={() => selectLanguage(code)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                    code === locale ? 'font-semibold' : 'font-normal'
                                }`}
                            >
                                {label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
