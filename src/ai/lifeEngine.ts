import type { PlanningContext } from "./memoryEngine";
import { getBedTime, getWakeTime } from "./memoryEngine";
import { getActivePeriodsForDate } from "./familyContextEngine";
import type { CalendarItemRecord } from "../types";
import type { DayConstraint } from "../types/planning";
import {
  combineDateAndTime,
  getDurationMinutes,
  parseTimeToMinutes,
} from "../lib/time/daySchedule";
import { resolveWorkFromPlanningContext } from "../lib/work/resolveWorkFromContext";
import type {
  LifeContext,
  LifeDayType,
  LifeEnergyPrediction,
  LifeFamilySituation,
  LifeProposal,
  ScoredFreeSlot,
} from "../types/lifeContext";
import { resolveBedTimeIso } from "../lib/time/bedTime";
import { splitLargeFreeGaps } from "../lib/planning/splitFreeSlots";
import { resolveWorkoutCompletionForDate } from "../lib/planning/hasCompletedWorkoutForDate";
import type { TaskActivityEventRecord } from "../types/taskActivity";
import { resolveCheckinPlanningImpact } from "../types/dailyCheckin";
import { getChildcareAdaptationMessage } from "../lib/family/childcareImpact";
import { resolveMorningWorkoutAutomaticallyAllowed } from "../lib/planning/resolveMorningWorkoutAutomaticallyAllowed";
import {
  resolveDailyActivityCompletionState,
  resolveDailyActivityUsage,
  type DailyActivityCompletionState,
  type DailyActivityUsage,
} from "../lib/planning/dailyActivityCompletionState";
import { generateLifeProposalsFromSlots } from "../lib/planning/slotActivitySuggestionEngine";

const DEFAULT_WORK_START = "09:00";
const DEFAULT_WORK_END = "17:00";

export type ResolveLifeContextInput = {
  date: string;
  context: PlanningContext;
  calendarItems?: CalendarItemRecord[];
  constraints?: DayConstraint[];
  workoutDetectionItems?: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
};

function hasTravelPeriod(context: PlanningContext, date: string): boolean {
  const periods = getActivePeriodsForDate(
    context.familyContext.activePeriods,
    date,
  );

  return periods.some(
    (period) =>
      period.context_type === "work_travel" &&
      (!period.user_id || period.user_id === context.currentUserId),
  );
}

function getWorkOverridesFromPeriods(
  context: PlanningContext,
  date: string,
): { workStart?: string; workEnd?: string } {
  const periods = getActivePeriodsForDate(
    context.familyContext.activePeriods,
    date,
  );
  const noon = new Date(`${date}T12:00:00`);

  for (const period of periods) {
    const start = new Date(period.starts_at).getTime();
    const end = new Date(period.ends_at).getTime();
    if (noon.getTime() < start || noon.getTime() > end) continue;

    if (
      period.impact?.workStartOverride ||
      period.impact?.workEndOverride
    ) {
      return {
        workStart: period.impact.workStartOverride,
        workEnd: period.impact.workEndOverride,
      };
    }
  }

  return {};
}

function hasSpecialPeriod(context: PlanningContext): boolean {
  return context.familyContext.activePeriods.some(
    (period) =>
      period.context_type === "family_event" ||
      period.context_type === "exceptional_work_hours" ||
      period.context_type === "exceptional_childcare" ||
      period.context_type === "other",
  );
}

