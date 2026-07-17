import type { FreeTimeSuggestion } from "../../types/freeTimeSuggestion";
import type { LifeContext, LifeProposal } from "../../types/lifeContext";
import type { FreeSlotInput } from "../../ai/freeTimeSuggestionEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { TaskRecord } from "../../types";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { TimelineSlotSuggestion } from "./displayedDayTimeline";
import { generateSlotActivitySuggestions } from "./slotActivitySuggestionEngine";
import { resolveDailyActivityUsage } from "./dailyActivityCompletionState";
import { ensurePrimarySuggestionInList } from "./ensurePrimarySuggestionInList";
import {
  formatStudyMinutesLabel,
  getWeeklyStudyProgress,
} from "./getWeeklyStudyProgress";

const CATEGORY_TO_TYPE: Record<
  LifeProposal["category"],
  FreeTimeSuggestion["type"]
> = {
  sport: "sport",
  study: "study",
  calm: "calm",
  family: "family_outing",
  admin: "personal_task",
  reading: "personal_task",
  spiritual: "spiritual",
  rest: "calm",
  outing: "vacation_activity",
  leisure: "leisure",
  couple: "personal_task",
  keep_free: "keep_free",
};

const CATEGORY_TO_ACTION: Record<
  LifeProposal["category"],
  FreeTimeSuggestion["action"]
> = {
  sport: "generate_sport",
  study: "assign_study",
  calm: "open_calm",
  family: "create_family",
  admin: "create_task",
  reading: "create_task",
  spiritual: "show_spiritual",
  rest: "open_calm",
  outing: "create_family",
  leisure: "add_leisure",
  couple: "create_task",
  keep_free: "keep_free",
};

function buildStudyProgress({
  proposal,
  planningContext,
  calendarItems,
  taskActivityEvents,
}: {
  proposal: LifeProposal;
  planningContext?: PlanningContext;
  calendarItems: CalendarItemRecord[];
  taskActivityEvents: TaskActivityEventRecord[];
}): FreeTimeSuggestion["studyProgress"] | undefined {
  if (proposal.category !== "study") return undefined;

  const weeklyGoalMinutes = Math.round(
    (planningContext?.profile.studyWeeklyHours ?? 0) * 60,
  );
  const progress = getWeeklyStudyProgress({
    userId: planningContext?.currentUserId ?? "",
    referenceDate: planningContext?.targetDate ?? new Date().toISOString().slice(0, 10),
    calendarItems,
    taskActivityEvents,
    studyWeeklyHours: planningContext?.profile.studyWeeklyHours,
  });

  const taskTitle = proposal.taskTitle ?? "Révision libre";
  const isFreeRevision = !proposal.taskId;

  const progressLabel =
    weeklyGoalMinutes > 0
      ? `${formatStudyMinutesLabel(progress.completedMinutes)} réalisée sur ${formatStudyMinutesLabel(weeklyGoalMinutes)} cette semaine`
      : `${formatStudyMinutesLabel(progress.completedMinutes)} réalisée cette semaine`;

  return {
    taskId: proposal.taskId,
    taskTitle,
    isFreeRevision,
    plannedMinutesThisWeek: progress.plannedMinutes,
    completedMinutesThisWeek: progress.completedMinutes,
    weeklyGoalMinutes,
    progressLabel,
  };
}

