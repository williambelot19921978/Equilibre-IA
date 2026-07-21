/**
 * P1 — Vertical orchestrator composing existing engines (no new motor).
 *
 * Pipeline: slot → suggestions (Recommendation) → exploitability → Decision → message (Reasoning copy)
 */

import { generateFreeTimeSuggestions } from "../../ai/freeTimeSuggestionEngine";
import type { PlanningContext, HouseholdMemoryContext } from "../../ai/memoryEngine";
import { reasonAboutLifeProposal } from "../../ai/reasoning/lifeReasoner";
import { validatePlannedBlockCore } from "../../ai/engines/decision/decisionEngineCore";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { FreeTimeSuggestion } from "../../types/freeTimeSuggestion";
import type { PlannedBlock } from "../../types/planning";
import {
  resolveRecommendedStudyRevisionDuration,
  validateStudyRevisionDuration,
} from "../planning/resolveStudyRevisionDuration";
import {
  formatStudyRecommendationMessage,
  resolveStudyActivityLabel,
} from "./formatStudyRecommendationMessage";

export type StudySlotRecommendation = {
  readonly entry: DayTimelineEntry;
  readonly suggestion: FreeTimeSuggestion;
  readonly message: string;
  readonly durationMinutes: number;
  readonly decisionApproved: boolean;
  readonly decisionReason: string;
};

const MIN_STUDY_SLOT_MINUTES = 15;

function slotMinutesFromEntry(entry: DayTimelineEntry): number {
  return Math.round(
    (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
      60_000,
  );
}

function pickStudySuggestion(
  suggestions: FreeTimeSuggestion[],
): FreeTimeSuggestion | null {
  const studySuggestions = suggestions.filter((item) => item.type === "study");
  if (studySuggestions.length === 0) return null;

  return (
    studySuggestions.find((item) => item.isPrimaryRecommendation) ??
    studySuggestions[0]
  );
}

function isSlotExploitable(
  slotMinutes: number,
  planningContext: PlanningContext,
): boolean {
  if (slotMinutes < MIN_STUDY_SLOT_MINUTES) return false;

  const hour = new Date().getHours();
  const duration = resolveRecommendedStudyRevisionDuration({
    slotMinutes,
    preferredFocusMinutes: planningContext.profile.preferredFocusMinutes ?? 30,
    energy: planningContext.profile.afterWorkEnergy ?? "medium",
    hour,
  });

  return validateStudyRevisionDuration(duration, slotMinutes).valid;
}

function buildProposedStudyBlock(
  entry: DayTimelineEntry,
  suggestion: FreeTimeSuggestion,
  durationMinutes: number,
): PlannedBlock {
  const endsAt = new Date(
    new Date(entry.startsAt).getTime() + durationMinutes * 60_000,
  ).toISOString();

  return {
    id: `p1-study-${suggestion.id}`,
    blockType: "task",
    title: suggestion.title,
    startsAt: entry.startsAt,
    endsAt,
    taskId: typeof suggestion.optionalContent?.taskId === "string"
      ? suggestion.optionalContent.taskId
      : undefined,
    category: "studies",
    locked: false,
    source: "engine",
    explanation: {
      summary: suggestion.reason,
      facts: [],
      confidence: "estimated",
    },
    energyLevel: "medium",
  };
}

function validateWithDecisionEngine(
  entry: DayTimelineEntry,
  suggestion: FreeTimeSuggestion,
  durationMinutes: number,
  planningContext: PlanningContext,
  slotMinutes: number,
): { approved: boolean; reason: string } {
  const block = buildProposedStudyBlock(entry, suggestion, durationMinutes);
  const result = validatePlannedBlockCore({
    block,
    context: planningContext,
    existingBlocks: [],
    totalFreeMinutes: slotMinutes,
    plannedMinutes: 0,
  });

  return { approved: result.valid, reason: result.reason };
}

function resolveTimingHint(
  suggestion: FreeTimeSuggestion,
  entry: DayTimelineEntry,
  planningContext: PlanningContext,
): string | undefined {
  const lifeContext = planningContext.lifeContext;
  if (!lifeContext) {
    return suggestion.explanation ?? undefined;
  }

  const slotMinutes = slotMinutesFromEntry(entry);
  const decision = reasonAboutLifeProposal({
    proposal: {
      id: suggestion.id,
      slotId: entry.id,
      category: "study",
      title: suggestion.title,
      description: suggestion.description,
      durationMinutes: suggestion.recommendedDuration,
      reason: suggestion.reason,
      priority: suggestion.priority,
      taskId:
        typeof suggestion.optionalContent?.taskId === "string"
          ? suggestion.optionalContent.taskId
          : undefined,
    },
    slot: {
      id: entry.id,
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      durationMinutes: slotMinutes,
      slotKind: entry.freeSlotKind ?? "day",
      score: suggestion.confidence ?? 70,
      scoreReason: suggestion.reason,
    },
    lifeContext,
    planningContext,
  });

  return decision.explanation.whyNow || decision.explanation.why;
}

export function findFirstStudyFreeSlot(
  timeline: DayTimelineEntry[],
): DayTimelineEntry | null {
  for (const entry of timeline) {
    if (entry.blockKind !== "free_slot") continue;
    if (slotMinutesFromEntry(entry) < MIN_STUDY_SLOT_MINUTES) continue;
    return entry;
  }

  return null;
}

export function buildStudySlotRecommendation({
  entry,
  date,
  planningContext,
  memoryContext = null,
  tasks = [],
  calendarItems = [],
  taskActivityEvents = [],
}: {
  entry: DayTimelineEntry;
  date: string;
  planningContext: PlanningContext;
  memoryContext?: HouseholdMemoryContext | null;
  tasks?: TaskRecord[];
  calendarItems?: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
}): StudySlotRecommendation | null {
  const slotMinutes = slotMinutesFromEntry(entry);

  if (!isSlotExploitable(slotMinutes, planningContext)) {
    return null;
  }

  const slot = {
    id: entry.id,
    startsAt: entry.startsAt,
    endsAt: entry.endsAt,
    durationMinutes: slotMinutes,
    slotKind: entry.freeSlotKind,
  };

  const suggestions = generateFreeTimeSuggestions({
    slot,
    date,
    planningContext,
    memoryContext,
    tasks,
    calendarItems,
    taskActivityEvents,
    primarySuggestion: entry.primarySuggestion,
  });

  const suggestion = pickStudySuggestion(suggestions);
  if (!suggestion) return null;

  const durationMinutes = resolveRecommendedStudyRevisionDuration({
    slotMinutes,
    preferredFocusMinutes: planningContext.profile.preferredFocusMinutes ?? 30,
    energy: planningContext.profile.afterWorkEnergy ?? "medium",
    hour: new Date(entry.startsAt).getHours(),
  });

  const decision = validateWithDecisionEngine(
    entry,
    suggestion,
    durationMinutes,
    planningContext,
    slotMinutes,
  );

  if (!decision.approved) {
    return null;
  }

  const taskTitle =
    suggestion.studyProgress?.taskTitle ??
    (typeof suggestion.optionalContent?.taskTitle === "string"
      ? suggestion.optionalContent.taskTitle
      : undefined);

  const message = formatStudyRecommendationMessage({
    slotMinutes,
    activityLabel: resolveStudyActivityLabel(taskTitle, suggestion.title),
    timingHint: resolveTimingHint(suggestion, entry, planningContext),
  });

  return {
    entry,
    suggestion: {
      ...suggestion,
      recommendedDuration: durationMinutes,
    },
    message,
    durationMinutes,
    decisionApproved: decision.approved,
    decisionReason: decision.reason,
  };
}
