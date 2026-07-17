import type { PlanningContext } from "./memoryEngine";
import type {
  LifeEnergyPrediction,
  LifeFamilySituation,
} from "../types/lifeContext";
import type {
  EveningActivityBlock,
  EveningActivityType,
  EveningOpportunityResult,
  EveningPlanningMode,
} from "../types/eveningPlanning";
import { addMinutesToIso, getDurationMinutes } from "../lib/time/daySchedule";
import { resolveSuggestedActivityDuration } from "../lib/planning/resolveSuggestedActivityDuration";
import type { DailyActivityCompletionState, DailyActivityUsage } from "../lib/planning/dailyActivityCompletionState";
import { canProposeCategoryAutomatically } from "../lib/planning/dailyActivityCompletionState";

const MAX_EVENING_ACTIVITIES = 1;
const WIND_DOWN_MINUTES = 20;
const MIN_KEPT_FREE_MINUTES = 45;

export type EveningOpportunityInput = {
  eveningStart: string;
  eveningEnd: string;
  workDay: boolean;
  restDay: boolean;
  energyPrediction: LifeEnergyPrediction;
  afterWorkEnergy?: string;
  mainPriority?: string | null;
  studiesActive?: boolean;
  preferredFocusMinutes?: number;
  sportPossible: boolean;
  workoutCompletedToday?: boolean;
  daysSinceSport?: number;
  faithImportance?: string;
  restPreferences: string[];
  familySituation: LifeFamilySituation;
  partnerPresent: boolean;
  eveningPlanningMode: EveningPlanningMode;
  activityCompletion?: DailyActivityCompletionState;
  activityUsage?: DailyActivityUsage;
};

type ActivityCandidate = {
  type: EveningActivityType;
  title: string;
  durationMinutes: number;
  reason: string;
  score: number;
};

function maxActivitiesForSlot(_totalMinutes: number): number {
  return MAX_EVENING_ACTIVITIES;
}

