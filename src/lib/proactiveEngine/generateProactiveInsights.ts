import { MAX_PROACTIVE_INSIGHTS } from "./constants";
import { calculateBalanceScore } from "./calculateBalanceScore";
import { detectOverload } from "./detectOverload";
import { detectRepeatedPostponements } from "./detectRepeatedPostponements";
import { formatDurationHours } from "./timeUtils";
import type {
  DayAnalysisInput,
  ProactiveAnalysisResult,
  ProactiveInsight,
  ProactiveInsightSeverity,
  ProactiveInsightType,
} from "./types";

const INSIGHT_PRIORITY: Record<ProactiveInsightType, number> = {
  overload: 3,
  sleep: 2,
  postponement: 4,
  personal_time: 5,
  sport: 6,
  planning: 7,
};

const SEVERITY_PRIORITY: Record<ProactiveInsightSeverity, number> = {
  critical: 1,
  warning: 2,
  info: 3,
};

function hasSufficientData(input: DayAnalysisInput): boolean {
  return input.scheduledItems.length > 0 || input.sleep?.plannedHours != null;
}

function sortInsights(insights: ProactiveInsight[]): ProactiveInsight[] {
  return [...insights].sort((a, b) => {
    const severityDiff = SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return INSIGHT_PRIORITY[a.type] - INSIGHT_PRIORITY[b.type];
  });
}

function dedupeInsights(insights: ProactiveInsight[]): ProactiveInsight[] {
  const seen = new Set<string>();
  const result: ProactiveInsight[] = [];
  for (const insight of insights) {
    const key = `${insight.type}:${insight.reason.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(insight);
  }
  return result;
}

function buildSleepInsight(input: DayAnalysisInput): ProactiveInsight | null {
  const minimumSleep = input.userPreferences?.minimumSleepHours ?? 7;
  const sleepHours = input.sleep?.actualHours ?? input.sleep?.plannedHours;
  if (sleepHours == null || sleepHours >= minimumSleep) return null;

  const severity: ProactiveInsightSeverity =
    sleepHours < 6 ? "critical" : "warning";

  return {
    id: "sleep-insufficient",
    type: "sleep",
    severity,
    title: "Sommeil limité",
    message: `Tu as prévu moins de ${minimumSleep} h de sommeil. Alléger la fin de journée permettrait de préserver ton repos.`,
    reason: `Sommeil estimé : ${sleepHours} h.`,
    suggestedAction: {
      type: "review_evening",
      label: "Revoir la fin de journée",
    },
  };
}

function buildOverloadInsights(
  overload: ReturnType<typeof detectOverload>,
): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  const durationReason = overload.reasons.find(
    (reason) =>
      reason.code === "planned_duration_too_high" ||
      reason.code === "planned_duration_elevated",
  );
  if (durationReason) {
    insights.push({
      id: "overload-duration",
      type: "overload",
      severity: durationReason.severity,
      title: "Charge élevée",
      message: `Ta journée contient environ ${formatDurationHours(overload.totalPlannedMinutes)} d'activités planifiées. Je te conseille de déplacer une tâche non urgente.`,
      reason: durationReason.explanation,
      suggestedAction: {
        type: "defer_non_urgent",
        label: "Repérer une tâche secondaire",
      },
    });
  }

  const overlapReason = overload.reasons.find((reason) => reason.code === "schedule_overlap");
  if (overlapReason) {
    insights.push({
      id: "overload-overlap",
      type: "overload",
      severity: overlapReason.severity,
      title: "Chevauchement",
      message:
        "Deux activités se chevauchent. Ajuster l'horaire d'une d'elles clarifierait ta journée.",
      reason: overlapReason.explanation,
      suggestedAction: {
        type: "resolve_overlap",
        label: "Vérifier les horaires",
      },
    });
  }

  const lateEndReason = overload.reasons.find((reason) => reason.code === "late_day_end");
  if (lateEndReason) {
    insights.push({
      id: "planning-late-end",
      type: "planning",
      severity: "warning",
      title: "Fin de journée tardive",
      message:
        "Tu as beaucoup d'activités prévues en fin de journée. Déplacer une tâche secondaire permettrait de terminer plus tôt.",
      reason: lateEndReason.explanation,
      suggestedAction: {
        type: "move_secondary_task",
        label: "Envisager un report léger",
      },
    });
  }

  const lateSleepReason = overload.reasons.find(
    (reason) => reason.code === "late_activity_incompatible_with_sleep",
  );
  if (lateSleepReason) {
    insights.push({
      id: "sleep-late-activity",
      type: "sleep",
      severity: "critical",
      title: "Activité tardive",
      message:
        "Une activité en fin de soirée pourrait réduire ton temps de repos. Alléger cette fin de journée serait plus compatible avec ton sommeil.",
      reason: lateSleepReason.explanation,
      suggestedAction: {
        type: "shorten_evening",
        label: "Alléger le soir",
      },
    });
  }

  if (
    !durationReason &&
    !overlapReason &&
    overload.reasons.some((reason) => reason.code === "missing_breaks")
  ) {
    insights.push({
      id: "planning-breaks",
      type: "planning",
      severity: "info",
      title: "Pauses limitées",
      message:
        "Ta journée enchaîne plusieurs blocs sans pause visible. Un court intervalle pourrait la rendre plus soutenable.",
      reason: "Peu de pauses entre les activités.",
      suggestedAction: {
        type: "add_buffer",
        label: "Prévoir une pause",
      },
    });
  }

  return insights;
}

