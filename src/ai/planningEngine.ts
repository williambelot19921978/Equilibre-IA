import type { PlanningContext } from "./memoryEngine";
import {
  getBedTime,
  getWakeTime,
} from "./memoryEngine";
import type {
  AvailableSlot,
  DayConstraint,
  DayPlan,
  DayPeriod,
  EnergyLevel,
  PlannedBlock,
  PlanningExplanation,
  PlanningResult,
  ScoredTask,
  TaskSegment,
  UnplannableTask,
} from "../types/planning";
import type { CalendarItemRecord, TaskRecord } from "../types";
import {
  addMinutesToIso,
  combineDateAndTime,
  createId,
  getDurationMinutes,
  minutesToTime,
  parseTimeToMinutes,
  rangesOverlap,
} from "../lib/time/daySchedule";
import { resolveWorkFromPlanningContext } from "../lib/work/resolveWorkFromContext";
import { getEffectiveWorkHours } from "./lifeEngine";
import { validatePlannedBlock } from "./decisionEngine";
import { computeEveningRoutineWindow } from "../lib/planning/eveningRoutine";
import { buildMorningRoutineConstraints } from "../lib/planning/buildMorningRoutineConstraints";
import { placeDinner } from "../lib/planning/mealPlacement";
import { mergeOverlappingConstraints } from "../lib/planning/mergeOverlappingConstraints";
import {
  normalizeCalendarItemsForPlanning,
  type IgnoredCalendarItem,
} from "../lib/planning/normalizeCalendarConstraint";

const BUFFER_MINUTES = 12;
const MIN_SLOT_MINUTES = 10;
const MICRO_SPORT_MINUTES = 10;
const MAX_FILL_RATIO = 0.8;
const MAX_TASKS_PER_HALF_DAY = 3;
const DEFAULT_FOCUS_MINUTES = 25;
const MIN_SEGMENT_MINUTES = 10;
const MICRO_FALLBACK_DURATIONS = [20, 15, 10] as const;

const PERIOD_LABELS: Record<DayPeriod, string> = {
  morning: "le matin",
  midday: "en milieu de journée",
  afternoon: "l'après-midi",
  evening: "en début de soirée",
};

const ENERGY_LABELS: Record<EnergyLevel, string> = {
  high: "élevée",
  medium: "correcte",
  low: "plus basse",
  variable: "variable",
};

const PRIORITY_PILLAR_MAP: Record<string, string[]> = {
  family: ["family", "children", "home"],
  studies: ["studies", "study"],
  work: ["work"],
  sport: ["sport"],
  rest: ["rest", "personal"],
  spirituality: ["spirituality"],
  balance: ["family", "children", "home", "studies", "work", "sport", "rest"],
  sleep: ["rest"],
};

type BuildDayConstraintsInput = {
  date: string;
  context: PlanningContext;
  existingItems?: CalendarItemRecord[];
};

type FindAvailableSlotsInput = {
  date: string;
  context: PlanningContext;
  constraints: DayConstraint[];
};

type GenerateDayPlanInput = {
  date: string;
  context: PlanningContext;
  tasks: TaskRecord[];
  existingItems?: CalendarItemRecord[];
};

function buildExplanation(
  summary: string,
  facts: string[],
  confidence: PlanningExplanation["confidence"] = "certain",
): PlanningExplanation {
  return { summary, facts, confidence };
}

function constraintToBlock(constraint: DayConstraint): PlannedBlock {
  return {
    id: constraint.id,
    blockType: "constraint",
    title: constraint.title,
    startsAt: constraint.startsAt,
    endsAt: constraint.endsAt,
    locked: constraint.locked,
    source: constraint.source,
    explanation: buildExplanation(
      constraint.incompleteReason ?? "Contrainte protégée du quotidien.",
      [],
      constraint.incomplete ? "estimated" : "certain",
    ),
  };
}

