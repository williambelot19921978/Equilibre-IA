import { generateWorkoutSession } from "../../ai/workoutGenerationEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { LifeContext } from "../../types/lifeContext";
import type { SportPreferences } from "../../types/sportPreferences";
import { DEFAULT_SPORT_PREFERENCES } from "../../types/sportPreferences";
import type { WorkoutSession } from "../../types/workoutSession";
import type { DayTimelineEntry } from "./displayedDayTimeline";
import { isMorningSlotBeforeWork } from "./resolveMorningWorkoutAutomaticallyAllowed";
import { resolveRecommendedSportDuration } from "./resolveSportDuration";

function slotDurationMinutes(entry: DayTimelineEntry): number {
  return Math.max(
    5,
    Math.round(
      (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) / 60_000,
    ) - 5,
  );
}

export function shouldAttachSportProposal({
  entry,
  lifeContext,
  planningContext,
}: {
  entry: DayTimelineEntry;
  lifeContext?: LifeContext;
  planningContext?: PlanningContext;
}): boolean {
  if (entry.blockKind !== "free_slot") return false;
  if (entry.proposedWorkoutSession) return false;

  const minutes = slotDurationMinutes(entry);
  if (minutes < 5) return false;

  const hour = new Date(entry.startsAt).getHours();
  if (hour >= 22) return false;

  if (lifeContext && !lifeContext.morningWorkoutAutomaticallyAllowed) {
    const workStart = planningContext?.workStart ?? "09:00";
    if (
      isMorningSlotBeforeWork({
        slotStartsAt: entry.startsAt,
        workStartTime: workStart,
        date: lifeContext.date,
      })
    ) {
      return false;
    }
  }

  if (lifeContext && !lifeContext.sportPossible) return false;
  if (lifeContext?.workoutCompletedToday) return false;

  const hasSportProposal = lifeContext?.proposals.some(
    (proposal) => proposal.category === "sport" && proposal.durationMinutes <= minutes,
  );

  if (hasSportProposal) return true;

  if (planningContext?.mainPriority === "sport" && minutes >= 10) return true;

  if (minutes >= 15 && hour < 21 && lifeContext?.energyPrediction !== "low") {
    return true;
  }

  return false;
}

export function buildSportProposalForEntry({
  entry,
  planningContext,
  lifeContext,
  preferences = DEFAULT_SPORT_PREFERENCES,
  recentSeeds = [],
  forceDifferent = false,
  generationSeed,
  levelOverride,
  typeOverride,
}: {
  entry: DayTimelineEntry;
  planningContext?: PlanningContext;
  lifeContext?: LifeContext;
  preferences?: SportPreferences;
  recentSeeds?: string[];
  forceDifferent?: boolean;
  generationSeed?: string;
  levelOverride?: import("../../types/workoutSession").WorkoutLevel;
  typeOverride?: import("../../types/workoutSession").WorkoutSessionType;
}): WorkoutSession {
  const slotMinutes = slotDurationMinutes(entry);
  const hour = new Date(entry.startsAt).getHours();
  const energy =
    planningContext?.profile.afterWorkEnergy ?? lifeContext?.energyPrediction;

  const durationMinutes = resolveRecommendedSportDuration({
    slotMinutes,
    energy: energy === "high" ? "high" : energy === "low" ? "low" : "medium",
    type: typeOverride ?? preferences.preferredTypes[0],
    preferredMinutes: preferences.preferredDurationMinutes,
  });

  return generateWorkoutSession({
    durationMinutes: Math.min(durationMinutes, slotMinutes),
    level: levelOverride ?? preferences.level,
    type: typeOverride,
    slotHour: hour,
    energy: energy === "high" ? "high" : energy === "low" ? "low" : "medium",
    fatigueLevel:
      lifeContext?.energyPrediction === "low" || planningContext?.profile.afterWorkEnergy === "low"
        ? "high"
        : "medium",
    preferences,
    recentSeeds,
    forceDifferent,
    generationSeed: generationSeed ?? `${entry.id}-${entry.startsAt.slice(0, 10)}`,
  });
}

export function applySportProposalOverrides(
  entries: DayTimelineEntry[],
  proposalOverrides: Record<string, WorkoutSession>,
): DayTimelineEntry[] {
  if (Object.keys(proposalOverrides).length === 0) {
    return entries;
  }

  return entries.map((entry) => {
    const session = proposalOverrides[entry.id];
    if (!session) return entry;

    return {
      ...entry,
      proposedWorkoutSession: session,
      title: "Activité sportive proposée",
      explanation: session.generatedReason,
    };
  });
}

export function attachSportProposalsToTimeline({
  entries,
  planningContext,
  lifeContext,
  preferences,
  proposalOverrides = {},
}: {
  entries: DayTimelineEntry[];
  planningContext?: PlanningContext;
  lifeContext?: LifeContext;
  preferences?: SportPreferences;
  proposalOverrides?: Record<string, WorkoutSession>;
}): DayTimelineEntry[] {
  let automaticSportAttached = false;

  return entries.map((entry) => {
    if (proposalOverrides[entry.id]) {
      automaticSportAttached = true;
      return {
        ...entry,
        proposedWorkoutSession: proposalOverrides[entry.id],
        title: "Activité sportive proposée",
        explanation: proposalOverrides[entry.id].generatedReason,
      };
    }

    if (automaticSportAttached) {
      return entry;
    }

    if (!shouldAttachSportProposal({ entry, lifeContext, planningContext })) {
      return entry;
    }

    automaticSportAttached = true;
    const session = buildSportProposalForEntry({
      entry,
      planningContext,
      lifeContext,
      preferences,
    });

    return {
      ...entry,
      proposedWorkoutSession: session,
      title: "Activité sportive proposée",
      explanation: session.generatedReason,
    };
  });
}
