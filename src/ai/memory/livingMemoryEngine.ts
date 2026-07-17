import type { CalendarItemRecord } from "../../types/database";
import type { DailyCheckinRecord } from "../../types/dailyCheckin";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type {
  LivingInsightStatus,
  LivingMemory,
} from "../../types/livingMemory";
import type { LifeContext } from "../../types/lifeContext";
import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";
import { buildLivingHabitProfile } from "./buildLivingHabitProfile";
import { detectHabitTrends } from "./habitTrendEngine";
import {
  applyLivingInsightFeedback,
  generateLivingInsights,
  partitionInsights,
} from "./generateLivingInsights";
import {
  buildAdaptiveSuggestions,
  buildEvolvingGoalSuggestions,
} from "./adaptiveDurationEngine";
import { generateDailyMission } from "./dailyMissionEngine";
import { generateWeeklyMission } from "./weeklyMissionEngine";
import {
  computeGlobalConfidence,
  resolveCoachPersonality,
  resolveKnowledgeLevel,
} from "./knowledgeLevelEngine";

export type BuildLivingMemoryInput = {
  userId: string;
  referenceDate: string;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
  checkins: DailyCheckinRecord[];
  statistics?: PeriodStatistics | null;
  lifeContext?: LifeContext | null;
  userCorrections?: Record<string, LivingInsightStatus>;
  insightMeta?: Record<string, { firstSeen?: string; lastConfirmed?: string }>;
  accountAgeDays?: number;
};

export function buildLivingMemory(input: BuildLivingMemoryInput): LivingMemory {
  const {
    userId,
    referenceDate,
    calendarItems,
    taskActivityEvents,
    checkins,
    statistics = null,
    lifeContext = null,
    userCorrections = {},
    insightMeta = {},
    accountAgeDays = 0,
  } = input;

  const habitProfile = buildLivingHabitProfile({
    calendarItems,
    taskActivityEvents,
    checkins,
  });

  const trends = detectHabitTrends({
    calendarItems,
    taskActivityEvents,
    habitProfile,
  });

  const insights = generateLivingInsights({
    userId,
    calendarItems,
    taskActivityEvents,
    checkins,
    habitProfile,
    trends,
    userCorrections,
    insightMeta,
  });

  const { recentlyLearned, stillLearning, uncertain } = partitionInsights(insights);
  const confirmedInsights = insights.filter(
    (insight) => insight.status === "confirmed",
  ).length;
  const dataPointCount =
    taskActivityEvents.length + calendarItems.length + checkins.length;

  const knowledgeLevel = resolveKnowledgeLevel({
    dataPointCount,
    accountAgeDays,
    confirmedInsights,
    insights,
  });

  return {
    userId,
    habitProfile,
    insights,
    trends,
    knowledgeLevel,
    globalConfidence: computeGlobalConfidence(insights),
    coachPersonality: resolveCoachPersonality(knowledgeLevel),
    dailyMission: generateDailyMission({
      referenceDate,
      lifeContext,
      habitProfile,
      insights,
      trends,
      statistics,
      checkins,
    }),
    weeklyMission: generateWeeklyMission({
      referenceDate,
      habitProfile,
      trends,
      statistics,
    }),
    adaptiveSuggestions: buildAdaptiveSuggestions(habitProfile),
    goalSuggestions: buildEvolvingGoalSuggestions({ habitProfile, statistics }),
    recentlyLearned,
    stillLearning,
    uncertain,
    updatedAt: new Date().toISOString(),
  };
}

export function applyInsightFeedbackToLivingMemory(
  memory: LivingMemory,
  insightId: string,
  status: LivingInsightStatus,
): LivingMemory {
  const insights = applyLivingInsightFeedback(memory.insights, insightId, status);
  const { recentlyLearned, stillLearning, uncertain } = partitionInsights(insights);
  const confirmedInsights = insights.filter(
    (insight) => insight.status === "confirmed",
  ).length;

  const knowledgeLevel = resolveKnowledgeLevel({
    dataPointCount: insights.reduce(
      (sum, insight) => sum + insight.evidenceCount,
      0,
    ),
    accountAgeDays: 0,
    confirmedInsights,
    insights,
  });

  return {
    ...memory,
    insights,
    recentlyLearned,
    stillLearning,
    uncertain,
    knowledgeLevel,
    globalConfidence: computeGlobalConfidence(insights),
    coachPersonality: resolveCoachPersonality(knowledgeLevel),
    updatedAt: new Date().toISOString(),
  };
}

export { applyLivingInsightFeedback } from "./generateLivingInsights";
