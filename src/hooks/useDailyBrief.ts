import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  isDailyBriefEnabled,
  isDynamicDailyBriefEnabled,
} from "../config/featureFlags";
import { buildDailyBrief } from "../lib/dailyBrief/buildDailyBrief";
import { formatDailyBriefUpdateHint } from "../lib/dailyBrief/formatDailyBriefUpdateHint";
import {
  refreshAdaptiveDailyBrief,
  type AdaptiveDailyBriefState,
} from "../lib/dailyBrief/refreshAdaptiveDailyBrief";
import { buildDailyBriefTimelineSignature } from "../lib/dailyBrief/dailyBriefTimelineSignature";
import {
  isDailyBriefPresentedToday,
  markDailyBriefPresentedToday,
} from "../lib/dailyBrief/dailyBriefStorage";
import { presentDailyBrief } from "../lib/explainability/presentDailyBrief";
import type { PresentedDailyBriefRecommendation } from "../lib/explainability/presentDailyBrief";
import type { PlanningContext, HouseholdMemoryContext } from "../ai/memoryEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { TaskRecord } from "../types";
import type { UserGoal } from "../types/goal";
import { getCurrentDeviceDate, isToday } from "../lib/time/deviceClock";

export function useDailyBrief({
  userId,
  firstName,
  date,
  timeline,
  planningContext,
  memoryContext,
  goals = [],
  tasks = [],
  onOpenPlanning,
}: {
  userId: string | undefined;
  firstName: string;
  date: string;
  timeline: DayTimelineEntry[];
  planningContext: PlanningContext | null;
  memoryContext: HouseholdMemoryContext | null;
  goals?: UserGoal[];
  tasks?: TaskRecord[];
  onOpenPlanning: () => void;
}) {
  const enabled =
    isDailyBriefEnabled() && Boolean(userId) && isToday(date);
  const dynamicEnabled = enabled && isDynamicDailyBriefEnabled();

  const timelineSignature = useMemo(
    () => buildDailyBriefTimelineSignature(timeline),
    [timeline],
  );

  const candidateBrief = useMemo(() => {
    if (!enabled || !userId) return null;

    return buildDailyBrief({
      firstName,
      date,
      timeline,
      planningContext,
      memoryContext,
      goals,
      tasks,
    });
  }, [
    enabled,
    userId,
    firstName,
    date,
    timeline,
    planningContext,
    memoryContext,
    goals,
    tasks,
  ]);

  const [adaptiveState, setAdaptiveState] =
    useState<AdaptiveDailyBriefState | null>(null);
  const previousSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dynamicEnabled || !candidateBrief) {
      setAdaptiveState(null);
      previousSignatureRef.current = timelineSignature;
      return;
    }

    const timelineChanged =
      previousSignatureRef.current !== null &&
      previousSignatureRef.current !== timelineSignature;

    setAdaptiveState((previous) =>
      refreshAdaptiveDailyBrief({
        previous,
        candidate: candidateBrief,
        timelineChanged,
      }),
    );

    previousSignatureRef.current = timelineSignature;
  }, [dynamicEnabled, candidateBrief, timelineSignature]);

  const displayedBrief = dynamicEnabled
    ? (adaptiveState?.brief ?? candidateBrief)
    : candidateBrief;

  const presentedBrief = useMemo(
    () => (displayedBrief ? presentDailyBrief(displayedBrief) : null),
    [displayedBrief],
  );

  const updateHint =
    dynamicEnabled && adaptiveState?.showUpdatedHint
      ? formatDailyBriefUpdateHint()
      : null;

  const [modalDismissed, setModalDismissed] = useState(false);

  const alreadyPresented = userId
    ? isDailyBriefPresentedToday(userId, getCurrentDeviceDate())
    : false;

  const showModal =
    enabled &&
    Boolean(displayedBrief) &&
    !alreadyPresented &&
    !modalDismissed;

  const dismissModal = useCallback(() => {
    if (userId) {
      markDailyBriefPresentedToday(userId, getCurrentDeviceDate());
    }
    setModalDismissed(true);
  }, [userId]);

  const handleRecommendationAction = useCallback(
    (_recommendation: PresentedDailyBriefRecommendation) => {
      dismissModal();
      onOpenPlanning();
    },
    [dismissModal, onOpenPlanning],
  );

  return {
    enabled,
    dynamicEnabled,
    brief: displayedBrief,
    presentedBrief,
    updateHint,
    showModal,
    showSection: enabled && Boolean(presentedBrief),
    dismissModal,
    handleRecommendationAction,
  };
}
