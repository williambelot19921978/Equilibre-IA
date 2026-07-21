import { useCallback, useState } from "react";

import { isSmartStudyReschedulingEnabled } from "../config/featureFlags";
import type { PlanningContext } from "../ai/memoryEngine";
import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import { isStudyTimelineEntry } from "../lib/rescheduling/isStudyTimelineEntry";
import type { StudyRescheduleProposal } from "../lib/rescheduling/buildStudyRescheduleProposal";
import {
  confirmStudyRescheduleMove,
  dismissStudyRescheduleProposal,
  presentStudyRescheduleProposal,
  searchStudyRescheduleProposal,
} from "../lib/rescheduling/studyRescheduleService";

export function useStudyRescheduleProposal({
  userId,
  date,
  timeline,
  planningContext,
  onMoved,
  onMessage,
}: {
  userId: string | undefined;
  date: string;
  timeline: DayTimelineEntry[];
  planningContext: PlanningContext | null;
  onMoved?: (explanation: string) => void;
  onMessage?: (message: string) => void;
}) {
  const [proposal, setProposal] = useState<StudyRescheduleProposal | null>(
    null,
  );
  const [noSolutionMessage, setNoSolutionMessage] = useState<string | null>(
    null,
  );
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const enabled =
    isSmartStudyReschedulingEnabled() && Boolean(userId && planningContext);

  const canOfferForEntry = useCallback(
    (entry: DayTimelineEntry) => enabled && isStudyTimelineEntry(entry),
    [enabled],
  );

  const requestAlternative = useCallback(
    (entry: DayTimelineEntry) => {
      if (!enabled || !userId || !planningContext) return;

      setConflictMessage(null);
      setNoSolutionMessage(null);
      setProposal(null);

      try {
        const result = searchStudyRescheduleProposal({
          timeline,
          entry,
          planningContext,
          date,
          userId,
        });

        if (result.kind === "no_solution") {
          setNoSolutionMessage(result.message);
          onMessage?.(result.message);
          return;
        }

        if (result.kind !== "proposal") return;

        presentStudyRescheduleProposal(
          result.proposal,
          userId,
          planningContext.householdId,
        );
        setProposal(result.proposal);
      } catch {
        setNoSolutionMessage(
          "Je n'ai pas trouvé de créneau suffisamment long aujourd'hui.\n\nTa tâche reste à son horaire actuel.",
        );
      }
    },
    [enabled, userId, planningContext, timeline, date, onMessage],
  );

  const confirmMove = useCallback(async () => {
    if (!proposal || !userId || !planningContext) return;

    setMoving(true);
    setConflictMessage(null);

    try {
      const result = await confirmStudyRescheduleMove({
        userId,
        date,
        householdId: planningContext.householdId,
        proposal,
        timeline,
        planningContext,
      });

      if (!result.ok) {
        setConflictMessage(result.message);
        onMessage?.(result.message);
        return;
      }

      setProposal(null);
      onMoved?.(result.explanation);
    } finally {
      setMoving(false);
    }
  }, [proposal, userId, planningContext, date, timeline, onMoved, onMessage]);

  const keepCurrentSchedule = useCallback(() => {
    setProposal(null);
    setConflictMessage(null);
  }, []);

  const dismissProposal = useCallback(() => {
    if (proposal && userId && planningContext) {
      dismissStudyRescheduleProposal(
        proposal,
        userId,
        planningContext.householdId,
      );
    }
    setProposal(null);
    setConflictMessage(null);
  }, [proposal, userId, planningContext]);

  const clearMessages = useCallback(() => {
    setNoSolutionMessage(null);
    setConflictMessage(null);
  }, []);

  return {
    enabled,
    proposal,
    noSolutionMessage,
    conflictMessage,
    moving,
    canOfferForEntry,
    requestAlternative,
    confirmMove,
    keepCurrentSchedule,
    dismissProposal,
    clearMessages,
  };
}