export function mapLifeProposalToFreeTimeSuggestion(
  proposal: LifeProposal,
  slot: FreeSlotInput,
  extras: {
    planningContext?: PlanningContext;
    calendarItems?: CalendarItemRecord[];
    taskActivityEvents?: TaskActivityEventRecord[];
    isPrimaryRecommendation?: boolean;
  } = {},
): FreeTimeSuggestion {
  const duration =
    proposal.durationMinutes > 0
      ? Math.min(proposal.durationMinutes, slot.durationMinutes)
      : 0;

  const optionalContent: Record<string, unknown> = {};
  if (proposal.leisureActivityId) {
    optionalContent.leisureActivityId = proposal.leisureActivityId;
  }
  if (proposal.taskId) {
    optionalContent.taskId = proposal.taskId;
    optionalContent.taskTitle = proposal.taskTitle;
  }
  if (proposal.category === "study" && !proposal.taskId) {
    optionalContent.freeRevision = true;
  }

  const studyProgress = buildStudyProgress({
    proposal,
    planningContext: extras.planningContext,
    calendarItems: extras.calendarItems ?? [],
    taskActivityEvents: extras.taskActivityEvents ?? [],
  });

  return {
    id: proposal.id,
    type: CATEGORY_TO_TYPE[proposal.category],
    title: proposal.title,
    description: proposal.description,
    recommendedDuration: duration,
    reason: proposal.reason,
    priority: proposal.priority,
    action: CATEGORY_TO_ACTION[proposal.category],
    optionalContent: Object.keys(optionalContent).length > 0 ? optionalContent : undefined,
    studyProgress,
    isPrimaryRecommendation: extras.isPrimaryRecommendation,
    confidence: proposal.confidence,
    confidenceFactors: proposal.confidenceFactors,
    explanation: proposal.explanation,
  };
}

export function generateFreeTimeSuggestionsFromLifeContext({
  slot,
  lifeContext,
  planningContext,
  tasks = [],
  calendarItems = [],
  taskActivityEvents = [],
  primarySuggestion,
}: {
  slot: FreeSlotInput;
  lifeContext: LifeContext;
  planningContext?: PlanningContext;
  tasks?: TaskRecord[];
  calendarItems?: CalendarItemRecord[];
  taskActivityEvents?: TaskActivityEventRecord[];
  primarySuggestion?: TimelineSlotSuggestion;
}): FreeTimeSuggestion[] {
  const usage =
    lifeContext.activityUsage ??
    resolveDailyActivityUsage({
      userId: planningContext?.currentUserId ?? "",
      date: lifeContext.date,
      calendarItems,
      taskActivityEvents,
    });

  const proposals = planningContext
    ? generateSlotActivitySuggestions({
        slot,
        lifeContext,
        context: planningContext,
        usage,
        tasks,
      })
    : lifeContext.proposals.filter(
        (proposal) => !proposal.slotId || proposal.slotId === slot.id,
      );

  const mapped = proposals
    .filter((proposal) => {
      if (lifeContext.workoutCompletedToday && proposal.category === "sport") {
        return false;
      }
      if (proposal.category === "keep_free") return true;
      if (proposal.durationMinutes === 0) return false;
      return proposal.durationMinutes <= slot.durationMinutes;
    })
    .map((proposal) =>
      mapLifeProposalToFreeTimeSuggestion(proposal, slot, {
        planningContext,
        calendarItems,
        taskActivityEvents,
      }),
    );

  return ensurePrimarySuggestionInList({
    suggestions: mapped,
    primarySuggestion,
    slot,
  }).map((suggestion) => {
    if (
      primarySuggestion?.category === "study" &&
      suggestion.type === "study" &&
      !suggestion.studyProgress
    ) {
      return {
        ...suggestion,
        studyProgress: buildStudyProgress({
          proposal: {
            id: suggestion.id,
            category: "study",
            title: suggestion.title,
            description: suggestion.description,
            durationMinutes: suggestion.recommendedDuration,
            reason: suggestion.reason,
            priority: suggestion.priority,
            taskTitle:
              typeof suggestion.optionalContent?.taskTitle === "string"
                ? suggestion.optionalContent.taskTitle
                : "Révision libre",
            taskId:
              typeof suggestion.optionalContent?.taskId === "string"
                ? suggestion.optionalContent.taskId
                : undefined,
          },
          planningContext,
          calendarItems,
          taskActivityEvents,
        }),
        isPrimaryRecommendation: true,
      };
    }

    if (
      primarySuggestion &&
      suggestion.title === primarySuggestion.title &&
      suggestion.type !== "keep_free"
    ) {
      return { ...suggestion, isPrimaryRecommendation: true };
    }

    return suggestion;
  });
}
