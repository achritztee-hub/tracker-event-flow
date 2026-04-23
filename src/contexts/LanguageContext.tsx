import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { translations, Language, TranslationKey } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "id";
    const stored = localStorage.getItem("language") as Language | null;
    return stored ?? "id";
  });

  // Sync from profile when it loads
  useEffect(() => {
    if (profile?.language && (profile.language === "id" || profile.language === "en")) {
      setLanguageState(profile.language);
      localStorage.setItem("language", profile.language);
    }
  }, [profile?.language]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      localStorage.setItem("language", lang);
      if (user) {
        await supabase.from("profiles").update({ language: lang }).eq("id", user.id);
      }
    },
    [user]
  );

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] ?? translations.id[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