export function buildDayConstraints({
  date,
  context,
  existingItems = [],
}: BuildDayConstraintsInput): {
  constraints: DayConstraint[];
  displayConstraints: DayConstraint[];
  incompleteData: string[];
  ignoredCalendarItems: IgnoredCalendarItem[];
} {
  const constraints: DayConstraint[] = [];
  const incompleteData: string[] = [];
  const wakeTime = getWakeTime(context);
  const bedTime = getBedTime(context);
  const profile = context.profile;
  const fc = context.familyContext;
  const lc = context.lifeContext;
  const hasChildren = context.childrenCount > 0;
  const workStatus = resolveWorkFromPlanningContext(context, date);
  const workDay =
    lc?.workDay ??
    (workStatus.isWorkDay && !fc.disableWork && !fc.userVacation);
  const showRestBlock =
    lc?.restDay ??
    (workStatus.isCompensatoryRest ||
      (!workDay && !fc.userVacation && !fc.childrenVacation));
  const vacationDay = lc?.vacation ?? (fc.userVacation || fc.childrenVacation);
  const travelDay = lc?.travelDay ?? false;
  const commute = workStatus.commuteMinutes ?? profile.commuteMinutes ?? 30;

  if (!context.wakeTime) {
    incompleteData.push("Heure de réveil non renseignée — estimation à 07:00.");
  }

  if (!context.bedTime) {
    incompleteData.push("Heure de coucher non renseignée — estimation à 22:00.");
  }

  const mealSettings = context.mealSettings;

  const skipSchoolDeparture =
    fc.disableSchoolDeparture || fc.childrenVacation;

  const morningRoutine = buildMorningRoutineConstraints({
    date,
    wakeTime,
    breakfast: mealSettings?.breakfast.enabled ? mealSettings.breakfast : null,
    personalPrepMinutes: profile.personalPrepMinutes ?? null,
    childrenDepartureTime: profile.childrenDepartureTime ?? null,
    childrenPrepMinutes: profile.morningDurationMinutes ?? null,
    hasChildren,
    skipChildrenDeparture: skipSchoolDeparture,
  });

  for (const alert of morningRoutine.alerts) {
    incompleteData.push(alert);
  }

  for (const block of morningRoutine.blocks) {
    constraints.push({
      id: createId(block.type),
      type: block.type,
      title: block.title,
      startsAt: block.startsAt,
      endsAt: block.endsAt,
      locked: true,
      source: "engine",
    });
  }

  if (hasChildren && !skipSchoolDeparture && morningRoutine.alerts.length > 0) {
    incompleteData.push(
      "Routine matin impossible — aucun créneau libre ne sera inventé avant le départ.",
    );
  } else if (hasChildren && skipSchoolDeparture && fc.childrenVacation) {
    incompleteData.push(
      "Vacances enfants — horaires de garde non connus, départ école/crèche non appliqué.",
    );
  }

  let afterWorkEndIso: string | null = null;

  if (vacationDay) {
    constraints.push({
      id: createId("day-banner-vacation"),
      type: "day_banner",
      title: "Vacances",
      startsAt: combineDateAndTime(date, wakeTime),
      endsAt: addMinutesToIso(combineDateAndTime(date, wakeTime), 30),
      locked: true,
      source: "engine",
    });
  } else if (travelDay) {
    constraints.push({
      id: createId("day-banner-travel"),
      type: "day_banner",
      title: "Déplacement",
      startsAt: combineDateAndTime(date, wakeTime),
      endsAt: addMinutesToIso(combineDateAndTime(date, wakeTime), 30),
      locked: true,
      source: "engine",
    });
  }

  if (workDay) {
    const { workStart, workEnd, estimated } = getEffectiveWorkHours(context, date);
    const workStartMinutes = parseTimeToMinutes(workStart);

    if (estimated) {
      incompleteData.push(
        "Horaires de travail estimés (09:00–17:00) — complète ton profil pour plus de précision.",
      );
    }

    if (workStartMinutes !== null) {
      const commuteStart = minutesToTime(workStartMinutes - commute);

      constraints.push({
        id: createId("commute-out"),
        type: "commute_out",
        title: "Trajet aller travail",
        startsAt: combineDateAndTime(date, commuteStart),
        endsAt: combineDateAndTime(date, workStart),
        locked: true,
        source: "engine",
      });
    }

    constraints.push({
      id: createId("work"),
      type: "work",
      title: "Travail",
      startsAt: combineDateAndTime(date, workStart),
      endsAt: combineDateAndTime(date, workEnd),
      locked: true,
      source: "engine",
    });

    constraints.push({
      id: createId("commute-in"),
      type: "commute_in",
      title: "Trajet retour travail",
      startsAt: combineDateAndTime(date, workEnd),
      endsAt: addMinutesToIso(
        combineDateAndTime(date, workEnd),
        commute,
      ),
      locked: true,
      source: "engine",
    });
    afterWorkEndIso = addMinutesToIso(combineDateAndTime(date, workEnd), commute);
  } else if (showRestBlock && !vacationDay) {
    const restTitle = workStatus.isCompensatoryRest
      ? "Journée de repos"
      : "Repos";
    const { workStart, workEnd } = getEffectiveWorkHours(context, date);

    constraints.push({
      id: createId("rest-day"),
      type: "rest_day",
      title: restTitle,
      startsAt: combineDateAndTime(date, workStart),
      endsAt: combineDateAndTime(date, workEnd),
      locked: true,
      source: "engine",
    });
  }

  if (hasChildren) {
    const eveningWindow = computeEveningRoutineWindow({
      date,
      children: context.children,
      childRoutines: context.childRoutines,
      householdSettings: context.householdEvening,
    });

    if (eveningWindow.incomplete) {
      incompleteData.push(
        eveningWindow.message ??
          "Routine du soir incomplète — complète « Mon quotidien ».",
      );
    } else if (eveningWindow.startTime && eveningWindow.endTime) {
      if (mealSettings?.dinner.beforeEveningRoutine) {
        const dinner = placeDinner({
          date,
          eveningRoutineStart: eveningWindow.startTime,
          afterWorkEnd: afterWorkEndIso,
          settings: mealSettings.dinner,
        });

        if (dinner) {
          constraints.push({
            id: createId("dinner"),
            type: "dinner",
            title: "Dîner",
            startsAt: dinner.startsAt,
            endsAt: dinner.endsAt,
            locked: true,
            source: "engine",
          });
          incompleteData.push(...dinner.conflicts);
        } else {
          incompleteData.push(
            "Le dîner ne peut pas être placé avant la routine du soir — ajuste Mon quotidien.",
          );
        }
      }

      constraints.push({
        id: createId("evening-routine"),
        type: "evening_routine",
        title: "Routine soir — enfants",
        startsAt: combineDateAndTime(date, eveningWindow.startTime),
        endsAt: combineDateAndTime(date, eveningWindow.endTime),
        locked: true,
        source: "engine",
        incompleteReason: eveningWindow.message,
      });

      if (fc.soloParentWithChildren) {
        incompleteData.push(
          `Routine du soir renforcée (${eveningWindow.startTime} → ${eveningWindow.endTime}) — parent seul avec les enfants.`,
        );
      }
    }
  }

  constraints.push({
    id: createId("sleep"),
    type: "sleep",
    title: "Sommeil",
    startsAt: combineDateAndTime(date, bedTime),
    endsAt: combineDateAndTime(date, bedTime),
    locked: true,
    source: "engine",
  });

  const { constraints: manualConstraints, ignored } =
    normalizeCalendarItemsForPlanning({
      items: existingItems,
      targetDate: date,
      wakeTime,
      bedTime,
    });

  for (const ignoredItem of ignored) {
    incompleteData.push(
      `Élément ignoré « ${ignoredItem.title} » (${ignoredItem.id}) : ${ignoredItem.reason}`,
    );
  }

  constraints.push(...manualConstraints);

  const displayConstraints = [...constraints].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return {
    constraints: mergeOverlappingConstraints(constraints),
    displayConstraints,
    incompleteData,
    ignoredCalendarItems: ignored,
  };
}

