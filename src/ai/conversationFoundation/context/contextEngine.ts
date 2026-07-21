/**
 * EPIC 4A — Context Engine
 * Aggregates user context via existing services only (no direct Supabase).
 */

import { buildDailyBrief } from "../../../lib/dailyBrief/buildDailyBrief";
import {
  isAdaptiveIntelligenceEnabled,
  isDailyBriefEnabled,
  isGoalsEnabled,
  isPlanningCalendarEngineEnabled,
  isProactiveIntelligenceEnabled,
  isDailyStateEngineEnabled,
  isLifeKnowledgeEngineEnabled,
  isPersonalCoachEngineEnabled,
  isSemanticPlanningEngineEnabled,
} from "../../../config/featureFlags";
import { defaultPlanningCalendarEngine } from "../../../planningCalendarEngine";
import {
  createEmptyAdaptiveSnapshot,
  defaultAdaptiveIntelligenceEngine,
  recommendationConfidenceFromPreferences,
} from "../../../adaptiveIntelligenceEngine";
import {
  createEmptySemanticSnapshot,
  defaultSemanticPlanningEngine,
  mentalLoadFromSemantic,
} from "../../../semanticPlanningEngine";
import {
  createEmptyProactiveSnapshot,
  defaultProactiveIntelligenceEngine,
} from "../../../proactiveIntelligenceEngine";
import {
  createEmptyDailyStateSnapshot,
  defaultDailyStateEngine,
  semanticFatigueInsight,
} from "../../../dailyStateEngine";
import {
  createEmptyPersonalCoachSnapshot,
  defaultPersonalCoachEngine,
} from "../../../personalCoachEngine";
import {
  createEmptyLifeKnowledgeSnapshot,
  defaultLifeKnowledgeEngine,
  getKnowledgeLabelsForCoach,
} from "../../../lifeKnowledgeEngine";
import { getCurrentDeviceDate } from "../../../lib/time/deviceClock";
import type { UserGoal } from "../../../types/goal";
import type {
  AssistantAdaptiveIntelligenceSnapshot,
  AssistantProactiveIntelligenceSnapshot,
  AssistantDailyStateSnapshot,
  AssistantPersonalCoachSnapshot,
  AssistantLifeKnowledgeSnapshot,
  AssistantConversationContext,
  ContextSourceRef,
} from "../types/assistantContext";
import type { ContextEngineDependencies } from "./contextEngineDependencies";
import { defaultContextEngineDependencies } from "./contextEngineDependencies";

function source(id: string, label: string, available: boolean): ContextSourceRef {
  return { id, label, available };
}

async function safe<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<{ value: T; available: boolean }> {
  try {
    return { value: await loader(), available: true };
  } catch (error) {
    console.warn(`[ContextEngine] ${label} indisponible`, error);
    return { value: fallback, available: false };
  }
}

export type BuildAssistantContextInput = {
  readonly userId: string;
  readonly date?: string;
  readonly firstName?: string;
};

