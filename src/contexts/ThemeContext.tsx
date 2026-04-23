import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => Promise<void>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolve = (t: Theme): ResolvedTheme => (t === "system" ? getSystemTheme() : t);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "dark";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(theme));

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const next = resolve(theme);
    root.classList.remove("light", "dark");
    root.classList.add(next);
    setResolvedTheme(next);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen to system theme when "system" is selected
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next: ResolvedTheme = mq.matches ? "dark" : "light";
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(next);
      setResolvedTheme(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Sync from profile when it loads
  useEffect(() => {
    if (profile?.theme && (profile.theme === "light" || profile.theme === "dark" || profile.theme === "system")) {
      setThemeState(profile.theme as Theme);
    }
  }, [profile?.theme]);

  const setTheme = useCallback(
    async (t: Theme) => {
      setThemeState(t);
      if (user) {
        await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
      }
    },
    [user]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((p) => {
      const next: Theme = p === "dark" ? "light" : "dark";
      if (user) {
        supabase.from("profiles").update({ theme: next }).eq("id", user.id);
      }
      return next;
    });
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