function getPeriodForMinutes(
  minutesFromWake: number,
  daySpanMinutes: number,
): DayPeriod {
  const ratio = minutesFromWake / daySpanMinutes;

  if (ratio < 0.25) return "morning";
  if (ratio < 0.5) return "midday";
  if (ratio < 0.75) return "afternoon";
  return "evening";
}

export function estimateEnergyForPeriod(
  period: DayPeriod,
  context: PlanningContext,
  slotStartIso: string,
): EnergyLevel {
  const profile = context.profile;
  const workEnd = context.workEnd;
  const slotMinutes = new Date(slotStartIso).getTime();

  if (workEnd && context.workStart) {
    const workEndIso = combineDateAndTime(
      slotStartIso.slice(0, 10),
      workEnd,
    );
    const commuteEnd = profile.commuteMinutes
      ? addMinutesToIso(workEndIso, profile.commuteMinutes)
      : workEndIso;

    if (
      slotMinutes >= new Date(workEndIso).getTime() &&
      slotMinutes < new Date(commuteEnd).getTime() + 2 * 60 * 60_000
    ) {
      const afterWork = profile.afterWorkEnergy ?? "medium";

      if (afterWork === "high") return "high";
      if (afterWork === "low") return "low";
      if (afterWork === "variable") return "medium";
      return "medium";
    }
  }

  if (period === "morning") return "high";
  if (period === "midday") return "medium";
  if (period === "afternoon") return "medium";
  return "low";
}

