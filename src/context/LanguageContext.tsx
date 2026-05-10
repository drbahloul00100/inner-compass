import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  type Language,
  type Translations,
  LANG_STORAGE_KEY,
  isValidLanguage,
} from "@/lib/i18n";
import { en } from "@/lib/translations/en";
import { ar } from "@/lib/translations/ar";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: en,
});

function applyToDOM(l: Language) {
  const root = document.documentElement;
  root.lang = l;
  root.dir = l === "ar" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isValidLanguage(stored)) {
      applyToDOM(stored);
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Language) => {
    localStorage.setItem(LANG_STORAGE_KEY, l);
    applyToDOM(l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: lang === "ar" ? ar : en }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
