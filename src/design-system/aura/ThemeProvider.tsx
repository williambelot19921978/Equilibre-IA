import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AuraThemeMode } from "./brand";
import {
  applyThemeMode,
  persistThemeMode,
  readStoredThemeMode,
  resolveEffectiveTheme,
  subscribeSystemTheme,
} from "./themeStore";

type ThemeContextValue = {
  mode: AuraThemeMode;
  effective: "light" | "dark";
  setMode: (mode: AuraThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AuraThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AuraThemeMode>(() => readStoredThemeMode());
  const [effective, setEffective] = useState<"light" | "dark">(() => resolveEffectiveTheme(readStoredThemeMode()));

  const setMode = useCallback((next: AuraThemeMode) => {
    persistThemeMode(next);
    setModeState(next);
    setEffective(applyThemeMode(next));
  }, []);

  useEffect(() => {
    setEffective(applyThemeMode(mode));
  }, [mode]);

  useEffect(() => subscribeSystemTheme((theme) => setEffective(theme)), []);

  const value = useMemo(() => ({ mode, effective, setMode }), [mode, effective, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAuraTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAuraTheme must be used within AuraThemeProvider");
  }
  return ctx;
}

/** Non-throwing hook for settings outside strict provider (tests). */
export function useAuraThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