export function getRequiredEnergyForCategory(category: string): EnergyLevel {
  if (category === "studies" || category === "work") return "high";
  if (category === "family" || category === "children" || category === "home") {
    return "medium";
  }
  if (category === "sport") return "variable";
  if (category === "rest" || category === "spirituality" || category === "personal") {
    return "low";
  }
  return "medium";
}

function energyRank(level: EnergyLevel): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  if (level === "variable") return 2;
  return 1;
}

function energyCompatible(
  slotEnergy: EnergyLevel,
  required: EnergyLevel,
): boolean {
  if (required === "low") return true;
  if (required === "medium") return energyRank(slotEnergy) >= 2;
  if (required === "variable") return true;
  return slotEnergy === "high";
}

export function findAvailableSlots({
  date,
  context,
  constraints,
}: FindAvailableSlotsInput): AvailableSlot[] {
  const wakeTime = getWakeTime(context);
  const bedTime = getBedTime(context);
  const dayStart = combineDateAndTime(date, wakeTime);
  const dayEnd = combineDateAndTime(date, bedTime);

  const blockingConstraints = constraints.filter(
    (constraint) =>
      constraint.type !== "wake" && constraint.type !== "sleep",
  );

  const timeline = [
    { startsAt: dayStart, endsAt: dayStart },
    ...blockingConstraints.map((constraint) => ({
      startsAt: constraint.startsAt,
      endsAt: constraint.endsAt,
    })),
    { startsAt: dayEnd, endsAt: dayEnd },
  ].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const slots: AvailableSlot[] = [];
  const wakeMinutes = parseTimeToMinutes(wakeTime) ?? 7 * 60;
  const bedMinutes = parseTimeToMinutes(bedTime) ?? 22 * 60;
  const daySpanMinutes = Math.max(bedMinutes - wakeMinutes, 60);

  for (let index = 0; index < timeline.length - 1; index += 1) {
    const currentEnd = timeline[index].endsAt;
    const nextStart = timeline[index + 1].startsAt;
    const bufferedStart = addMinutesToIso(currentEnd, BUFFER_MINUTES);
    const bufferedEnd = addMinutesToIso(nextStart, -BUFFER_MINUTES);
    const durationMinutes = getDurationMinutes(bufferedStart, bufferedEnd);

    if (durationMinutes < MIN_SLOT_MINUTES) {
      continue;
    }

    const minutesFromWake =
      (parseTimeToMinutes(bufferedStart.slice(11, 16)) ?? wakeMinutes) -
      wakeMinutes;
    const period = getPeriodForMinutes(minutesFromWake, daySpanMinutes);
    const energyLevel = estimateEnergyForPeriod(period, context, bufferedStart);

    slots.push({
      id: createId("slot"),
      startsAt: bufferedStart,
      endsAt: bufferedEnd,
      durationMinutes,
      energyLevel,
      period,
    });
  }

  return slots;
}

function getDueUrgencyScore(dueAt: string | null, date: string): number {
  if (!dueAt) return 0;

  const dueDate = new Date(dueAt);
  const targetDate = new Date(`${date}T12:00:00`);
  const diffDays = Math.ceil(
    (dueDate.getTime() - targetDate.getTime()) / (24 * 60 * 60_000),
  );

  if (diffDays < 0) return 50;
  if (diffDays === 0) return 40;
  if (diffDays === 1) return 30;
  if (diffDays <= 3) return 20;
  if (diffDays <= 7) return 10;
  return 0;
}

function alignsWithMainPriority(
  category: string,
  mainPriority: string | null,
): boolean {
  if (!mainPriority) return false;

  const pillars = PRIORITY_PILLAR_MAP[mainPriority] ?? [];
  return pillars.includes(category);
}

