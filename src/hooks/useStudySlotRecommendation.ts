import { useCallback, useEffect, useState } from "react";

import { isStudySlotRecommendationEnabled } from "../config/featureFlags";
import type { PlanningContext, HouseholdMemoryContext } from "../ai/memoryEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { loadCalendarItemsForWeek } from "../services/planningService";
import { getTasksForPlanning } from "../services/tasksService";
import { loadTaskActivityEventsForWeek } from "../services/taskActivityEventService";
import {
  buildStudySlotRecommendation,
  findFirstStudyFreeSlot,
  type StudySlotRecommendation,
} from "../lib/recommendations/buildStudySlotRecommendation";
import {
  acceptStudyRecommendation,
  deferStudyRecommendationAction,
  dismissStudyRecommendationAction,
  presentStudyRecommendation,
} from "../lib/recommendations/studySlotRecommendationService";
import {
  isStudyRecommendationDeferred,
  isStudyRecommendationDismissed,
} from "../lib/recommendations/studySlotRecommendationStorage";

export function useStudySlotRecommendation({
  userId,
  date,
  timeline,
  planningContext,
  memoryContext,
  onAccepted,
}: {
  userId: string | undefined;
  date: string;
  timeline: DayTimelineEntry[];
  planningContext: PlanningContext | null;
  memoryContext?: HouseholdMemoryContext | null;
  onAccepted?: (explanation: string) => void;
}) {
  const [recommendation, setRecommendation] =
    useState<StudySlotRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [hidden, setHidden] = useState(false);

  const enabled =
    isStudySlotRecommendationEnabled() && Boolean(userId && planningContext);

  useEffect(() => {
    if (!enabled || !userId || !planningContext || hidden) {
      setRecommendation(null);
      return;
    }

    let cancelled = false;

    async function loadRecommendation() {
      if (!userId || !planningContext) return;

      setLoading(true);
      const activeUserId = userId;
      const activeContext = planningContext;

      try {
        const entry = findFirstStudyFreeSlot(timeline);
        if (!entry) {
          if (!cancelled) setRecommendation(null);
          return;
        }

        if (
          isStudyRecommendationDeferred(activeUserId, date, entry.id) ||
          isStudyRecommendationDismissed(activeUserId, date, entry.id)
        ) {
          if (!cancelled) setRecommendation(null);
          return;
        }

        const [tasks, calendarItems, taskActivityEvents] = await Promise.all([
          getTasksForPlanning(activeUserId).catch(() => []),
          loadCalendarItemsForWeek({
            userId: activeUserId,
            householdId: activeContext.householdId,
            referenceDate: date,
          }).catch(() => []),
          loadTaskActivityEventsForWeek({
            userId: activeUserId,
            householdId: activeContext.householdId,
            referenceDate: date,
          }).catch(() => []),
        ]);

        const built = buildStudySlotRecommendation({
          entry,
          date,
          planningContext: activeContext,
          memoryContext,
          tasks,
          calendarItems,
          taskActivityEvents,
        });

        if (!built || cancelled) {
          if (!cancelled) setRecommendation(null);
          return;
        }

        presentStudyRecommendation(
          built,
          activeUserId,
          activeContext.householdId,
        );

        if (!cancelled) {
          setRecommendation(built);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRecommendation();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    userId,
    date,
    timeline,
    planningContext,
    memoryContext,
    hidden,
  ]);

  const accept = useCallback(async () => {
    if (!userId || !recommendation) return;

    try {
      setAccepting(true);
      const result = await acceptStudyRecommendation({
        userId,
        date,
        householdId: planningContext!.householdId,
        recommendation,
      });
      setHidden(true);
      setRecommendation(null);
      onAccepted?.(result.explanation);
    } finally {
      setAccepting(false);
    }
  }, [userId, date, recommendation, onAccepted]);

  const defer = useCallback(() => {
    if (!userId || !recommendation) return;
    deferStudyRecommendationAction(userId, date, recommendation.entry.id);
    setHidden(true);
    setRecommendation(null);
  }, [userId, date, recommendation]);

  const dismiss = useCallback(() => {
    if (!userId || !planningContext || !recommendation) return;
    dismissStudyRecommendationAction(
      recommendation,
      userId,
      planningContext.householdId,
      date,
    );
    setHidden(true);
    setRecommendation(null);
  }, [userId, planningContext, recommendation, date]);

  return {
    enabled,
    visible: enabled && !loading && recommendation !== null,
    recommendation,
    loading,
    accepting,
    accept,
    defer,
    dismiss,
  };
}