function buildActivityCandidates(input: EveningOpportunityInput): ActivityCandidate[] {
  const total = getDurationMinutes(input.eveningStart, input.eveningEnd);
  if (total < 20) return [];

  const completion = input.activityCompletion ?? {
    workoutDone: input.workoutCompletedToday ?? false,
    studyDone: false,
    spiritualDone: false,
    familyTimeDone: false,
    coupleTimeDone: false,
    restDone: false,
    priorityTaskDone: false,
  };

  const usage: DailyActivityUsage =
    input.activityUsage ??
    ({
      ...completion,
      sportAutomaticCount: completion.workoutDone ? 1 : 0,
      studyCount: 0,
      lastStudyAt: null,
      readingCount: 0,
      calmCount: 0,
      lastCalmAt: null,
      spiritualCount: 0,
      coupleCount: 0,
      familyCount: 0,
      leisureCount: 0,
      restCount: 0,
    } satisfies DailyActivityUsage);

  const canPropose = (category: Parameters<typeof canProposeCategoryAutomatically>[0]["category"]) =>
    canProposeCategoryAutomatically({
      category,
      usage,
      slotStartsAt: input.eveningStart,
    });

  const tired =
    input.energyPrediction === "low" ||
    input.afterWorkEnergy === "low" ||
    input.familySituation === "parent_alone";
  const lightOnly = tired || input.familySituation === "parent_alone";
  const studyPriority =
    !lightOnly &&
    canPropose("study") &&
    (input.mainPriority === "studies" || input.studiesActive === true);
  const sportStale =
    input.sportPossible &&
    canPropose("sport") &&
    (input.daysSinceSport === undefined || input.daysSinceSport >= 3);
  const spiritualOk =
    input.faithImportance !== undefined && input.faithImportance !== "disabled";

  const candidates: ActivityCandidate[] = [];

  if (studyPriority) {
    const focus = input.preferredFocusMinutes ?? 25;
    candidates.push({
      type: "study",
      title: "Révision",
      durationMinutes: Math.min(focus, 35),
      reason: `Je te propose ${focus} minutes de révision car ta formation est ta priorité actuelle.`,
      score: 90,
    });
  } else if (tired) {
    candidates.push({
      type: "calm",
      title: "Temps calme",
      durationMinutes: 25,
      reason: "Ta journée a été longue, je privilégie un temps calme.",
      score: 85,
    });
  } else if (input.restPreferences.includes("lecture")) {
    candidates.push({
      type: "reading",
      title: "Lecture",
      durationMinutes: 25,
      reason: "Lecture légère — compatible avec une fin de journée sereine.",
      score: 70,
    });
  }

  if (sportStale && !lightOnly) {
    const hour = new Date(input.eveningStart).getHours();
    if (hour < 21) {
      candidates.push({
        type: "sport",
        title: "Sport court / mobilité",
        durationMinutes: 15,
        reason:
          "Tu n'as pas fait de sport depuis plusieurs jours, mais il est tard : je propose seulement 15 minutes de mobilité.",
        score: 75,
      });
    }
  }

  if (spiritualOk && input.faithImportance === "important" && !lightOnly && canPropose("spiritual")) {
    candidates.push({
      type: "spiritual",
      title: "Moment spirituel",
      durationMinutes: 15,
      reason: "Proposition facultative selon tes préférences spirituelles.",
      score: 60,
    });
  }

  if (
    input.partnerPresent &&
    input.familySituation === "normal" &&
    !tired &&
    canPropose("couple") &&
    total >= 120
  ) {
    const coupleDuration = resolveSuggestedActivityDuration({
      activityType: "couple",
      freeSlotDuration: total,
      energy: input.energyPrediction,
    });
    candidates.push({
      type: "couple",
      title: "Moment en couple — soirée disponible",
      durationMinutes: coupleDuration,
      reason: "Profiter de cette soirée ensemble, sans surcharge d'activités.",
      score: 85,
    });
  }

  if (!lightOnly && input.restDay) {
    candidates.push({
      type: "leisure",
      title: "Loisir / détente",
      durationMinutes: 30,
      reason: "Jour de repos — un moment de détente semble adapté.",
      score: 55,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function packEveningBlocks(
  candidates: ActivityCandidate[],
  eveningStart: string,
  eveningEnd: string,
  _maxActivities: number,
): EveningActivityBlock[] {
  const usableEnd = addMinutesToIso(eveningEnd, -WIND_DOWN_MINUTES);
  const totalUsable = getDurationMinutes(eveningStart, usableEnd);

  if (totalUsable < 15 || candidates.length === 0) return [];

  const topCandidate = candidates[0]!;
  const durationMinutes = Math.min(topCandidate.durationMinutes, totalUsable);
  const endsAt = addMinutesToIso(eveningStart, durationMinutes);

  const packed: EveningActivityBlock[] = [
    {
      id: `evening-${topCandidate.type}-${eveningStart}`,
      type: topCandidate.type,
      title: topCandidate.title,
      startsAt: eveningStart,
      endsAt,
      durationMinutes,
      reason: topCandidate.reason,
      suggested: true,
    },
  ];

  const freeMinutes = getDurationMinutes(endsAt, usableEnd);
  if (freeMinutes >= 15) {
    packed.push({
      id: `evening-keep-free-${endsAt}`,
      type: "keep_free",
      title: "Temps libre conservé",
      startsAt: endsAt,
      endsAt: usableEnd,
      durationMinutes: freeMinutes,
      reason: "Le reste de la soirée reste libre — sans obligation.",
      suggested: false,
    });
  }

  packed.push({
    id: `evening-wind-down-${usableEnd}`,
    type: "wind_down",
    title: "Préparation au coucher",
    startsAt: usableEnd,
    endsAt: eveningEnd,
    durationMinutes: WIND_DOWN_MINUTES,
    reason: "Marge de préparation avant ton heure de coucher.",
    suggested: false,
  });

  return packed;
}

export function resolveEveningOpportunity(
  input: EveningOpportunityInput,
): EveningOpportunityResult {
  const totalMinutes = getDurationMinutes(input.eveningStart, input.eveningEnd);

  if (totalMinutes < 20 || input.eveningPlanningMode === "disabled") {
    return {
      totalMinutes,
      plannedMinutes: 0,
      keptFreeMinutes: totalMinutes,
      fillRatio: 0,
      blocks: [],
      summary:
        input.eveningPlanningMode === "disabled"
          ? "Planification du soir désactivée — ce temps reste libre."
          : "Créneau du soir trop court pour une proposition structurée.",
    };
  }

  const maxActivities = maxActivitiesForSlot(totalMinutes);
  const tired =
    input.energyPrediction === "low" ||
    input.afterWorkEnergy === "low" ||
    input.familySituation === "parent_alone";

  const effectiveMax = tired || input.familySituation === "parent_alone" ? 1 : maxActivities;
  const candidates = buildActivityCandidates(input);
  const blocks = packEveningBlocks(
    candidates,
    input.eveningStart,
    input.eveningEnd,
    effectiveMax,
  );

  const activityBlocks = blocks.filter(
    (b) => b.type !== "keep_free" && b.type !== "wind_down",
  );
  const plannedMinutes = activityBlocks.reduce((s, b) => s + b.durationMinutes, 0);
  const keptFreeMinutes = blocks
    .filter((b) => b.type === "keep_free")
    .reduce((s, b) => s + b.durationMinutes, 0);
  const fillRatio = totalMinutes > 0 ? plannedMinutes / totalMinutes : 0;
  const automatic = input.eveningPlanningMode === "automatic";

  return {
    totalMinutes,
    plannedMinutes,
    keptFreeMinutes: Math.max(keptFreeMinutes, MIN_KEPT_FREE_MINUTES),
    fillRatio,
    blocks: blocks.map((block) => ({
      ...block,
      suggested:
        automatic ? false : block.type !== "keep_free" && block.type !== "wind_down",
    })),
    summary:
      activityBlocks.length === 0
        ? "Soirée libre après le coucher des enfants — aucune activité imposée."
        : automatic
          ? `${activityBlocks.length} activité(s) ce soir — le reste reste libre.`
          : `${activityBlocks.length} suggestion(s) pour ton soir — rien n'est imposé.`,
  };
}

export function buildEveningOpportunityInput({
  eveningStart,
  eveningEnd,
  context,
  lifeContext,
  eveningPlanningMode,
  daysSinceSport,
}: {
  eveningStart: string;
  eveningEnd: string;
  context: PlanningContext;
  lifeContext: {
    workDay: boolean;
    restDay: boolean;
    energyPrediction: LifeEnergyPrediction;
    familySituation: LifeFamilySituation;
    partnerPresent: boolean;
    sportPossible: boolean;
    studyPossible: boolean;
    workoutCompletedToday?: boolean;
    priority: string | null;
    activityCompletion?: DailyActivityCompletionState;
    activityUsage?: DailyActivityUsage;
  };
  eveningPlanningMode: EveningPlanningMode;
  daysSinceSport?: number;
}): EveningOpportunityInput {
  return {
    eveningStart,
    eveningEnd,
    workDay: lifeContext.workDay,
    restDay: lifeContext.restDay,
    energyPrediction: lifeContext.energyPrediction,
    afterWorkEnergy: context.profile.afterWorkEnergy,
    mainPriority: lifeContext.priority ?? context.mainPriority,
    studiesActive: lifeContext.studyPossible,
    preferredFocusMinutes: context.profile.preferredFocusMinutes,
    sportPossible: lifeContext.sportPossible,
    workoutCompletedToday: lifeContext.workoutCompletedToday,
    daysSinceSport,
    faithImportance: context.profile.faithImportance,
    restPreferences: context.profile.restPreferences,
    familySituation: lifeContext.familySituation,
    partnerPresent: lifeContext.partnerPresent,
    eveningPlanningMode,
    activityCompletion: lifeContext.activityCompletion,
    activityUsage: lifeContext.activityUsage,
  };
}
