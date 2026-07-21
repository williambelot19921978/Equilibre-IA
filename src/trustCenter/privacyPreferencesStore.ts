/**
 * EPIC 8A — Privacy preferences (localStorage).
 */

import {
  DEFAULT_PRIVACY_PREFERENCES,
  type PrivacyPreferenceKey,
  type PrivacyPreferences,
} from "./types";

const PREFIX = "aura-privacy-prefs-";

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function getPrivacyPreferences(userId: string): PrivacyPreferences {
  if (typeof localStorage === "undefined") return { ...DEFAULT_PRIVACY_PREFERENCES };
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { ...DEFAULT_PRIVACY_PREFERENCES };
    return { ...DEFAULT_PRIVACY_PREFERENCES, ...(JSON.parse(raw) as Partial<PrivacyPreferences>) };
  } catch {
    return { ...DEFAULT_PRIVACY_PREFERENCES };
  }
}

export function setPrivacyPreference(
  userId: string,
  prefKey: PrivacyPreferenceKey,
  enabled: boolean,
): PrivacyPreferences {
  const next = { ...getPrivacyPreferences(userId), [prefKey]: enabled };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key(userId), JSON.stringify(next));
  }
  return next;
}

export function clearPrivacyPreferences(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key(userId));
}

export const PRIVACY_PREFERENCE_LABELS: Record<
  PrivacyPreferenceKey,
  { label: string; description: string }
> = {
  useHistory: {
    label: "Utiliser mon historique",
    description: "Permet à Aura de tenir compte de vos actions passées pour contextualiser les suggestions.",
  },
  learnHabits: {
    label: "Apprendre de mes habitudes",
    description: "Aura observe des régularités (horaires, préférences) pour affiner ses propositions.",
  },
  useCheckins: {
    label: "Utiliser mes check-ins",
    description: "Votre ressenti quotidien peut influencer le rythme des recommandations.",
  },
  personalizedAdvice: {
    label: "Recevoir des conseils personnalisés",
    description: "Active le coach et les suggestions adaptées à votre profil.",
  },
  shareAnalytics: {
    label: "Partager des métriques d'usage anonymes",
    description: "Aide Aura à améliorer le produit en bêta. Aucun contenu personnel n'est collecté.",
  },
};
