/**
 * EPIC1-A — Recommendation candidates (Decision + Reasoning + Recommendation engines).
 */

import type { PlanningContext, HouseholdMemoryContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { LifeContext } from "../../types/lifeContext";
import { reasonAboutLifeProposal } from "../../ai/reasoning/lifeReasoner";
import { isSportTimelineEntry } from "../workout/openWorkoutSessionForBlock";
import {
  buildStudySlotRecommendation,
  findFirstStudyFreeSlot,
} from "../recommendations/buildStudySlotRecommendation";
import {
  analyzeDayForBrief,
  isAfternoonDense,
  type DayBriefAnalysis,
} from "./analyzeDayForBrief";
import {
  buildSportExplainabilityReasonCodes,
  buildStudyExplainabilityReasonCodes,
  buildTimeRiskExplainabilityReasonCodes,
} from "../explainability/buildExplainabilityReasonCodes";
import type { ExplainabilityReasonCode } from "../explainability/explainabilityReasonCodes";
import {
  formatSportBriefExplanation,
  formatStudyBriefExplanation,
  formatTimeRiskExplanation,
} from "./formatDailyBriefMessage";
import type { UserGoal } from "../../types/goal";

export type DailyBriefRecommendationKind = "study" | "sport" | "time";

export type DailyBriefActionTarget = "planning";

export type DailyBriefRecommendation = {
  readonly id: string;
  readonly kind: DailyBriefRecommendationKind;
  readonly icon: string;
  readonly title: string;
  readonly explanation: string;
  readonly actionLabel?: string;
  readonly actionTarget?: DailyBriefActionTarget;
  readonly entryId?: string;
  readonly priority: number;
  readonly decisionApproved: boolean;
  readonly reasoningHint?: string;
  readonly explainabilityReasonCodes: ExplainabilityReasonCode[];
  readonly associatedGoalName?: string;
  readonly associatedStepTitle?: string;
};

const MAX_RECOMMENDATIONS = 3;

function slotMinutes(entry: DayTimelineEntry): number {
  return Math.round(
    (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
      60_000,
  );
}

function buildStudyRecommendation(input: {
  timeline: DayTimelineEntry[];
  date: string;
  planningContext: PlanningContext;
  memoryContext: HouseholdMemoryContext | null;
  tasks: TaskRecord[];
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
}): DailyBriefRecommendation | null {
  const entry = findFirstStudyFreeSlot(input.timeline);
  if (!entry) return null;

  const recommendation = buildStudySlotRecommendation({
    entry,
    date: input.date,
    planningContext: input.planningContext,
    memoryContext: input.memoryContext,
    tasks: input.tasks,
    calendarItems: input.calendarItems,
    taskActivityEvents: input.taskActivityEvents,
  });

  if (!recommendation?.decisionApproved) return null;

  let reasoningHint: string | undefined;
  let reasoningFactors = undefined as
    | ReturnType<typeof reasonAboutLifeProposal>["factors"]
    | undefined;
  const lifeContext = input.planningContext.lifeContext;
  if (lifeContext) {
    const decision = reasonAboutLifeProposal({
      proposal: {
        id: recommendation.suggestion.id,
        slotId: entry.id,
        category: "study",
        title: recommendation.suggestion.title,
        description: recommendation.suggestion.description,
        durationMinutes: recommendation.durationMinutes,
        reason: recommendation.suggestion.reason,
        priority: recommendation.suggestion.priority,
      },
      slot: {
        id: entry.id,
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
        durationMinutes: slotMinutes(entry),
        slotKind: entry.freeSlotKind ?? "day",
        score: recommendation.suggestion.confidence ?? 70,
        scoreReason: recommendation.suggestion.reason,
      },
      lifeContext,
      planningContext: input.planningContext,
    });
    reasoningHint =
      decision.explanation.whyNow ||
      decision.explanation.why ||
      recommendation.decisionReason;
    reasoningFactors = decision.factors;
  }

  const slotDuration = slotMinutes(entry);
  const explainabilityReasonCodes = buildStudyExplainabilityReasonCodes({
    decisionApproved: recommendation.decisionApproved,
    slotMinutes: slotDuration,
    requiredMinutes: recommendation.durationMinutes,
    priority: recommendation.suggestion.priority,
    reasoningFactors,
  });

  const explanation = formatStudyBriefExplanation(recommendation.message);
  const finalExplanation = reasoningHint
    ? `${explanation}\n\n${reasoningHint}`
    : explanation;

  return {
    id: `daily-brief-study-${entry.id}`,
    kind: "study",
    icon: "📚",
    title: "Études",
    explanation: finalExplanation,
    actionLabel: "Voir",
    actionTarget: "planning",
    entryId: entry.id,
    priority: 100,
    decisionApproved: true,
    reasoningHint,
    explainabilityReasonCodes,
  };
}

function buildSportRecommendation(
  timeline: DayTimelineEntry[],
  lifeContext: LifeContext | null | undefined,
): DailyBriefRecommendation | null {
  if (lifeContext?.workoutCompletedToday) {
    return {
      id: "daily-brief-sport-done",
      kind: "sport",
      icon: "🏃",
      title: "Sport",
      explanation: formatSportBriefExplanation("completed"),
      priority: 75,
      decisionApproved: true,
      explainabilityReasonCodes: buildSportExplainabilityReasonCodes({
        variant: "completed",
      }),
    };
  }

  const sportEntry = timeline.find(
    (entry) =>
      isSportTimelineEntry(entry) &&
      !entry.completed &&
      entry.blockKind !== "free_slot",
  );

  if (!sportEntry) return null;

  return {
    id: `daily-brief-sport-${sportEntry.id}`,
    kind: "sport",
    icon: "🏃",
    title: "Sport",
    explanation: formatSportBriefExplanation("scheduled"),
    actionLabel: "Voir",
    actionTarget: "planning",
    entryId: sportEntry.id,
    priority: 80,
    decisionApproved: true,
    explainabilityReasonCodes: buildSportExplainabilityReasonCodes({
      variant: "scheduled",
    }),
  };
}

function buildTimeRiskRecommendation(
  analysis: DayBriefAnalysis,
): DailyBriefRecommendation | null {
  if (!isAfternoonDense(analysis)) return null;

  return {
    id: "daily-brief-time-risk",
    kind: "time",
    icon: "⚠",
    title: "Temps",
    explanation: formatTimeRiskExplanation(),
    priority: 55,
    decisionApproved: true,
    explainabilityReasonCodes: buildTimeRiskExplainabilityReasonCodes(),
  };
}

export function buildDailyBriefRecommendations(input: {
  timeline: DayTimelineEntry[];
  date: string;
  planningContext: PlanningContext;
  memoryContext?: HouseholdMemoryContext | null;
  tasks?: TaskRecord[];
  calendarItems?: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
  goals?: UserGoal[];
}): DailyBriefRecommendation[] {
  const analysis = analyzeDayForBrief(input.timeline);
  const candidates: DailyBriefRecommendation[] = [];

  const study = buildStudyRecommendation({
    timeline: input.timeline,
    date: input.date,
    planningContext: input.planningContext,
    memoryContext: input.memoryContext ?? null,
    tasks: input.tasks ?? [],
    calendarItems: input.calendarItems ?? [],
    taskActivityEvents: input.taskActivityEvents ?? [],
  });
  if (study) candidates.push(study);

  const sport = buildSportRecommendation(
    input.timeline,
    input.planningContext.lifeContext,
  );
  if (sport) candidates.push(sport);

  const timeRisk = buildTimeRiskRecommendation(analysis);
  if (timeRisk) candidates.push(timeRisk);

  return candidates
    .filter((item) => item.decisionApproved)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_RECOMMENDATIONS);
}

export { MAX_RECOMMENDATIONS };
