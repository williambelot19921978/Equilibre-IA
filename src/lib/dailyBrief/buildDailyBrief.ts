/**
 * EPIC1-A — Daily Brief product orchestrator (no new motor).
 */

import type { PlanningContext, HouseholdMemoryContext } from "../../ai/memoryEngine";
import {
  isGoalProgressAssistantEnabled,
  isGoalsEnabled,
} from "../../config/featureFlags";
import { buildGoalBriefInsight } from "../goals/buildGoalBriefInsight";
import { buildGoalProgressInsight } from "../goals/buildGoalProgressInsight";
import { enrichRecommendationsWithGoalContext } from "../goals/enrichRecommendationsWithGoalContext";
import { resolvePrimaryGoalNextAction } from "../goals/resolveGoalNextAction";
import type { UserGoal } from "../../types/goal";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import { analyzeDayForBrief } from "./analyzeDayForBrief";
import {
  buildDailyBriefRecommendations,
  type DailyBriefRecommendation,
} from "./buildDailyBriefRecommendations";
import {
  formatDailyBriefGreeting,
  formatDailyBriefSynthesis,
} from "./formatDailyBriefMessage";

export type DailyBrief = {
  readonly briefId: string;
  readonly date: string;
  readonly greeting: string;
  readonly synthesis: string;
  readonly goalInsight: string | null;
  readonly recommendations: DailyBriefRecommendation[];
};

export function buildDailyBrief({
  firstName,
  date,
  timeline,
  planningContext,
  memoryContext = null,
  tasks = [],
  calendarItems = [],
  taskActivityEvents = [],
  goals = [],
  semanticHints = [],
}: {
  firstName: string;
  date: string;
  timeline: DayTimelineEntry[];
  planningContext: PlanningContext | null;
  memoryContext?: HouseholdMemoryContext | null;
  tasks?: TaskRecord[];
  calendarItems?: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
  goals?: UserGoal[];
  semanticHints?: readonly string[];
}): DailyBrief | null {
  if (!planningContext) return null;

  try {
    const analysis = analyzeDayForBrief(timeline);
    const assistantEnabled =
      isGoalsEnabled() && isGoalProgressAssistantEnabled() && goals.length > 0;
    const primaryNextAction = assistantEnabled
      ? resolvePrimaryGoalNextAction(goals, tasks)
      : null;

    let recommendations = buildDailyBriefRecommendations({
      timeline,
      date,
      planningContext,
      memoryContext,
      tasks,
      calendarItems,
      taskActivityEvents,
      goals,
    });

    if (assistantEnabled) {
      recommendations = enrichRecommendationsWithGoalContext(
        recommendations,
        goals,
        tasks,
        primaryNextAction,
      );
    }

    const goalInsight =
      isGoalsEnabled() && goals.length > 0
        ? assistantEnabled
          ? buildGoalProgressInsight(goals, tasks)
          : buildGoalBriefInsight(goals, tasks)
        : null;

    const semanticSuffix =
      semanticHints.length > 0 ? ` ${semanticHints.slice(0, 2).join(" ")}` : "";

    return {
      briefId: `daily-brief-${date}`,
      date,
      greeting: formatDailyBriefGreeting(firstName),
      synthesis: `${formatDailyBriefSynthesis(analysis)}${semanticSuffix}`,
      goalInsight,
      recommendations,
    };
  } catch {
    return null;
  }
}