export async function buildAssistantContext(
  input: BuildAssistantContextInput,
  deps: ContextEngineDependencies = defaultContextEngineDependencies,
): Promise<AssistantConversationContext> {
  const date = input.date ?? getCurrentDeviceDate();
  const gaps: string[] = [];
  const sources: ContextSourceRef[] = [];

  const profileResult = await safe("profile", () => deps.getUserProfile(input.userId), null);
  sources.push(source("profile", "Profil utilisateur", profileResult.available));

  const membershipResult = await safe(
    "household",
    () => deps.getHouseholdMembership(input.userId),
    null,
  );
  sources.push(source("household", "Foyer", membershipResult.available));

  const memoryResult = await safe(
    "memory",
    () => deps.loadHouseholdMemoryContext(input.userId),
    null,
  );
  sources.push(source("memory", "Mémoire foyer", memoryResult.available));

  const membersResult = membershipResult.value
    ? await safe(
        "members",
        () => deps.getHouseholdMembers(membershipResult.value!.household_id),
        [],
      )
    : { value: [], available: false };
  sources.push(source("members", "Membres du foyer", membersResult.available));

  const childrenResult = membershipResult.value
    ? await safe(
        "children",
        () => deps.getChildrenByHousehold(membershipResult.value!.household_id),
        [],
      )
    : { value: [], available: false };
  sources.push(source("children", "Enfants", childrenResult.available));

  const planningContextResult = await safe(
    "planningContext",
    () => deps.loadPlanningContextForDate({ userId: input.userId, date }),
    null,
  );
  sources.push(
    source("planningContext", "Contexte planning", planningContextResult.available),
  );

  const dayPlanResult = planningContextResult.value
    ? await safe(
        "dayPlan",
        async () => {
          const loaded = await deps.loadDisplayedDayPlan({
            userId: input.userId,
            date,
          });
          return loaded?.plan ?? null;
        },
        null,
      )
    : { value: null, available: false };
  sources.push(source("dayPlan", "Planning du jour", dayPlanResult.available));

  const tasksResult = await safe("tasks", () => deps.getUserTasks(input.userId), []);
  sources.push(source("tasks", "Tâches", tasksResult.available));

  const goalsEnabled = isGoalsEnabled();
  const goalsResult = goalsEnabled
    ? await safe("goals", async () => deps.getUserGoals(input.userId), [])
    : { value: [] as UserGoal[], available: false };
  sources.push(source("goals", "Objectifs", goalsEnabled && goalsResult.available));

  const livingMemoryResult = await safe(
    "livingMemory",
    () => deps.loadLivingMemory({ userId: input.userId, referenceDate: date }),
    null,
  );
  sources.push(source("livingMemory", "Mémoire utilisateur", livingMemoryResult.available));

  const habitProfileResult = await safe(
    "habits",
    () => deps.loadHabitProfile(input.userId),
    null,
  );
  sources.push(source("habits", "Habitudes", habitProfileResult.available));

  const profileFactsResult = await safe(
    "profileFacts",
    () => deps.loadProfileFactsSafe(input.userId),
    [],
  );
  sources.push(source("profileFacts", "Faits profil", profileFactsResult.available));

  const firstName = input.firstName ?? "Utilisateur";

  if (!membershipResult.value) gaps.push("Aucun foyer associé.");
  if (!planningContextResult.value) gaps.push("Contexte planning indisponible.");
  if (!dayPlanResult.value) gaps.push("Planning du jour non chargé.");
  if (tasksResult.value.length === 0) gaps.push("Aucune tâche disponible.");
  if (goalsEnabled && goalsResult.value.length === 0) {
    gaps.push("Aucun objectif actif.");
  }

  const todoTasks = tasksResult.value.filter((task) => task.status === "todo");
  const doneTasks = tasksResult.value.filter((task) => task.status === "done");

  let dailyBrief = null;

  let planningCalendar = {
    enabled: false,
    eventCount: 0,
    conflictCount: 0,
    freeMinutes: 0,
    busyMinutes: 0,
    providerCount: 0,
  };

  if (isPlanningCalendarEngineEnabled()) {
    const calendarResult = await safe("planningCalendar", async () => {
      const snapshot = await defaultPlanningCalendarEngine.getToday({
        userId: input.userId,
        householdId: membershipResult.value?.household_id ?? null,
        date,
      });
      return defaultPlanningCalendarEngine.deriveLoadMetrics(snapshot);
    }, null);
    sources.push(source("planningCalendar", "Planning & Calendar Engine", calendarResult.available));
    if (calendarResult.value) {
      planningCalendar = {
        enabled: true,
        eventCount: calendarResult.value.eventCount,
        conflictCount: calendarResult.value.conflictCount,
        freeMinutes: calendarResult.value.freeMinutes,
        busyMinutes: calendarResult.value.busyMinutes,
        providerCount: defaultPlanningCalendarEngine.getProviders().length,
      };
    }
  }

  let semanticPlanning = {
    enabled: false,
    mentalLoad: 0,
    physicalLoad: 0,
    balanceScore: 50,
    balanceSignals: [] as string[],
    insightMessages: [] as string[],
    briefHints: [] as string[],
    categoryDistribution: {} as Record<string, number>,
    averageConfidence: 0,
    freeMinutes: planningCalendar.freeMinutes,
    togetherMinutes: 0,
    personalMinutes: 0,
    workMinutes: 0,
    eventCount: 0,
  };

  if (isSemanticPlanningEngineEnabled() && isPlanningCalendarEngineEnabled()) {
    const semanticResult = await safe("semanticPlanning", async () => {
      return defaultSemanticPlanningEngine.analyze({
        userId: input.userId,
        householdId: membershipResult.value?.household_id ?? null,
        date,
        goals: goalsResult.value.slice(0, 5).map((goal) => ({
          id: goal.id,
          name: goal.name,
        })),
        childrenCount: childrenResult.value.length,
        memberCount: membersResult.value.length,
      });
    }, createEmptySemanticSnapshot(date));

    sources.push(source("semanticPlanning", "Semantic Planning Engine", semanticResult.available));

    if (semanticResult.value.enabled) {
      const snapshot = semanticResult.value;
      semanticPlanning = {
        enabled: true,
        mentalLoad: mentalLoadFromSemantic(snapshot.dailyLoad),
        physicalLoad: snapshot.dailyLoad.physicalLoad,
        balanceScore: snapshot.balance.daily.score,
        balanceSignals: [...snapshot.balance.daily.signals],
        insightMessages: snapshot.insights.map((insight) => insight.message),
        briefHints: snapshot.briefHints.map((hint) => hint.message),
        categoryDistribution: { ...snapshot.categoryDistribution },
        averageConfidence:
          snapshot.items.length > 0
            ? snapshot.items.reduce((sum, item) => sum + item.confidence, 0) /
              snapshot.items.length
            : 0,
        freeMinutes: planningCalendar.freeMinutes,
        togetherMinutes: snapshot.household.togetherMinutes,
        personalMinutes: snapshot.dailyLoad.personalMinutes,
        workMinutes: snapshot.dailyLoad.workMinutes,
        eventCount: snapshot.items.length,
      };
    }
  }

  if (isDailyBriefEnabled() && planningContextResult.value && memoryResult.value) {
    dailyBrief = buildDailyBrief({
      firstName,
      date,
      planningContext: planningContextResult.value,
      memoryContext: memoryResult.value,
      goals: goalsResult.value,
      tasks: tasksResult.value,
      timeline: [],
      semanticHints: semanticPlanning.briefHints,
    });
  }
  sources.push(source("dailyBrief", "Daily Brief", Boolean(dailyBrief)));

  let adaptiveIntelligence = {
    enabled: false,
    observationCount: 0,
    habitCount: 0,
    pendingProposalCount: 0,
    validatedPreferenceCount: 0,
    topHabits: [] as string[],
    pendingProposals: [] as AssistantAdaptiveIntelligenceSnapshot["pendingProposals"],
    validatedPreferences: [] as AssistantAdaptiveIntelligenceSnapshot["validatedPreferences"],
    phrasingHints: [] as readonly string[],
    timelineMessages: [] as readonly string[],
    learningConfidence: 0,
  };

  if (isAdaptiveIntelligenceEnabled() && isPlanningCalendarEngineEnabled()) {
    const adaptiveResult = await safe("adaptiveIntelligence", async () => {
      let calendarEvents: {
        id: string;
        title: string;
        start: string;
        end: string;
        category?: string;
        type?: string;
      }[] = [];

      if (isSemanticPlanningEngineEnabled()) {
        const semanticSnapshot = await defaultSemanticPlanningEngine.analyze({
          userId: input.userId,
          householdId: membershipResult.value?.household_id ?? null,
          date,
          goals: goalsResult.value.slice(0, 5).map((goal) => ({
            id: goal.id,
            name: goal.name,
          })),
          childrenCount: childrenResult.value.length,
          memberCount: membersResult.value.length,
        });
        calendarEvents = semanticSnapshot.items.map((item) => ({
          id: item.id,
          title: item.title,
          start: item.start,
          end: item.end,
          category: item.category,
          type: item.type,
        }));
      } else {
        const snapshot = await defaultPlanningCalendarEngine.getToday({
          userId: input.userId,
          householdId: membershipResult.value?.household_id ?? null,
          date,
        });
        calendarEvents = snapshot.timeline.items.map((item) => ({
          id: item.id,
          title: item.title,
          start: item.start,
          end: item.end,
          type: item.type,
        }));
      }

      return defaultAdaptiveIntelligenceEngine.analyze({
        userId: input.userId,
        date,
        calendarEvents,
      });
    }, createEmptyAdaptiveSnapshot(date));

    sources.push(source("adaptiveIntelligence", "Adaptive Intelligence Engine", adaptiveResult.available));

    if (adaptiveResult.value.enabled) {
      const snapshot = adaptiveResult.value;
      adaptiveIntelligence = {
        enabled: true,
        observationCount: snapshot.observations.length,
        habitCount: snapshot.habits.length,
        pendingProposalCount: snapshot.proposals.filter((prop) => prop.status === "pending").length,
        validatedPreferenceCount: snapshot.validatedPreferences.length,
        topHabits: snapshot.habits.slice(0, 3).map((habit) => habit.label),
        pendingProposals: snapshot.proposals
          .filter((prop) => prop.status === "pending")
          .slice(0, 5)
          .map((prop) => ({
            id: prop.id,
            label: prop.label,
            confidence: prop.confidence,
            proposedValue: prop.proposedValue,
          })),
        validatedPreferences: snapshot.validatedPreferences.map((prop) => ({
          id: prop.id,
          label: prop.label,
          proposedValue: prop.proposedValue,
          kind: prop.kind,
        })),
        phrasingHints: snapshot.phrasingHints,
        timelineMessages: snapshot.timeline.slice(0, 5).map((entry) => entry.message),
        learningConfidence: recommendationConfidenceFromPreferences({
          validatedPreferences: snapshot.validatedPreferences,
          habits: snapshot.habits,
        }),
      };
    }
  }

  let dailyState: AssistantDailyStateSnapshot = {
    enabled: false,
    hasCheckinToday: false,
    today: null,
    shouldRemind: false,
    phrasingHints: [],
    trendEnergy7d: 0,
    trendStress7d: 0,
  };

  if (isDailyStateEngineEnabled()) {
    const stateResult = await safe(
      "dailyState",
      async () => defaultDailyStateEngine.analyze(input.userId, date),
      createEmptyDailyStateSnapshot(date),
    );

    sources.push(source("dailyState", "Daily State Engine", stateResult.available));

    if (stateResult.value.enabled) {
      const snapshot = stateResult.value;
      dailyState = {
        enabled: true,
        hasCheckinToday: snapshot.hasCheckinToday,
        today: snapshot.today
          ? {
              date: snapshot.today.date,
              mood: snapshot.today.mood,
              energy: snapshot.today.energy,
              stress: snapshot.today.stress,
              sleepQuality: snapshot.today.sleepQuality,
              specialDay: snapshot.today.specialDay,
              confidence: snapshot.today.confidence,
            }
          : null,
        shouldRemind: snapshot.shouldRemind,
        reminderMessage: snapshot.reminderMessage,
        phrasingHints: snapshot.phrasingHints,
        trendEnergy7d: snapshot.trends7d.averageEnergy,
        trendStress7d: snapshot.trends7d.averageStress,
      };

      const fatigueInsight = semanticFatigueInsight(
        snapshot.today,
        semanticPlanning.mentalLoad,
      );
      if (fatigueInsight) {
        semanticPlanning = {
          ...semanticPlanning,
          insightMessages: [...semanticPlanning.insightMessages, fatigueInsight],
        };
      }
    }
  }

  let proactiveIntelligence: AssistantProactiveIntelligenceSnapshot = {
    enabled: false,
    displayableCount: 0,
    scheduledCount: 0,
    suggestionCount: 0,
    digestCount: 0,
    displayableSuggestions: [],
    behaviorMetrics: {
      interruptionTolerance: 0.6,
      notificationPreference: "balanced",
      acceptanceRate: 0.5,
      dismissRate: 0.2,
      preferredMoments: [],
    },
    lifeTransitionMessages: [],
    phrasingHints: [],
    timelineMessages: [],
  };

  if (isProactiveIntelligenceEnabled() && isPlanningCalendarEngineEnabled()) {
    const proactiveResult = await safe(
      "proactiveIntelligence",
      async () => {
        let calendarEvents: {
          id: string;
          title: string;
          start: string;
          end: string;
          category?: string;
          type?: string;
        }[] = [];

        if (semanticPlanning.enabled) {
          calendarEvents = (await defaultSemanticPlanningEngine.analyze({
            userId: input.userId,
            householdId: membershipResult.value?.household_id ?? null,
            date,
            goals: goalsResult.value.slice(0, 5).map((goal) => ({
              id: goal.id,
              name: goal.name,
            })),
            childrenCount: childrenResult.value.length,
            memberCount: membersResult.value.length,
          })).items.map((item) => ({
            id: item.id,
            title: item.title,
            start: item.start,
            end: item.end,
            category: item.category,
            type: item.type,
          }));
        } else if (planningCalendar.enabled) {
          const snapshot = await defaultPlanningCalendarEngine.getToday({
            userId: input.userId,
            householdId: membershipResult.value?.household_id ?? null,
            date,
          });
          calendarEvents = snapshot.timeline.items.map((item) => ({
            id: item.id,
            title: item.title,
            start: item.start,
            end: item.end,
            type: item.type,
          }));
        }

        const todoTasks = tasksResult.value.filter((task) => task.status !== "done");

        return defaultProactiveIntelligenceEngine.analyze({
          userId: input.userId,
          date,
          calendarEvents,
          mentalLoad: semanticPlanning.mentalLoad,
          balanceScore: semanticPlanning.balanceScore,
          freeMinutes: planningCalendar.freeMinutes,
          conflictCount: planningCalendar.conflictCount,
          topHabits: adaptiveIntelligence.topHabits,
          validatedPreferences: adaptiveIntelligence.validatedPreferences.map(
            (pref) => pref.label,
          ),
          activeGoals: goalsResult.value.slice(0, 3).map((goal) => ({
            id: goal.id,
            name: goal.name,
          })),
          taskTodoCount: todoTasks.length,
          dailyEnergy: dailyState.today?.energy,
          dailyStress: dailyState.today?.stress,
        });
      },
      createEmptyProactiveSnapshot(date),
    );

    sources.push(source("proactiveIntelligence", "Proactive Intelligence Engine", proactiveResult.available));

    if (proactiveResult.value.enabled) {
      const snapshot = proactiveResult.value;
      proactiveIntelligence = {
        enabled: true,
        displayableCount: snapshot.displayableSuggestions.length,
        scheduledCount: snapshot.suggestions.filter((s) => s.status === "scheduled").length,
        suggestionCount: snapshot.suggestions.length,
        digestCount: snapshot.digests.length,
        displayableSuggestions: snapshot.displayableSuggestions.slice(0, 5).map((suggestion) => ({
          id: suggestion.id,
          title: suggestion.title,
          kind: suggestion.kind,
          score: suggestion.score,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          preparedAction: suggestion.preparedAction,
        })),
        behaviorMetrics: snapshot.behaviorMetrics,
        lifeTransitionMessages: snapshot.lifeTransitions.map((signal) => signal.message),
        phrasingHints: snapshot.phrasingHints,
        timelineMessages: snapshot.timeline.slice(0, 5).map((entry) => entry.message),
      };
    }
  }

  let lifeKnowledge: AssistantLifeKnowledgeSnapshot = {
    enabled: false,
    knowledgeCount: 0,
    confirmedCount: 0,
    pendingConfirmationCount: 0,
    timelineCount: 0,
    phrasingHints: [],
    topConfirmedLabels: [],
  };

  if (isLifeKnowledgeEngineEnabled()) {
    const knowledgeResult = await safe(
      "lifeKnowledge",
      async () =>
        defaultLifeKnowledgeEngine.analyze({
          userId: input.userId,
          date,
          now: new Date().toISOString(),
          profileFacts: profileFactsResult.value,
          livingInsights: livingMemoryResult.value?.insights.map((insight) => ({
            id: insight.id,
            category: insight.category,
            label: insight.label,
            detail: insight.detail,
            confidence: insight.confidence,
            status: insight.status,
          })),
          validatedPreferences: adaptiveIntelligence.validatedPreferences.map((pref) => ({
            id: pref.id,
            label: pref.label,
            proposedValue: pref.proposedValue,
            confidence: 0.9,
          })),
          activeGoals: goalsResult.value.slice(0, 5).map((goal) => ({
            id: goal.id,
            name: goal.name,
          })),
          childrenCount: childrenResult.value.length,
        }),
      createEmptyLifeKnowledgeSnapshot(date),
    );

    sources.push(source("lifeKnowledge", "Life Knowledge Engine", knowledgeResult.available));

    if (knowledgeResult.value.enabled) {
      const snapshot = knowledgeResult.value;
      lifeKnowledge = {
        enabled: true,
        knowledgeCount: snapshot.knowledgeCount,
        confirmedCount: snapshot.confirmedCount,
        pendingConfirmationCount: snapshot.pendingConfirmations.length,
        timelineCount: snapshot.timeline.length,
        phrasingHints: snapshot.phrasingHints,
        topConfirmedLabels: getKnowledgeLabelsForCoach(snapshot.visibleItems).slice(0, 5),
      };
    }
  }

  let personalCoach: AssistantPersonalCoachSnapshot = {
    enabled: false,
    lifePriority: "balance",
    todayCount: 0,
    opportunityCount: 0,
    recoveryCount: 0,
    successCount: 0,
    hasWeeklyReview: false,
    hasMonthlyReflection: false,
    hasProposedSession: false,
    phrasingHints: [],
  };

  if (isPersonalCoachEngineEnabled()) {
    const coachResult = await safe(
      "personalCoach",
      async () =>
        defaultPersonalCoachEngine.analyze({
          userId: input.userId,
          date,
          now: new Date().toISOString(),
          firstName,
          dailyEnergy: dailyState.today?.energy,
          dailyStress: dailyState.today?.stress,
          dailyMood: dailyState.today?.mood,
          mentalLoad: semanticPlanning.mentalLoad,
          balanceScore: semanticPlanning.balanceScore,
          freeMinutes: semanticPlanning.freeMinutes,
          conflictCount: planningCalendar.conflictCount,
          taskTodoCount: todoTasks.length,
          blockCount: dayPlanResult.value?.blocks.length ?? 0,
          childrenCount: childrenResult.value.length,
          activeGoals: goalsResult.value.slice(0, 5).map((goal) => ({
            id: goal.id,
            name: goal.name,
          })),
          validatedHabits: adaptiveIntelligence.validatedPreferences.map((pref) => pref.label),
          topHabits: adaptiveIntelligence.topHabits,
          confirmedKnowledge: lifeKnowledge.topConfirmedLabels,
          trendEnergy7d: dailyState.trendEnergy7d,
          trendStress7d: dailyState.trendStress7d,
          skipStreak: dailyState.enabled
            ? defaultDailyStateEngine.analyze(input.userId, date).skipCount
            : 0,
        }),
      createEmptyPersonalCoachSnapshot(date),
    );

    sources.push(source("personalCoach", "Personal Coach Engine", coachResult.available));

    if (coachResult.value.enabled) {
      const snapshot = coachResult.value;
      personalCoach = {
        enabled: true,
        lifePriority: snapshot.lifePriority,
        todayCount: snapshot.todayInsights.length,
        opportunityCount: snapshot.opportunities.length,
        recoveryCount: snapshot.recovery.length,
        successCount: snapshot.successes.length,
        hasWeeklyReview: Boolean(snapshot.weeklyReview),
        hasMonthlyReflection: Boolean(snapshot.monthlyReflection),
        hasProposedSession: Boolean(snapshot.proposedSession),
        phrasingHints: snapshot.phrasingHints,
        topOpportunityTitle: snapshot.opportunities[0]?.title,
      };
    }
  }

  return {
    builtAt: new Date().toISOString(),
    date,
    user: {
      userId: input.userId,
      firstName,
      profile: profileResult.value
        ? {
            id: profileResult.value.id,
            onboarding_completed: profileResult.value.onboarding_completed,
          }
        : null,
      onboardingCompleted: Boolean(profileResult.value?.onboarding_completed),
    },
    household: {
      householdId: membershipResult.value?.household_id ?? null,
      members: membersResult.value,
      childrenCount: childrenResult.value.length,
      memory: memoryResult.value,
    },
    planning: {
      date,
      planningContext: planningContextResult.value,
      dayPlan: dayPlanResult.value,
      blockCount: dayPlanResult.value?.blocks.length ?? 0,
      hasLoadedPlan: Boolean(dayPlanResult.value),
    },
    planningCalendar,
    semanticPlanning,
    adaptiveIntelligence,
    proactiveIntelligence,
    dailyState,
    lifeKnowledge,
    personalCoach,
    tasks: {
      total: tasksResult.value.length,
      todo: todoTasks.length,
      done: doneTasks.length,
      topTitles: todoTasks.slice(0, 5).map((task) => task.title),
    },
    goals: {
      enabled: goalsEnabled,
      activeCount: goalsResult.value.length,
      goals: goalsResult.value.slice(0, 5).map((goal) => {
        const totalTasks = goal.steps.reduce(
          (count, step) => count + step.taskIds.length,
          0,
        );
        return {
          id: goal.id,
          name: goal.name,
          progressPercent: totalTasks > 0 ? 50 : 0,
        };
      }),
    },
    dailyBrief: {
      enabled: isDailyBriefEnabled(),
      brief: dailyBrief,
    },
    memory: {
      livingMemory: livingMemoryResult.value,
      habitProfile: habitProfileResult.value,
      knownFactsCount: profileFactsResult.value.length,
    },
    sources,
    gaps,
  };
}
