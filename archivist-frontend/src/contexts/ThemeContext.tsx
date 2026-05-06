import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  cycleMode: () => void;
};

const STORAGE_KEY = "archivist-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const modeOrder: ThemeMode[] = ["light", "dark", "system"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const storedMode = localStorage.getItem(STORAGE_KEY);
    if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
      return storedMode;
    }
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    mode === "system" ? getSystemTheme() : mode,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);

    const applyTheme = (theme: ResolvedTheme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      setResolvedTheme(theme);
    };

    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches ? "dark" : "light");

      const handleChange = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    applyTheme(mode);
  }, [mode]);

  const cycleMode = () => {
    const currentModeIndex = modeOrder.indexOf(mode);
    const nextMode = modeOrder[(currentModeIndex + 1) % modeOrder.length];
    setMode(nextMode);
  };

  const value = useMemo(
    () => ({ mode, resolvedTheme, cycleMode }),
    [mode, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
