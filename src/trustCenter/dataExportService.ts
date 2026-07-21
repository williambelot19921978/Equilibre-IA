/**
 * EPIC 8A — User data export (JSON / CSV / PDF summary).
 */

import { getAllPreferences } from "../adaptiveIntelligenceEngine/preference/preferenceStore";
import { getObservations } from "../adaptiveIntelligenceEngine/observation/observationStore";
import { getStateHistory } from "../dailyStateEngine/store/dailyStateStore";
import {
  buildLifeKnowledgeDiagnostics,
  getKnowledgeOverrides,
  getTimelineEvents,
} from "../lifeKnowledgeEngine";
import { getDailyCheckinPreference } from "../lib/preferences/dailyCheckinPreference";
import { listGoals } from "../lib/goals/goalsStorage";
import { getNotificationPreferences } from "../mobileReliability/notifications/notificationPreferencesStore";
import { getPrivacyPreferences } from "./privacyPreferencesStore";
import type { DataExportSection, UserDataExportBundle } from "./types";

export async function buildUserDataExport(
  userId: string,
  date: string,
  sections: DataExportSection[] = [
    "profile",
    "goals",
    "history",
    "checkins",
    "habits",
    "preferences",
  ],
): Promise<UserDataExportBundle> {
  const diagnostics = await buildLifeKnowledgeDiagnostics({ userId, date });

  return {
    exportedAt: new Date().toISOString(),
    userId,
    sections,
    profile: sections.includes("profile")
      ? {
          userId,
          exportNote: "Profil détaillé disponible dans Supabase pour les comptes connectés.",
        }
      : {},
    goals: sections.includes("goals") ? listGoals(userId) : [],
    checkins: sections.includes("checkins") ? getStateHistory(userId) : [],
    habits: sections.includes("habits")
      ? {
          observations: getObservations(userId),
          preferences: getAllPreferences(userId),
        }
      : {},
    preferences: sections.includes("preferences")
      ? {
          privacy: getPrivacyPreferences(userId),
          checkin: getDailyCheckinPreference(userId),
          notifications: getNotificationPreferences(userId),
        }
      : {},
    lifeKnowledge: {
      count: diagnostics.knowledgeCount,
      items: diagnostics.visibleItems,
      overrides: getKnowledgeOverrides(userId),
    },
    history: sections.includes("history")
      ? {
          timeline: getTimelineEvents(userId),
          checkinHistory: getStateHistory(userId),
        }
      : {},
  };
}

export function exportAsJson(bundle: UserDataExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function exportAsCsv(bundle: UserDataExportBundle): string {
  const rows: string[][] = [["section", "key", "value"]];

  for (const goal of bundle.goals as { id: string; name: string }[]) {
    rows.push(["goals", goal.id, goal.name]);
  }

  for (const state of bundle.checkins as { date: string; energy?: number }[]) {
    rows.push(["checkins", state.date, String(state.energy ?? "")]);
  }

  const prefs = bundle.preferences as { privacy?: Record<string, boolean> };
  if (prefs.privacy) {
    for (const [key, value] of Object.entries(prefs.privacy)) {
      rows.push(["preferences", key, String(value)]);
    }
  }

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function exportAsPdfSummary(bundle: UserDataExportBundle): string {
  const lines = [
    "Aura — Résumé de vos données",
    `Exporté le : ${bundle.exportedAt.slice(0, 16).replace("T", " ")}`,
    "",
    `Objectifs : ${(bundle.goals as unknown[]).length}`,
    `Check-ins : ${(bundle.checkins as unknown[]).length}`,
    `Connaissances Aura : ${(bundle.lifeKnowledge as { count?: number }).count ?? 0}`,
    "",
    "Sections incluses : " + bundle.sections.join(", "),
    "",
    "Ce document est un résumé. Pour l'export complet, utilisez le format JSON.",
  ];
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
