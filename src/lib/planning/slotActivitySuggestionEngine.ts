import type { PlanningContext } from "../../ai/memoryEngine";
import { buildLeisureProposals } from "../../ai/leisureSuggestionEngine";
import { MAX_SLOT_SUGGESTIONS } from "../../config/activityRepeatRules";
import type { FreeSlotInput } from "../../ai/freeTimeSuggestionEngine";
import type {
  LifeContext,
  LifeProposal,
  LifeProposalCategory,
  ScoredFreeSlot,
} from "../../types/lifeContext";
import type { TaskRecord } from "../../types";
import {
  canProposeCategoryAutomatically,
  type DailyActivityUsage,
} from "./dailyActivityCompletionState";
import { isMorningSlotBeforeWork } from "./resolveMorningWorkoutAutomaticallyAllowed";
import { resolveRecommendedSportDuration } from "./resolveSportDuration";
import { resolveRecommendedStudyRevisionDuration } from "./resolveStudyRevisionDuration";
import { resolveSuggestedActivityDuration } from "./resolveSuggestedActivityDuration";
import { reasonAboutProposals } from "../../ai/reasoning/lifeReasoner";
import type { HabitProfile } from "../../types/habitProfile";
import type { LivingHabitProfile } from "../../types/livingMemory";
import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";
import {
  resolveAdaptiveCalmDuration,
  resolveAdaptiveSportDuration,
  resolveAdaptiveStudyDuration,
} from "../../ai/memory/adaptiveDurationEngine";

type Candidate = LifeProposal & { score: number };

function findStudyTask(tasks: TaskRecord[]): TaskRecord | undefined {
  return tasks.find(
    (task) =>
      task.status === "todo" &&
      (task.category === "studies" ||
        task.category === "study" ||
        /révis|étude/i.test(task.title)),
  );
}