export function scoreTask(
  task: TaskRecord,
  context: PlanningContext,
  slotEnergy?: EnergyLevel,
  date?: string,
): number {
  let score = task.priority * 20;
  score += getDueUrgencyScore(
    task.due_at,
    date ?? new Date().toISOString().slice(0, 10),
  );

  if (alignsWithMainPriority(task.category, context.mainPriority)) {
    score += 15;
  }

  if (task.skip_count >= 3) {
    score += 25;
  } else if (task.skip_count > 0) {
    score += 8;
  }

  if (task.splittable) {
    score += 5;
  }

  if (slotEnergy && energyCompatible(slotEnergy, getRequiredEnergyForCategory(task.category))) {
    score += 10;
  }

  return score;
}

export function splitTaskIfNeeded(
  task: TaskRecord,
  context: PlanningContext,
): TaskSegment[] {
  const totalMinutes = Math.max(task.estimated_minutes ?? 30, MIN_SEGMENT_MINUTES);
  const focusMinutes = context.profile.preferredFocusMinutes ?? DEFAULT_FOCUS_MINUTES;
  const isRestart = task.skip_count >= 3;

  if (isRestart) {
    const restartDuration = Math.min(
      20,
      Math.max(10, Math.min(totalMinutes, focusMinutes)),
    );

    return [
      {
        taskId: task.id,
        title: `${task.title} — redémarrage doux`,
        durationMinutes: restartDuration,
        segmentIndex: 1,
        segmentTotal: Math.ceil(totalMinutes / focusMinutes),
        originalTask: task,
        isRestartSession: true,
      },
    ];
  }

  if (!task.splittable || totalMinutes <= focusMinutes) {
    return [
      {
        taskId: task.id,
        title: task.title,
        durationMinutes: totalMinutes,
        segmentIndex: 1,
        segmentTotal: 1,
        originalTask: task,
        isRestartSession: false,
      },
    ];
  }

  const segments: TaskSegment[] = [];
  let remaining = totalMinutes;
  let index = 1;
  const segmentCount = Math.ceil(totalMinutes / focusMinutes);

  while (remaining > 0) {
    const chunk = Math.max(
      MIN_SEGMENT_MINUTES,
      Math.min(focusMinutes, remaining),
    );

    segments.push({
      taskId: task.id,
      title: `${task.title} — partie ${index}/${segmentCount}`,
      durationMinutes: chunk,
      segmentIndex: index,
      segmentTotal: segmentCount,
      originalTask: task,
      isRestartSession: false,
    });

    remaining -= chunk;
    index += 1;
  }

  return segments;
}

function createMicroSegment(
  task: TaskRecord,
  durationMinutes: number,
  segmentIndex: number,
): TaskSegment {
  const totalMinutes = task.estimated_minutes ?? durationMinutes;
  const isPartial = durationMinutes < totalMinutes;

  return {
    taskId: task.id,
    title: isPartial
      ? `${task.title} — ${durationMinutes} min`
      : task.title,
    durationMinutes,
    segmentIndex,
    segmentTotal: isPartial ? Math.ceil(totalMinutes / durationMinutes) : 1,
    originalTask: task,
    isRestartSession: task.skip_count >= 3 && durationMinutes <= 20,
  };
}

/** Segments à tenter : découpage normal puis 20, 15, 10 minutes. */
export function buildSegmentsToTry(
  task: TaskRecord,
  context: PlanningContext,
): TaskSegment[] {
  const primarySegments = splitTaskIfNeeded(task, context);
  const attempts: TaskSegment[] = [...primarySegments];
  const seenDurations = new Set(
    primarySegments.map((segment) => segment.durationMinutes),
  );

  for (const minutes of MICRO_FALLBACK_DURATIONS) {
    if (seenDurations.has(minutes)) {
      continue;
    }

    attempts.push(createMicroSegment(task, minutes, attempts.length + 1));
    seenDurations.add(minutes);
  }

  return attempts;
}