export function determineDayType(input: ResolveLifeContextInput): {
  dayType: LifeDayType;
  reason: string;
} {
  const { date, context } = input;
  const fc = context.familyContext;

  if (fc.userVacation || fc.childrenVacation) {
    return {
      dayType: "VACATION",
      reason: fc.userVacation
        ? "Période de vacances utilisateur active."
        : "Vacances enfants — pas d'école ni de rythme scolaire.",
    };
  }

  if (hasTravelPeriod(context, date)) {
    return {
      dayType: "TRAVEL",
      reason: "Déplacement professionnel ou trajet long prévu aujourd'hui.",
    };
  }

  if (fc.soloParentWithChildren) {
    return {
      dayType: "PARENT_ALONE",
      reason: "Parent seul avec les enfants — charge réduite automatiquement.",
    };
  }

  const partnerAbsent = fc.activePeriods.some(
    (period) => period.context_type === "partner_absent",
  );

  if (partnerAbsent) {
    return {
      dayType: "PARENT_ALONE",
      reason: "Conjoint absent — journée adaptée en conséquence.",
    };
  }

  if (fc.disableWork) {
    return {
      dayType: "RESTDAY",
      reason: "Travail désactivé pour cette journée (contexte familial).",
    };
  }

  const workStatus = resolveWorkFromPlanningContext(context, date);

  if (workStatus.isWorkDay) {
    return {
      dayType: "WORKDAY",
      reason: workStatus.reason,
    };
  }

  if (workStatus.isCompensatoryRest) {
    return {
      dayType: "RESTDAY",
      reason: workStatus.reason,
    };
  }

  if (workStatus.isWeekendNonWork) {
    return {
      dayType: "WEEKEND",
      reason: "Week-end — pas de bloc travail imposé.",
    };
  }

  if (hasSpecialPeriod(context)) {
    return {
      dayType: "SPECIAL",
      reason: "Événement ou contexte familial particulier aujourd'hui.",
    };
  }

  return {
    dayType: "RESTDAY",
    reason: "Pas de travail prévu — journée orientée repos et temps pour toi.",
  };
}

function resolveFamilySituation(
  dayType: LifeDayType,
  context: PlanningContext,
): LifeFamilySituation {
  if (dayType === "VACATION") return "vacation";
  if (dayType === "TRAVEL") return "travel";
  if (dayType === "PARENT_ALONE") {
    return context.familyContext.soloParentWithChildren
      ? "parent_alone"
      : "partner_absent";
  }
  if (context.familyContext.childSick) return "child_sick";
  return "normal";
}

function predictEnergy(
  context: PlanningContext,
  dayType: LifeDayType,
): LifeEnergyPrediction {
  if (context.dailyCheckin) {
    const impact = resolveCheckinPlanningImpact(
      context.dailyCheckin.mood,
      context.dailyCheckin.intensity,
    );
    if (impact.energyLevel === "high") return "high";
    if (impact.energyLevel === "low") return "low";
    if (impact.energyLevel === "variable") return "variable";
    return "medium";
  }

  const afterWork = context.profile.afterWorkEnergy;

  if (dayType === "TRAVEL" || dayType === "PARENT_ALONE") {
    return "low";
  }

  if (dayType === "VACATION") {
    return "medium";
  }

  if (afterWork === "low") return "low";
  if (afterWork === "high") return "high";
  if (afterWork === "variable") return "variable";
  return "medium";
}

function computeMinutesFromConstraints(constraints: DayConstraint[]): {
  lockedMinutes: number;
  availableMinutes: number;
} {
  const blocking = constraints.filter(
    (constraint) =>
      constraint.type !== "wake" &&
      constraint.type !== "sleep" &&
      getDurationMinutes(constraint.startsAt, constraint.endsAt) > 0,
  );

  const lockedMinutes = blocking.reduce(
    (sum, constraint) =>
      sum + getDurationMinutes(constraint.startsAt, constraint.endsAt),
    0,
  );

  const wake = constraints.find((item) => item.type === "wake");
  const sleep = constraints.find((item) => item.type === "sleep");

  if (!wake || !sleep) {
    return { lockedMinutes, availableMinutes: Math.max(0, 960 - lockedMinutes) };
  }

  const daySpan = getDurationMinutes(wake.startsAt, sleep.startsAt);

  return {
    lockedMinutes,
    availableMinutes: Math.max(0, daySpan - lockedMinutes),
  };
}

