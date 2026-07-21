/**
 * EPIC 9 — Changelog / Quoi de neuf ?
 */

export type ChangelogEntryKind = "feature" | "fix" | "improvement";

export type ChangelogEntry = {
  readonly id: string;
  readonly version: string;
  readonly date: string;
  readonly kind: ChangelogEntryKind;
  readonly title: string;
  readonly description: string;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "9-beta-readiness",
    version: "1.0.0-beta.1",
    date: "2026-07-21",
    kind: "feature",
    title: "Préparation bêta privée",
    description: "Checklist de lancement, mode bêta, changelog et page d'erreur Aura.",
  },
  {
    id: "8b-insights",
    version: "1.0.0-beta.1",
    date: "2026-07-21",
    kind: "feature",
    title: "Aura Insights",
    description: "Analytics anonymisés et dashboard admin pour mesurer l'adoption.",
  },
  {
    id: "8a-trust",
    version: "1.0.0-beta.1",
    date: "2026-07-21",
    kind: "feature",
    title: "Trust Center",
    description: "Confiance & confidentialité : export, suppression, transparence IA.",
  },
  {
    id: "7c-brand",
    version: "1.0.0-beta.1",
    date: "2026-07-21",
    kind: "improvement",
    title: "Identité Aura",
    description: "Design system, thème clair/sombre, logo et accueil premium.",
  },
  {
    id: "7b-mobile",
    version: "1.0.0-beta.1",
    date: "2026-07-17",
    kind: "improvement",
    title: "Fiabilité mobile",
    description: "PWA, mode hors ligne, notifications et synchronisation.",
  },
  {
    id: "7a-polish",
    version: "1.0.0-beta.1",
    date: "2026-07-17",
    kind: "fix",
    title: "Onboarding premium",
    description: "Parcours d'accueil fluide et paramètres centralisés.",
  },
];

export function getChangelogForVersion(version?: string): ChangelogEntry[] {
  if (!version) return CHANGELOG;
  return CHANGELOG.filter((entry) => entry.version === version);
}

export function getLatestChangelogVersion(): string {
  return CHANGELOG[0]?.version ?? "1.0.0-beta.1";
}

const SEEN_KEY = "aura-changelog-seen";

export function markChangelogSeen(version: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SEEN_KEY, version);
}

export function hasUnseenChangelog(currentVersion: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SEEN_KEY) !== currentVersion;
}