function buildPlacementSummary(
  segment: TaskSegment,
  slot: AvailableSlot,
  context: PlanningContext,
): string {
  if (segment.isRestartSession) {
    return "Session courte pour reprendre en douceur après plusieurs reports.";
  }

  if (
    segment.durationMinutes < (segment.originalTask.estimated_minutes ?? 30) &&
    segment.segmentTotal > 1
  ) {
    return `Découpée en ${segment.segmentTotal} parties pour éviter la procrastination — session de ${segment.durationMinutes} minutes.`;
  }

  if (segment.durationMinutes <= 20 && segment.originalTask.estimated_minutes && segment.durationMinutes < segment.originalTask.estimated_minutes) {
    return `Proposée en ${segment.durationMinutes} minutes : une version plus accessible pour avancer sans pression.`;
  }

  const periodLabel = PERIOD_LABELS[slot.period];
  const energyLabel = ENERGY_LABELS[slot.energyLevel];

  if (
    context.profile.studyBestPeriod === "morning" &&
    slot.period === "morning" &&
    segment.originalTask.category === "studies"
  ) {
    return `Placée ${periodLabel} car tu es généralement plus efficace pour étudier le matin.`;
  }

  if (
    context.profile.afterWorkEnergy === "low" &&
    slot.period === "evening"
  ) {
    return `Placée ${periodLabel} avec une durée modérée car ton énergie est souvent basse en fin de journée.`;
  }

  if (slot.energyLevel === "high" && segment.originalTask.category === "studies") {
    return `Placée ${periodLabel} car ton énergie y est probablement ${energyLabel} — adapté au travail de fond.`;
  }

  return `Placée ${periodLabel} car ton énergie y est probablement ${energyLabel} (estimation, pas une certitude).`;
}

export function explainUnplannableReason({
  task,
  context,
  slots,
  plannedMinutes,
  maxPlannableMinutes,
  rejectionReasons,
}: {
  task: TaskRecord;
  context: PlanningContext;
  slots: AvailableSlot[];
  plannedMinutes: number;
  maxPlannableMinutes: number;
  rejectionReasons: string[];
}): string {
  if (
    task.category === "spirituality" &&
    context.profile.faithImportance === "disabled"
  ) {
    return "Contenu spirituel non proposé car tu as indiqué faith_importance=disabled.";
  }

  const totalFree = slots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
  const largestSlot = slots.reduce(
    (max, slot) => Math.max(max, slot.durationMinutes),
    0,
  );

  if (totalFree === 0) {
    return "Ta journée est déjà entièrement occupée par des contraintes (travail, enfants, rendez-vous verrouillés).";
  }

  if (largestSlot < MIN_SLOT_MINUTES) {
    return "Il ne reste que des micro-créneaux (moins de 10 minutes) entre tes contraintes.";
  }

  if (plannedMinutes >= maxPlannableMinutes) {
    const fillPercent = Math.round(
      (context.familyContext?.maxFillRatio ?? MAX_FILL_RATIO) * 100,
    );
    return `La limite de remplissage (${fillPercent} % du temps libre) est atteinte — le reste est volontairement laissé disponible.`;
  }

  if (
    rejectionReasons.some((reason) =>
      reason.includes("demi-journée"),
    )
  ) {
    return "Maximum 3 tâches par demi-journée déjà atteint — essaie demain matin ou allège une autre tâche.";
  }

  if (
    rejectionReasons.some((reason) =>
      reason.includes("énergie faible"),
    )
  ) {
    return "Les créneaux restants ont une énergie estimée trop basse pour cette tâche exigeante — une version plus courte n'a pas pu être validée.";
  }

  if (task.estimated_minutes && task.estimated_minutes > largestSlot && !task.splittable) {
    return `Cette tâche demande ${task.estimated_minutes} minutes d'affilée, mais le plus grand créneau libre fait ${largestSlot} minutes.`;
  }

  return `Aucun créneau compatible trouvé même en 10 minutes — vérifie ton calendrier ou allège une contrainte verrouillée.`;
}

