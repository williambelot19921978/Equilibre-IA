/**
 * EPIC 6A — Action Engine guards (validated preferences only).
 */

import type { DetectedHabit, PreferenceProposal } from "../types/adaptiveTypes";

export function getValidatedPreferencesOnly(
  preferences: readonly PreferenceProposal[],
): PreferenceProposal[] {
  return preferences.filter((pref) => pref.status === "accepted");
}

export function isRejectedPreference(
  preferences: readonly PreferenceProposal[],
  kind: PreferenceProposal["kind"],
  value: string,
): boolean {
  return preferences.some(
    (pref) =>
      pref.status === "rejected" && pref.kind === kind && pref.proposedValue === value,
  );
}

export function shouldUsePreferenceForRecommendation(input: {
  preference: PreferenceProposal;
  allPreferences: readonly PreferenceProposal[];
}): boolean {
  if (input.preference.status !== "accepted") return false;
  if (isRejectedPreference(input.allPreferences, input.preference.kind, input.preference.proposedValue)) {
    return false;
  }
  return input.preference.confidence >= 0.5;
}

export function strongHabits(habits: readonly DetectedHabit[]): DetectedHabit[] {
  return habits.filter((habit) => habit.score >= 70 && habit.evolution !== "abandoned");
}

export function recommendationConfidenceFromPreferences(input: {
  validatedPreferences: readonly PreferenceProposal[];
  habits: readonly DetectedHabit[];
}): number {
  const strong = strongHabits(input.habits);
  const prefBoost =
    input.validatedPreferences.length > 0
      ? input.validatedPreferences.reduce((sum, pref) => sum + pref.confidence, 0) /
        input.validatedPreferences.length
      : 0;
  const habitBoost = strong.length > 0 ? strong[0]!.score / 100 : 0;
  return Math.min(0.95, Math.max(0.3, prefBoost * 0.6 + habitBoost * 0.4));
}
