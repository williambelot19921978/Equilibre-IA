/** EPIC 7C — Aura brand constants (user-facing). Internal package name may stay equilibre-ia. */

export const AURA_BRAND = {
  name: "Aura",
  tagline: "Votre assistant de vie, en calme et en clarté.",
  shortDescription: "Organisez votre temps avec élégance et sérénité.",
  mission:
    "Aura aide chaque personne à vivre des journées plus équilibrées, sans surcharge mentale.",
  vision: "Un compagnon discret qui comprend votre rythme et éclaire vos choix.",
  values: ["Clarté", "Sérénité", "Respect", "Transparence"],
} as const;

export type AuraThemeMode = "light" | "dark" | "system";

export const AURA_THEME_STORAGE_KEY = "aura-theme-mode";
