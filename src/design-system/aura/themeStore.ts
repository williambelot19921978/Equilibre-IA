import type { AuraThemeMode } from "../../design-system/aura/brand";
import { AURA_THEME_STORAGE_KEY } from "../../design-system/aura/brand";

const THEME_ATTR = "data-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredThemeMode(): AuraThemeMode {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(AURA_THEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveEffectiveTheme(mode: AuraThemeMode): "light" | "dark" {
  if (mode === "system") return getSystemTheme();
  return mode;
}

export function applyThemeMode(mode: AuraThemeMode): "light" | "dark" {
  const effective = resolveEffectiveTheme(mode);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(THEME_ATTR, effective);
    document.documentElement.dataset.auraThemeMode = mode;
  }
  return effective;
}

export function persistThemeMode(mode: AuraThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AURA_THEME_STORAGE_KEY, mode);
  applyThemeMode(mode);
}

export function initThemeFromStorage(): "light" | "dark" {
  return applyThemeMode(readStoredThemeMode());
}

export function subscribeSystemTheme(onChange: (theme: "light" | "dark") => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (readStoredThemeMode() === "system") {
      onChange(getSystemTheme());
    }
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