function toPriority(score: number): LifeProposal["priority"] {
  if (score >= 85) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function buildCandidate(
  category: LifeProposalCategory,
  title: string,
  description: string,
  durationMinutes: number,
  reason: string,
  score: number,
  slotId: string,
  extras: Partial<LifeProposal> = {},
): Candidate {
  return {
    id: `${category}-${slotId}-${title.replace(/\s+/g, "-").toLowerCase()}`,
    category,
    title,
    description,
    durationMinutes,
    reason,
    priority: toPriority(score),
    slotId,
    score,
    ...extras,
  };
}

export function generateSlotActivitySuggestions({
  slot,
  lifeContext,
  context,
  usage,
  tasks = [],
  habitProfile = null,
  livingHabitProfile = null,
  statistics = null,
}: {
  slot: FreeSlotInput | ScoredFreeSlot;
  lifeContext: LifeContext;
  context: PlanningContext;
  usage: DailyActivityUsage;
  tasks?: TaskRecord[];
  habitProfile?: HabitProfile | null;
  livingHabitProfile?: LivingHabitProfile | null;
  statistics?: PeriodStatistics | null;
}): LifeProposal[] {
  const hour = new Date(slot.startsAt).getHours();
  const slotMinutes = slot.durationMinutes;
  const tired =
    lifeContext.energyPrediction === "low" ||
    context.profile.afterWorkEnergy === "low";
  const lateEvening = hour >= 21;
  const candidates: Candidate[] = [];

  const canPropose = (category: LifeProposalCategory) =>
    canProposeCategoryAutomatically({
      category,
      usage,
      slotStartsAt: slot.startsAt,
    });

  const studyTask = findStudyTask(tasks);

  if (
    lifeContext.studyPossible &&
    slotMinutes >= 10 &&
    canPropose("study")
  ) {
    const duration = resolveRecommendedStudyRevisionDuration({
      slotMinutes,
      preferredFocusMinutes: resolveAdaptiveStudyDuration(
        livingHabitProfile,
        context.profile.preferredFocusMinutes ?? 30,
      ),
      energy: lifeContext.energyPrediction,
      hour,
    });
    let score = 55;
    if (studyTask) score += 25;
    if (context.mainPriority === "studies") score += 15;
    if (usage.studyCount === 0) score += 10;
    if (tired) score -= 15;
    if (lateEvening) score -= 10;
    if (usage.studyCount >= 1) score -= 5;

    const studyTitle = studyTask
      ? `Révision — ${duration} min`
      : usage.studyCount >= 1
        ? `Révision — session suivante`
        : "Révision — révision libre";

    candidates.push(
      buildCandidate(
        "study",
        studyTitle,
        studyTask
          ? studyTask.title
          : `Session de ${duration} min.`,
        duration,
        usage.studyCount >= 1
          ? "Tu peux étaler ta révision sur plusieurs créneaux dans la journée."
          : studyTask
            ? "Je te la propose car c'est ta priorité actuelle."
            : "Créneau propice à une révision ciblée — sujet libre.",
        score,
        slot.id,
        studyTask
          ? { taskId: studyTask.id, taskTitle: studyTask.title }
          : { taskTitle: "Révision libre" },
      ),
    );
  }

  const morningSportBlocked =
    lifeContext.workDay &&
    !lifeContext.morningWorkoutAutomaticallyAllowed &&
    isMorningSlotBeforeWork({
      slotStartsAt: slot.startsAt,
      workStartTime: context.workStart ?? "09:00",
      date: lifeContext.date,
    });

  if (
    lifeContext.sportPossible &&
    !morningSportBlocked &&
    slotMinutes >= 10 &&
    hour < 22 &&
    canPropose("sport")
  ) {
    const duration = resolveRecommendedSportDuration({
      slotMinutes,
      energy: lifeContext.energyPrediction,
      preferredMinutes: resolveAdaptiveSportDuration(
        livingHabitProfile,
        context.profile.preferredFocusMinutes ?? 25,
      ),
    });
    let score = 45;
    if (context.mainPriority === "sport") score += 20;
    if (hour >= 21) score -= 25;
    if (tired) score -= 10;

    candidates.push(
      buildCandidate(
        "sport",
        "Séance sportive",
        `Séance de ${duration} min adaptée à ton énergie.`,
        duration,
        hour >= 21
          ? "Séance douce seulement en fin de journée."
          : "Créneau suffisant pour bouger sans surcharge.",
        score,
        slot.id,
      ),
    );
  }

  if (slotMinutes >= 15 && canPropose("reading")) {
    const duration = resolveSuggestedActivityDuration({
      activityType: "reading",
      freeSlotDuration: slotMinutes,
      energy: lifeContext.energyPrediction,
    });
    let score = 50;
    if (context.profile.restPreferences?.includes("lecture")) score += 15;
    if (tired) score += 10;
    if (lateEvening) score += 5;

    candidates.push(
      buildCandidate(
        "reading",
        "Lecture",
        `Lecture tranquille — ${duration} min.`,
        duration,
        "Moment calme pour lire sans pression.",
        score,
        slot.id,
      ),
    );
  }

  if (slotMinutes >= 5 && canPropose("calm")) {
    const duration = resolveAdaptiveCalmDuration(
      livingHabitProfile,
      resolveSuggestedActivityDuration({
        activityType: "calm",
        freeSlotDuration: slotMinutes,
        energy: lifeContext.energyPrediction,
      }),
    );
    let score = 40;
    if (tired) score += 25;
    if (slot.slotKind === "evening_available") score += 10;

    candidates.push(
      buildCandidate(
        "calm",
        "Temps calme",
        "Respiration, silence ou musique douce.",
        duration,
        tired
          ? "Ta journée a été longue — un temps calme semble adapté."
          : "Pause utile entre deux obligations.",
        score,
        slot.id,
      ),
    );
  }

  if (
    context.profile.faithImportance &&
    context.profile.faithImportance !== "disabled" &&
    (context.profile.faithImportance === "important" || hour >= 19) &&
    canPropose("spiritual")
  ) {
    const duration = resolveSuggestedActivityDuration({
      activityType: "spiritual",
      freeSlotDuration: slotMinutes,
    });
    candidates.push(
      buildCandidate(
        "spiritual",
        "Moment spirituel",
        "Prière, verset ou gratitude — proposition facultative.",
        duration,
        "Selon tes préférences spirituelles.",
        context.profile.faithImportance === "important" ? 58 : 42,
        slot.id,
      ),
    );
  }

  if (
    lifeContext.partnerPresent &&
    lifeContext.familySituation === "normal" &&
    !tired &&
    slotMinutes >= 60 &&
    hour >= 19 &&
    canPropose("couple")
  ) {
    const duration = resolveSuggestedActivityDuration({
      activityType: "couple",
      freeSlotDuration: slotMinutes,
      energy: lifeContext.energyPrediction,
    });
    let score = 70;
    if (usage.coupleCount === 0) score += 10;
    if (slot.slotKind === "evening_available") score += 15;

    candidates.push(
      buildCandidate(
        "couple",
        "Moment en couple — soirée disponible",
        "Profiter de ce temps ensemble.",
        duration,
        "Profiter de cette soirée ensemble, sans surcharge d'activités.",
        score,
        slot.id,
      ),
    );
  }

  if (
    (lifeContext.vacation || context.childrenCount > 0) &&
    slotMinutes >= 45 &&
    hour < 20 &&
    canPropose(lifeContext.vacation ? "outing" : "family")
  ) {
    const category = lifeContext.vacation ? "outing" : "family";
    const duration = resolveSuggestedActivityDuration({
      activityType: "family_outing",
      freeSlotDuration: slotMinutes,
      dayType: lifeContext.dayType,
    });
    let score = lifeContext.vacation ? 65 : 48;
    if (lifeContext.restDay || lifeContext.vacation) score += 10;

    candidates.push(
      buildCandidate(
        category,
        lifeContext.vacation ? "Sortie en famille" : "Moment famille",
        "Promenade ou temps partagé simple.",
        duration,
        lifeContext.vacation
          ? "Tu es en vacances — une sortie légère peut être agréante."
          : "Créneau suffisant pour un moment familial.",
        score,
        slot.id,
      ),
    );
  }

  const leisureProposals = buildLeisureProposals({
    durationMinutes: slotMinutes,
    slotHour: hour,
    planningContext: context,
    slotId: slot.id,
    workoutCompletedToday: lifeContext.workoutCompletedToday,
  });

  for (const leisure of leisureProposals) {
    if (!canPropose("leisure")) continue;
    candidates.push({
      ...leisure,
      score: leisure.priority === "high" ? 62 : leisure.priority === "medium" ? 52 : 40,
    });
  }

  if ((lifeContext.restDay || lifeContext.vacation) && canPropose("rest")) {
    candidates.push(
      buildCandidate(
        "rest",
        "Repos",
        "Lecture, sieste ou rien du tout — sans culpabiliser.",
        20,
        lifeContext.restDay
          ? "Journée sans travail — le repos est légitime."
          : "Vacances — préserve du vrai repos.",
        35,
        slot.id,
      ),
    );
  }

  const keepFree: LifeProposal = {
    id: `keep-free-${slot.id}`,
    category: "keep_free",
    title: "Garder ce temps libre",
    description: "Ne rien prévoir et conserver ce créneau disponible.",
    durationMinutes: 0,
    reason: "Toujours possible de préserver du repos réel.",
    priority: "high",
    slotId: slot.id,
  };

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const diverse: Candidate[] = [];
  const seen = new Set<LifeProposalCategory>();

  for (const candidate of sorted) {
    if (seen.has(candidate.category)) continue;
    seen.add(candidate.category);
    diverse.push(candidate);
    if (diverse.length >= MAX_SLOT_SUGGESTIONS - 1) break;
  }

  const rawProposals = [
    ...diverse.map(({ score: _score, ...proposal }) => proposal),
    keepFree,
  ].slice(0, MAX_SLOT_SUGGESTIONS);

  const reasoned = reasonAboutProposals({
    proposals: rawProposals,
    lifeContext,
    planningContext: context,
    habitProfile,
    statistics,
    tasks,
    slot:
      "score" in slot
        ? (slot as ScoredFreeSlot)
        : undefined,
  });

  return [...reasoned].sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
  );
}

export function generateLifeProposalsFromSlots({
  lifeContext,
  context,
  usage,
  tasks = [],
}: {
  lifeContext: LifeContext;
  context: PlanningContext;
  usage: DailyActivityUsage;
  tasks?: TaskRecord[];
}): LifeProposal[] {
  const topSlots = [...lifeContext.freeSlots]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const merged = new Map<string, LifeProposal>();

  for (const slot of topSlots) {
    for (const proposal of generateSlotActivitySuggestions({
      slot,
      lifeContext,
      context,
      usage,
      tasks,
    })) {
      if (!merged.has(proposal.category)) {
        merged.set(proposal.category, proposal);
      }
    }
  }

  const keepFree = [...merged.values()].find((item) => item.category === "keep_free");
  const activities = [...merged.values()]
    .filter((item) => item.category !== "keep_free")
    .slice(0, MAX_SLOT_SUGGESTIONS - 1);

  return [...activities, ...(keepFree ? [keepFree] : [])];
}
