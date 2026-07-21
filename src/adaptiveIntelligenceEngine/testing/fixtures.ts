/**
 * EPIC 6A — Jeux de données pour tests adaptatifs.
 */

import type { BehaviorObservation, PreferenceProposal } from "../types/adaptiveTypes";

const BASE = "2026-07-01T00:00:00.000Z";

function obs(
  index: number,
  label: string,
  metadata: Record<string, unknown> = {},
  type: BehaviorObservation["type"] = "repeated",
): BehaviorObservation {
  const day = Math.floor(index / 3);
  return {
    id: `fixture-obs-${index}`,
    timestamp: new Date(Date.parse(BASE) + day * 24 * 60 * 60 * 1000 + index * 3600_000).toISOString(),
    source: "calendar",
    type,
    confidence: 0.75,
    label,
    metadata,
  };
}

/** Utilisateur régulier — sport à 18:30, travail à 09:00. */
export const REGULAR_USER_OBSERVATIONS: BehaviorObservation[] = [
  ...Array.from({ length: 12 }, (_, index) =>
    obs(index, `Sport observé à 18:30`, { kind: "sport", hour: "18:30", category: "sport" }),
  ),
  ...Array.from({ length: 10 }, (_, index) =>
    obs(index + 20, `travail à 09:00 — « Sprint »`, {
      category: "travail",
      hour: "09:00",
    }),
  ),
];

/** Utilisateur irrégulier — horaires dispersés. */
export const IRREGULAR_USER_OBSERVATIONS: BehaviorObservation[] = [
  obs(0, "Sport observé à 07:00", { kind: "sport", hour: "07:00" }),
  obs(1, "Sport observé à 19:45", { kind: "sport", hour: "19:45" }),
  obs(2, "Sport observé à 12:00", { kind: "sport", hour: "12:00" }),
  obs(3, "travail à 14:00 — « Réunion »", { category: "travail", hour: "14:00" }),
];

/** Nouvelle habitude — peu d'occurrences récentes. */
export const NEW_HABIT_OBSERVATIONS: BehaviorObservation[] = [
  obs(0, "Sport observé à 18:30", { kind: "sport", hour: "18:30" }),
  obs(1, "Sport observé à 18:30", { kind: "sport", hour: "18:30" }),
];

/** Ancienne habitude — longue période, forte fréquence. */
export const OLD_HABIT_OBSERVATIONS: BehaviorObservation[] = Array.from({ length: 20 }, (_, index) =>
  obs(index, "Sport observé à 18:30", { kind: "sport", hour: "18:30" }),
);

/** Habitude abandonnée — une seule occurrence ancienne. */
export const ABANDONED_HABIT_OBSERVATIONS: BehaviorObservation[] = [
  obs(0, "Sport observé à 18:30", { kind: "sport", hour: "18:30" }),
];

export function buildRejectedPreference(): PreferenceProposal {
  return {
    id: "pref-rejected-1",
    kind: "sport",
    label: "Sport préféré : 07:00",
    proposedValue: "07:00",
    status: "rejected",
    confidence: 0.55,
    explainability: {
      why: "2 occurrences analysées.",
      dataUsed: ["Sport observé à 07:00"],
      observationCount: 2,
      periodDays: 3,
      confidenceLevel: 0.55,
      formula: "confidence = ratio*0.45 + boosts",
    },
    habitId: `habit-sport-07:00`,
    createdAt: BASE,
    updatedAt: BASE,
    validatedAt: BASE,
  };
}

export function buildValidatedPreference(): PreferenceProposal {
  return {
    id: "pref-validated-1",
    kind: "sport",
    label: "Sport préféré : 18:30",
    proposedValue: "18:30",
    status: "accepted",
    confidence: 0.89,
    explainability: {
      why: "12 occurrences sur 15 périodes analysées.",
      dataUsed: ["Sport observé à 18:30"],
      observationCount: 12,
      periodDays: 14,
      confidenceLevel: 0.89,
      formula: "confidence = ratio*0.45 + boosts",
    },
    habitId: "habit-sport-18:30",
    createdAt: BASE,
    updatedAt: BASE,
    validatedAt: BASE,
  };
}

export const ALL_PROFILES = [
  { id: "regular", label: "Utilisateur régulier", observations: REGULAR_USER_OBSERVATIONS },
  { id: "irregular", label: "Utilisateur irrégulier", observations: IRREGULAR_USER_OBSERVATIONS },
  { id: "new-habit", label: "Nouvelle habitude", observations: NEW_HABIT_OBSERVATIONS },
  { id: "old-habit", label: "Ancienne habitude", observations: OLD_HABIT_OBSERVATIONS },
  { id: "abandoned", label: "Habitude abandonnée", observations: ABANDONED_HABIT_OBSERVATIONS },
] as const;
