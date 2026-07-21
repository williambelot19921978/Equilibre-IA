import type { LanguageMemoryContext, LanguageMemoryHint } from "./buildLanguageMemoryContext";

const MAX_HINTS = 3;

const HINT_PRIORITY = {
  mission: 1,
  living_insight: 2,
  behavior: 3,
  discovery: 4,
  declarative: 5,
} as const;

export function selectLanguageMemoryHints(
  context: LanguageMemoryContext | null | undefined,
  shownInsightIds: string[] = [],
): LanguageMemoryHint[] {
  if (!context?.hasSufficientData) return [];

  const shown = new Set(shownInsightIds);
  const candidates: LanguageMemoryHint[] = [];

  const missionText =
    context.living?.dailyMissionDescription ?? context.living?.dailyMissionTitle;
  if (missionText && !shown.has("mission-daily")) {
    candidates.push({
      id: "mission-daily",
      type: "mission",
      message: `Mission du jour : ${missionText}`,
      reason: "Mission générée par la mémoire comportementale.",
      priority: HINT_PRIORITY.mission,
    });
  }

  for (const insight of context.living?.topInsights ?? []) {
    const insightId = `insight-${insight.id}`;
    if (shown.has(insightId)) continue;
    candidates.push({
      id: insightId,
      type: "living_insight",
      message: `J'ai remarqué : ${insight.label.toLowerCase()} — ${insight.detail}`,
      reason: `Insight comportemental (confiance ${Math.round(insight.confidence * 100)} %).`,
      priority: HINT_PRIORITY.living_insight,
    });
  }

  if (context.behavior && context.behavior.counts.total >= 5) {
    if (context.behavior.skipRatePercent >= 25) {
      candidates.push({
        id: "behavior-skip-rate",
        type: "behavior",
        message: `Environ ${context.behavior.skipRatePercent} % de tes activités récentes ont été reportées.`,
        reason: "Agrégation des signaux task_activity_events.",
        priority: HINT_PRIORITY.behavior,
      });
    } else if (context.behavior.completionRatePercent >= 60) {
      candidates.push({
        id: "behavior-completion-rate",
        type: "behavior",
        message: `Tu completes régulièrement tes activités (${context.behavior.completionRatePercent} % sur ${context.behavior.windowDays} jours).`,
        reason: "Agrégation des signaux task_activity_events.",
        priority: HINT_PRIORITY.behavior,
      });
    }
  }

  if (!context.discovery.isComplete && context.discovery.remainingCount > 0) {
    candidates.push({
      id: "discovery-remaining",
      type: "discovery",
      message: `Il reste ${context.discovery.remainingCount} question(s) de découverte pour affiner mes conseils.`,
      reason: `Progression discovery : ${context.discovery.progressPercent} %.`,
      priority: HINT_PRIORITY.discovery,
    });
  }

  if (
    context.declarative.sleepNeededHours != null &&
    context.declarative.bedTime == null
  ) {
    candidates.push({
      id: "declarative-sleep-gap",
      type: "declarative",
      message: "Tu as indiqué un besoin de sommeil, mais pas encore d'heure de coucher habituelle.",
      reason: "Fact déclaratif incomplet dans le profil.",
      priority: HINT_PRIORITY.declarative,
    });
  }

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => a.priority - b.priority)
    .filter((hint) => {
      if (shown.has(hint.id)) return false;
      const key = `${hint.type}:${hint.message.slice(0, 48)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_HINTS);
}

export function formatLanguageMemoryPrefix(hints: LanguageMemoryHint[]): string {
  if (hints.length === 0) return "";
  return hints.map((hint) => hint.message).join("\n");
}