function estimateDayMinutes(context: PlanningContext, workDay: boolean): number {
  const wake = parseTimeToMinutes(getWakeTime(context)) ?? 7 * 60;
  const bed = parseTimeToMinutes(getBedTime(context)) ?? 22 * 60;
  const span = bed > wake ? bed - wake : bed + 24 * 60 - wake;
  const commute = context.profile.commuteMinutes ?? 30;
  const { workStart, workEnd } = getEffectiveWorkHours(context);
  const workStartMin = parseTimeToMinutes(workStart) ?? 9 * 60;
  const workEndMin = parseTimeToMinutes(workEnd) ?? 17 * 60;
  const workBlock = Math.max(0, workEndMin - workStartMin);

  let locked = 0;
  if (workDay) {
    locked += commute * 2 + workBlock;
  } else {
    locked += Math.min(span, 8 * 60);
  }

  if (context.childrenCount > 0) {
    locked += context.profile.personalPrepMinutes ?? 0;
    locked += context.profile.morningDurationMinutes ?? 60;
    locked += 90;
  }

  return Math.max(0, span - locked);
}

export function scoreFreeSlot({
  slot,
  lifeContext,
}: {
  slot: {
    id: string;
    startsAt: string;
    endsAt: string;
    durationMinutes: number;
    slotKind: "day" | "evening_available";
  };
  lifeContext: Pick<
    LifeContext,
    "dayType" | "energyPrediction" | "workDay" | "vacation"
  >;
}): ScoredFreeSlot {
  const hour = new Date(slot.startsAt).getHours();
  let score = 50;
  const reasons: string[] = [];

  if (slot.slotKind === "evening_available") {
    score += 25;
    reasons.push("Créneau du soir après la routine enfants.");
  }

  if (hour >= 19) {
    score += 10;
    reasons.push("Fin de journée — favorise le calme.");
  } else if (hour < 12 && lifeContext.workDay) {
    score -= 15;
    reasons.push("Matinée de travail — créneau moins favorable.");
  }

  if (lifeContext.vacation) {
    score += 15;
    reasons.push("Vacances — plus de flexibilité.");
  }

  if (lifeContext.energyPrediction === "low") {
    score -= 10;
    reasons.push("Énergie basse prévue — formats courts préférés.");
  }

  if (slot.durationMinutes >= 45) {
    score += 10;
    reasons.push("Durée suffisante pour une activité utile.");
  }

  if (slot.durationMinutes < 20) {
    score -= 5;
    reasons.push("Créneau court — micro-activité seulement.");
  }

  return {
    ...slot,
    score: Math.max(0, Math.min(100, score)),
    scoreReason: reasons.join(" "),
  };
}

