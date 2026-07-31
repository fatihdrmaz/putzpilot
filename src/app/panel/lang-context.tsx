"use client";

// Temizlikçi paneli dil bağlamı — TR/DE değişimli (cookie: pp_lang)
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getDictionary, Dictionary, Locale } from "@/lib/i18n";

const LangContext = createContext<{
  lang: Locale;
  dict: Dictionary;
  setLang: (l: Locale) => void;
}>({ lang: "tr", dict: getDictionary("tr"), setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>("tr");

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )pp_lang=(tr|de)/);
    if (m) setLangState(m[1] as Locale);
  }, []);

  function setLang(l: Locale) {
    document.cookie = `pp_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    setLangState(l);
  }

  return (
    <LangContext.Provider value={{ lang, dict: getDictionary(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