function buildPostponementInsights(
  postponements: ReturnType<typeof detectRepeatedPostponements>,
): ProactiveInsight[] {
  return postponements.items.slice(0, 2).map((item) => ({
    id: `postponement-${item.taskId}`,
    type: "postponement" as const,
    severity: item.severity,
    title: "Tâche reportée",
    message: item.message,
    reason: `${item.count} report(s) enregistré(s).`,
    suggestedAction: {
      type: "reschedule_task",
      label: "Repenser le créneau",
      payload: { taskId: item.taskId },
    },
  }));
}

function buildPersonalTimeInsight(input: DayAnalysisInput): ProactiveInsight | null {
  const minimum =
    input.userPreferences?.minimumPersonalTimeMinutes ?? 60;
  const personalTime = input.personalTimeMinutes ?? 0;
  if (personalTime >= minimum) return null;

  return {
    id: "personal-time-low",
    type: "personal_time",
    severity: personalTime === 0 ? "warning" : "info",
    title: "Peu de temps pour toi",
    message:
      "Peu de moments personnels sont prévus aujourd'hui. Même 30 minutes libres peuvent aider à respirer.",
    reason: `${personalTime} min de temps personnel estimé.`,
    suggestedAction: {
      type: "protect_personal_time",
      label: "Protéger un créneau",
    },
  };
}

function buildSportInsight(input: DayAnalysisInput): ProactiveInsight | null {
  const sportMinutes = input.sportMinutes ?? 0;
  if (sportMinutes > 0) return null;

  const minimumWeekly = input.userPreferences?.minimumSportMinutesPerWeek ?? 90;
  if (minimumWeekly <= 0) return null;

  return {
    id: "sport-missing",
    type: "sport",
    severity: "info",
    title: "Sport",
    message:
      "Aucune séance de sport n'est prévue aujourd'hui. Un créneau court reste une option si tu en as l'énergie.",
    reason: "Pas de bloc sport dans la journée.",
    suggestedAction: {
      type: "plan_sport",
      label: "Envisager une séance courte",
    },
  };
}

export function generateProactiveInsights(input: DayAnalysisInput): ProactiveAnalysisResult {
  if (!hasSufficientData(input)) {
    return {
      date: input.date,
      balanceScore: null,
      overload: null,
      postponements: null,
      insights: [],
      hasSufficientData: false,
    };
  }

  const overload = detectOverload(input);
  const postponements = detectRepeatedPostponements(input);
  const balanceScore = calculateBalanceScore(input);

  const candidates: ProactiveInsight[] = [
    ...buildOverloadInsights(overload),
    buildSleepInsight(input),
    ...buildPostponementInsights(postponements),
    buildPersonalTimeInsight(input),
    buildSportInsight(input),
  ].filter((insight): insight is ProactiveInsight => insight != null);

  const insights = sortInsights(dedupeInsights(candidates)).slice(
    0,
    MAX_PROACTIVE_INSIGHTS,
  );

  return {
    date: input.date,
    balanceScore,
    overload,
    postponements,
    insights,
    hasSufficientData: true,
  };
}