export function generateLifeProposals({
  lifeContext,
  context,
  activityCompletion,
  activityUsage,
}: {
  lifeContext: LifeContext;
  context: PlanningContext;
  activityCompletion?: DailyActivityCompletionState;
  activityUsage?: DailyActivityUsage;
}): LifeProposal[] {
  const usage =
    activityUsage ??
    lifeContext.activityUsage ??
    ({
      ...(activityCompletion ??
        lifeContext.activityCompletion ?? {
          workoutDone: lifeContext.workoutCompletedToday,
          studyDone: false,
          spiritualDone: false,
          familyTimeDone: false,
          coupleTimeDone: false,
          restDone: false,
          priorityTaskDone: false,
        }),
      sportAutomaticCount: lifeContext.workoutCompletedToday ? 1 : 0,
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

  return generateLifeProposalsFromSlots({
    lifeContext,
    context,
    usage,
  }).concat(
    lifeContext.travelDay
      ? [
          {
            id: "travel-recovery",
            category: "rest" as const,
            title: "Récupération trajet",
            description: "Hydratation, étirement, pause courte.",
            durationMinutes: 15,
            reason: "Déplacement prévu — ménage la fatigue.",
            priority: "high" as const,
          },
        ]
      : [],
  );
}

export function resolveLifeContext({
  date,
  context,
  calendarItems = [],
  constraints,
  workoutDetectionItems = [],
  taskActivityEvents = [],
}: ResolveLifeContextInput): LifeContext {
  const { dayType, reason: dayTypeReason } = determineDayType({
    date,
    context,
    calendarItems,
  });

  const fc = context.familyContext;
  const checkinImpact = context.dailyCheckin
    ? resolveCheckinPlanningImpact(
        context.dailyCheckin.mood,
        context.dailyCheckin.intensity,
      )
    : null;
  const vacation = dayType === "VACATION";
  const travelDay = dayType === "TRAVEL";
  const workStatus = resolveWorkFromPlanningContext(context, date);
  const workDay = !vacation && workStatus.isWorkDay;
  const restDay =
    workStatus.isRestDay ||
    dayType === "WEEKEND" ||
    dayType === "SPECIAL" ||
    workStatus.isCompensatoryRest;

  const reasoning: string[] = [dayTypeReason];

  if (checkinImpact) {
    reasoning.push(...checkinImpact.adaptations);
  }

  if (fc.childSick) {
    reasoning.push("Enfant malade — tâches courtes uniquement.");
  }

  if (fc.maxFillRatio < 0.8) {
    reasoning.push(
      `Charge limitée à ${Math.round(fc.maxFillRatio * 100)} % du temps libre.`,
    );
  }

  if (fc.childcareMode) {
    const childcareMessage = getChildcareAdaptationMessage(fc.childcareMode);
    if (childcareMessage) {
      reasoning.push(childcareMessage);
    }
  }

  const workoutCompletion = resolveWorkoutCompletionForDate({
    userId: context.currentUserId,
    date,
    calendarItems: workoutDetectionItems.length > 0 ? workoutDetectionItems : calendarItems,
    taskActivityEvents,
  });

  const activityCompletion = resolveDailyActivityCompletionState({
    userId: context.currentUserId,
    date,
    calendarItems,
    taskActivityEvents,
  });

  const activityUsage = resolveDailyActivityUsage({
    userId: context.currentUserId,
    date,
    calendarItems,
    taskActivityEvents,
  });

  if (workoutCompletion.workoutCompletedToday) {
    reasoning.push(
      "Séance sportive déjà réalisée aujourd'hui — pas de nouvelle proposition automatique.",
    );
  }

  const wakeTime = getWakeTime(context);
  const bedTime = getBedTime(context);
  const wakeIso = combineDateAndTime(date, wakeTime);
  const dayEndIso = resolveBedTimeIso(date, bedTime);

  let lockedMinutes = 0;
  let availableMinutes = estimateDayMinutes(context, workDay);

  const occupiedForGaps =
    constraints?.filter(
      (item) =>
        item.type !== "wake" &&
        item.type !== "sleep" &&
        getDurationMinutes(item.startsAt, item.endsAt) > 0,
    ) ?? [];

  if (constraints) {
    const computed = computeMinutesFromConstraints(constraints);
    lockedMinutes = computed.lockedMinutes;
    availableMinutes = computed.availableMinutes;
  }

  const energyPrediction = predictEnergy(context, dayType);
  const morningWorkoutAutomaticallyAllowed = resolveMorningWorkoutAutomaticallyAllowed({
    workDay,
    vacation,
    restDay,
    dayType,
    energyPrediction,
  });

  if (!morningWorkoutAutomaticallyAllowed && workDay) {
    reasoning.push(
      "Pas de proposition sportive automatique le matin d'un jour travaillé.",
    );
  }

  const partialLife: LifeContext = {
    date,
    dayType,
    dayTypeReason,
    workDay,
    vacation,
    restDay,
    travelDay,
    familySituation: resolveFamilySituation(dayType, context),
    availableMinutes,
    lockedMinutes,
    energyPrediction,
    childrenPresent: context.childrenCount > 0,
    partnerPresent: !fc.activePeriods.some(
      (period) => period.context_type === "partner_absent",
    ),
    sportPossible:
      !travelDay &&
      !fc.onlyMicroTasks &&
      !(checkinImpact?.avoidIntenseSport && checkinImpact.minimalPlanning) &&
      !workoutCompletion.workoutCompletedToday,
    morningWorkoutAutomaticallyAllowed,
    studyPossible:
      context.profile.studiesActive !== false && !checkinImpact?.minimalPlanning,
    freeEvening: context.childrenCount > 0,
    workoutCompletedToday: workoutCompletion.workoutCompletedToday,
    workoutMinutesCompletedToday: workoutCompletion.workoutMinutesCompletedToday,
    workoutTypeCompletedToday: workoutCompletion.workoutTypeCompletedToday,
    priority: context.mainPriority,
    reasoning,
    freeSlots: [],
    proposals: [],
    maxFillRatio: Math.min(
      fc.maxFillRatio ?? 0.8,
      (fc.maxFillRatio ?? 0.8) * (checkinImpact?.maxFillRatioMultiplier ?? 1),
    ),
    activityCompletion,
    activityUsage,
  };

  const rawGaps = splitLargeFreeGaps({
    occupied: occupiedForGaps.map((item) => ({
      startsAt: item.startsAt,
      endsAt: item.endsAt,
    })),
    dayStart: wakeIso,
    dayEnd: dayEndIso,
  });

  partialLife.freeSlots = rawGaps.map((gap, index) =>
    scoreFreeSlot({
      slot: {
        id: `life-free-${index}-${gap.startsAt}`,
        startsAt: gap.startsAt,
        endsAt: gap.endsAt,
        durationMinutes: getDurationMinutes(gap.startsAt, gap.endsAt),
        slotKind: gap.slotKind ?? "day",
      },
      lifeContext: partialLife,
    }),
  );

  partialLife.proposals = generateLifeProposals({
    lifeContext: partialLife,
    context,
    activityCompletion,
    activityUsage,
  });

  return partialLife;
}

export function getEffectiveWorkHours(
  context: PlanningContext,
  date?: string,
): {
  workStart: string;
  workEnd: string;
  estimated: boolean;
} {
  const targetDate = date ?? context.targetDate;
  const overrides = date
    ? getWorkOverridesFromPeriods(context, date)
    : {};

  const workStatus = resolveWorkFromPlanningContext(context, targetDate);
  const useResolvedTimes =
    workStatus.startTime &&
    workStatus.endTime &&
    (workStatus.source === "pattern" ||
      workStatus.source === "override" ||
      workStatus.source === "exceptional");

  if (useResolvedTimes) {
    return {
      workStart: workStatus.startTime!,
      workEnd: workStatus.endTime!,
      estimated: false,
    };
  }

  if (context.workStart && context.workEnd) {
    return {
      workStart: overrides.workStart ?? context.workStart,
      workEnd: overrides.workEnd ?? context.workEnd,
      estimated: false,
    };
  }

  return {
    workStart: overrides.workStart ?? DEFAULT_WORK_START,
    workEnd: overrides.workEnd ?? DEFAULT_WORK_END,
    estimated: true,
  };
}

export function enrichPlanningContextWithLife(
  context: PlanningContext,
  calendarItems: CalendarItemRecord[] = [],
  constraints?: DayConstraint[],
  options?: {
    workoutDetectionItems?: CalendarItemRecord[];
    taskActivityEvents?: TaskActivityEventRecord[];
  },
): PlanningContext {
  const lifeContext = resolveLifeContext({
    date: context.targetDate,
    context,
    calendarItems,
    constraints,
    workoutDetectionItems: options?.workoutDetectionItems,
    taskActivityEvents: options?.taskActivityEvents,
  });

  return { ...context, lifeContext };
}
