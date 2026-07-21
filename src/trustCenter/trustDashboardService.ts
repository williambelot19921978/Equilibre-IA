/**
 * EPIC 8A — Trust dashboard aggregation (read-only).
 */

import { clearObservations, getObservations } from "../adaptiveIntelligenceEngine/observation/observationStore";
import { getAllPreferences } from "../adaptiveIntelligenceEngine/preference/preferenceStore";
import { getStateHistory } from "../dailyStateEngine/store/dailyStateStore";
import { buildLifeKnowledgeDiagnostics } from "../lifeKnowledgeEngine";
import { getSyncMeta } from "../mobileReliability/sync/syncStatusStore";
import { defaultNotificationEngine } from "../mobileReliability/notifications/notificationEngine";
import { getPrivacyPreferences } from "./privacyPreferencesStore";
import type { TrustDashboardSnapshot } from "./types";

function countDailyBriefKeys(userId: string): number {
  if (typeof localStorage === "undefined") return 0;
  let count = 0;
  const prefix = `daily-brief-dismissed-${userId}-`;
  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);
    if (storageKey?.startsWith(prefix)) count += 1;
  }
  return count;
}

function resolveDataCategories(userId: string): string[] {
  const prefs = getPrivacyPreferences(userId);
  const categories: string[] = ["Profil"];
  if (prefs.useCheckins) categories.push("Check-in");
  if (prefs.useHistory) categories.push("Historique");
  if (prefs.learnHabits) categories.push("Habitudes");
  if (prefs.personalizedAdvice) categories.push("Conseils personnalisés");
  if (getAllPreferences(userId).length > 0) categories.push("Préférences apprises");
  return categories;
}

function resolveLastBackupAt(userId: string, lastSyncAt: string | null): string | null {
  const states = getStateHistory(userId);
  const stateUpdated = states[0]?.updatedAt ?? states[0]?.date ?? null;
  if (lastSyncAt && stateUpdated) {
    return lastSyncAt > stateUpdated ? lastSyncAt : stateUpdated;
  }
  return lastSyncAt ?? stateUpdated;
}

export async function buildTrustDashboard(
  userId: string,
  date: string,
): Promise<TrustDashboardSnapshot> {
  const syncMeta = getSyncMeta(userId);
  const checkins = getStateHistory(userId);
  const lastCheckin = checkins[0] ?? null;

  let knowledgeCount = 0;
  try {
    const diagnostics = await buildLifeKnowledgeDiagnostics({ userId, date });
    knowledgeCount = diagnostics.knowledgeCount;
  } catch {
    knowledgeCount = 0;
  }

  const inboxCount = defaultNotificationEngine.getInbox(userId).length;
  const recommendationsCount =
    inboxCount + countDailyBriefKeys(userId) + getObservations(userId).length;

  const lastSyncAt = syncMeta.lastSyncedAt;
  const lastBackupAt = resolveLastBackupAt(userId, lastSyncAt);

  return {
    dataCategoriesUsedToday: resolveDataCategories(userId),
    lastCheckinAt: lastCheckin?.updatedAt ?? lastCheckin?.date ?? null,
    lastSyncAt,
    knowledgeCount,
    recommendationsCount,
    lastBackupAt,
    generatedAt: new Date().toISOString(),
  };
}

/** Used by deletion service — habits = observations + adaptive prefs */
export { clearObservations };
