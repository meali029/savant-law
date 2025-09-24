"use client"

import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { en } from "../i18n/en";
import { zh } from "../i18n/zh";

type Locale = "en" | "zh";
type Translations = typeof en;

interface LanguageContextValue {
    locale: Locale;
    t: Translations;
    setLocale: (l: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
    undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>("en");
    const [t, setT] = useState<Translations>(en);

    useEffect(() => {
        if (locale === "zh") setT(zh);
        else setT(en);
    }, [locale]);

    return (
        <LanguageContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
    return ctx;
}
