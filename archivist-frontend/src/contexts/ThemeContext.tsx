import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ThemeContextType = {
    mode: ThemeMode;
    setMode: (m: ThemeMode) => void;
    resolved: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "archivist-theme";

function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(
        () => (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system"
    );
    const [resolved, setResolved] = useState<"light" | "dark">(
        mode === "system" ? getSystemTheme() : mode
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode);

        const apply = (theme: "light" | "dark") => {
            document.documentElement.classList.toggle("dark", theme === "dark");
            setResolved(theme);
        };

        if (mode === "system") {
            const mql = window.matchMedia("(prefers-color-scheme: dark)");
            apply(mql.matches ? "dark" : "light");
            const onChange = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
            mql.addEventListener("change", onChange);
            return () => mql.removeEventListener("change", onChange);
        }

        apply(mode);
    }, [mode]);

    const value = useMemo(() => ({ mode, setMode, resolved }), [mode, resolved]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}