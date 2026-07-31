import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { trackLanguageToggle } from "@/app/analytics";

export type Lang = "en" | "zh";

const STORAGE_KEY = "wtb-lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(STORAGE_KEY) === "zh" ? "zh" : "en";
}

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const toggleLang = () =>
    setLang((l) => {
      const next = l === "en" ? "zh" : "en";
      trackLanguageToggle(next);
      return next;
    });

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