export function prioritizeTasks(
  tasks: TaskRecord[],
  context: PlanningContext,
  date?: string,
): ScoredTask[] {
  const eligibleTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "skipped",
  );

  return eligibleTasks
    .map((task) => {
      const segments = buildSegmentsToTry(task, context);

      return {
        task,
        score: scoreTask(task, context, undefined, date),
        segments,
        requiredEnergy: getRequiredEnergyForCategory(task.category),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function countTasksInHalfDay(
  blocks: PlannedBlock[],
  period: DayPeriod,
  context: PlanningContext,
): number {
  const wakeTime = getWakeTime(context);
  const bedTime = getBedTime(context);
  const wakeMinutes = parseTimeToMinutes(wakeTime) ?? 420;
  const bedMinutes = parseTimeToMinutes(bedTime) ?? 1320;
  const middayMinutes = wakeMinutes + (bedMinutes - wakeMinutes) / 2;

  return blocks.filter((block) => {
    if (block.blockType !== "task") return false;

    const blockMinutes =
      parseTimeToMinutes(block.startsAt.slice(11, 16)) ?? wakeMinutes;

    if (period === "morning" || period === "midday") {
      return blockMinutes < middayMinutes;
    }

    return blockMinutes >= middayMinutes;
  }).length;
}

function buildTaskBlock(
  segment: TaskSegment,
  slot: AvailableSlot,
  context: PlanningContext,
): PlannedBlock {
  const endsAt = addMinutesToIso(slot.startsAt, segment.durationMinutes);
  const facts: string[] = [];

  if (segment.isRestartSession) {
    facts.push(
      `Cette tâche a été reportée ${segment.originalTask.skip_count} fois — on propose une version plus courte pour redémarrer sans pression.`,
    );
  }

  if (segment.segmentTotal > 1) {
    facts.push(
      `Découpage en ${segment.segmentTotal} sessions de ${segment.durationMinutes} minutes environ.`,
    );
  }

  if (context.mainPriority && alignsWithMainPriority(segment.originalTask.category, context.mainPriority)) {
    facts.push(`Alignée avec ta priorité principale (${context.mainPriority}).`);
  }

  if (segment.originalTask.due_at) {
    facts.push(`Échéance : ${segment.originalTask.due_at}.`);
  }

  facts.push(
    `Énergie du créneau probablement ${slot.energyLevel} (estimation, pas une certitude).`,
  );

  return {
    id: createId("task"),
    blockType: "task",
    title: segment.title,
    startsAt: slot.startsAt,
    endsAt,
    taskId: segment.taskId,
    category: segment.originalTask.category,
    locked: false,
    source: "engine",
    segmentIndex: segment.segmentIndex,
    segmentTotal: segment.segmentTotal,
    energyLevel: slot.energyLevel,
    explanation: buildExplanation(
      buildPlacementSummary(segment, slot, context),
      facts,
      "estimated",
    ),
  };
}

export function generateDayPlan({
  date,
  context,
  tasks,
  existingItems = [],
}: GenerateDayPlanInput): PlanningResult {
  const { constraints, incompleteData, ignoredCalendarItems } = buildDayConstraints({
    date,
    context,
    existingItems,
  });

  const constraintBlocks = constraints
    .filter((constraint) => constraint.type !== "wake" && constraint.type !== "sleep")
    .map(constraintToBlock);

  const slots = findAvailableSlots({ date, context, constraints });
  const totalFreeMinutes = slots.reduce(
    (sum, slot) => sum + slot.durationMinutes,
    0,
  );
  const fc = context.familyContext;
  const maxFillRatio = context.lifeContext?.maxFillRatio ?? fc?.maxFillRatio ?? MAX_FILL_RATIO;
  const maxPlannableMinutes = Math.floor(totalFreeMinutes * maxFillRatio);

  const scoredTasks = prioritizeTasks(
    tasks.filter((task) => {
      if (
        task.assigned_to &&
        fc?.unavailableUserIds.includes(task.assigned_to)
      ) {
        return false;
      }

      if (
        fc?.soloParentWithChildren &&
        task.category === "personal" &&
        task.priority < 5
      ) {
        return false;
      }

      return true;
    }),
    context,
    date,
  );
  const placedBlocks: PlannedBlock[] = [...constraintBlocks];
  const bufferBlocks: PlannedBlock[] = [];
  const rejectedBlocks: PlanningResult["rejectedBlocks"] = [];
  const unplannableTasks: UnplannableTask[] = [];
  let plannedMinutes = 0;
  const scheduledTaskIds = new Set<string>();

  for (const scoredTask of scoredTasks) {
    if (scheduledTaskIds.has(scoredTask.task.id)) {
      continue;
    }

    let placed = false;
    const taskRejections: string[] = [];

      for (const segment of scoredTask.segments) {
      if (placed) break;

      if (fc?.childSick && segment.durationMinutes > 20) {
        continue;
      }

      if (fc?.onlyMicroTasks && segment.durationMinutes > 20) {
        continue;
      }

      const candidateSlots = [...slots].sort((a, b) => {
        const aScore = scoreTask(scoredTask.task, context, a.energyLevel, date);
        const bScore = scoreTask(scoredTask.task, context, b.energyLevel, date);
        return bScore - aScore || b.durationMinutes - a.durationMinutes;
      });

      for (const slot of candidateSlots) {
        if (
          scoredTask.task.category === "spirituality" &&
          context.profile.faithImportance === "disabled"
        ) {
          break;
        }
        const minRequired =
          scoredTask.task.category === "sport" &&
          segment.durationMinutes <= MICRO_SPORT_MINUTES
            ? MICRO_SPORT_MINUTES
            : MIN_SLOT_MINUTES;

        if (slot.durationMinutes < segment.durationMinutes) {
          continue;
        }

        if (slot.durationMinutes < minRequired) {
          continue;
        }

        if (plannedMinutes + segment.durationMinutes > maxPlannableMinutes) {
          continue;
        }

        if (
          countTasksInHalfDay(placedBlocks, slot.period, context) >=
          MAX_TASKS_PER_HALF_DAY
        ) {
          continue;
        }

        const taskBlock = buildTaskBlock(segment, slot, context);
        const validation = validatePlannedBlock({
          block: taskBlock,
          context,
          existingBlocks: placedBlocks,
          totalFreeMinutes,
          plannedMinutes,
        });

        if (!validation.valid) {
          taskRejections.push(validation.reason);
          rejectedBlocks.push({
            block: taskBlock,
            reason: validation.reason,
          });
          continue;
        }

        placedBlocks.push(taskBlock);
        bufferBlocks.push({
          id: createId("buffer"),
          blockType: "buffer",
          title: "Marge",
          startsAt: taskBlock.endsAt,
          endsAt: addMinutesToIso(taskBlock.endsAt, BUFFER_MINUTES),
          locked: false,
          source: "engine",
          explanation: buildExplanation(
            "Petite pause entre deux activités.",
            [],
            "certain",
          ),
        });

        plannedMinutes += segment.durationMinutes;
        scheduledTaskIds.add(scoredTask.task.id);
        placed = true;
        break;
      }

      if (placed) break;
    }

    if (!placed) {
      unplannableTasks.push({
        taskId: scoredTask.task.id,
        title: scoredTask.task.title,
        reason: explainUnplannableReason({
          task: scoredTask.task,
          context,
          slots,
          plannedMinutes,
          maxPlannableMinutes,
          rejectionReasons: taskRejections,
        }),
      });
    }
  }

  const freeMinutesRemaining = Math.max(totalFreeMinutes - plannedMinutes, 0);
  const maxFillPercent = Math.round(maxFillRatio * 100);
  const marginBlock: PlannedBlock | null =
    freeMinutesRemaining >= MIN_SLOT_MINUTES
      ? {
          id: createId("margin"),
          blockType: "margin",
          title: "Temps libre conservé",
          startsAt: slots[slots.length - 1]?.startsAt ?? combineDateAndTime(date, getWakeTime(context)),
          endsAt: slots[slots.length - 1]?.endsAt ?? combineDateAndTime(date, getBedTime(context)),
          locked: false,
          source: "engine",
          explanation: buildExplanation(
            `${freeMinutesRemaining} minutes laissées volontairement libres (max ${maxFillPercent} % du temps disponible).`,
            [],
            "certain",
          ),
        }
      : null;

  const margins = marginBlock ? [marginBlock] : [];

  const plan: DayPlan = {
    date,
    constraints,
    blocks: [...placedBlocks, ...bufferBlocks].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    ),
    margins,
    unplannableTasks,
    freeMinutesRemaining,
    totalFreeMinutes,
    fillPercentage:
      totalFreeMinutes > 0
        ? Math.round((plannedMinutes / totalFreeMinutes) * 100)
        : 0,
    incompleteData: [
      ...incompleteData,
      ...(fc?.warnings ?? [])
        .map((warning) => warning.message)
        .filter((message, index, items) => items.indexOf(message) === index),
    ],
    contextAdaptations: fc?.adaptations ?? [],
    contextWarnings: fc?.warnings ?? [],
    ignoredCalendarItems,
  };

  return {
    plan,
    rejectedBlocks,
  };
}

export function hasOverlapInPlan(blocks: PlannedBlock[]): boolean {
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      if (
        rangesOverlap(
          blocks[i].startsAt,
          blocks[i].endsAt,
          blocks[j].startsAt,
          blocks[j].endsAt,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}
