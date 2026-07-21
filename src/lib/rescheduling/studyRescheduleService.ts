/**
 * P2 — Study reschedule actions (fail-open, outcomes via A4 bridge).
 */

import { applyBlockAction } from "../../services/blockActionService";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { PlanningContext } from "../../ai/memoryEngine";
import {
  observePilotProposalAccepted,
  observePilotProposalDismissed,
  observePilotProposalPresented,
  rememberPilotProposalSession,
} from "../../ai/outcome/outcomeObservationBridge";
import {
  buildStudyRescheduleProposal,
  revalidateStudyRescheduleProposal,
  type StudyRescheduleProposal,
} from "./buildStudyRescheduleProposal";
import { formatStudyRescheduleConflictMessage } from "./formatStudyRescheduleMessage";

export type StudyRescheduleMoveResult =
  | { readonly ok: true; readonly explanation: string; readonly timeline: DayTimelineEntry[] }
  | { readonly ok: false; readonly message: string };

export function searchStudyRescheduleProposal(input: {
  timeline: DayTimelineEntry[];
  entry: DayTimelineEntry;
  planningContext: PlanningContext;
  date: string;
  userId: string;
  now?: Date;
}) {
  return buildStudyRescheduleProposal({
    timeline: input.timeline,
    movingEntry: input.entry,
    planningContext: input.planningContext,
    date: input.date,
    now: input.now,
  });
}

export function presentStudyRescheduleProposal(
  proposal: StudyRescheduleProposal,
  userId: string,
  householdId: string,
): void {
  try {
    const session = observePilotProposalPresented({
      userId,
      householdId,
      proposalId: proposal.proposalId,
    });
    rememberPilotProposalSession(session);
  } catch {
    // fail-open
  }
}

export function dismissStudyRescheduleProposal(
  proposal: StudyRescheduleProposal,
  userId: string,
  householdId: string,
): void {
  try {
    observePilotProposalDismissed({
      userId,
      householdId,
      proposalId: proposal.proposalId,
    });
  } catch {
    // fail-open
  }
}

export async function confirmStudyRescheduleMove(input: {
  userId: string;
  date: string;
  householdId: string;
  proposal: StudyRescheduleProposal;
  timeline: DayTimelineEntry[];
  planningContext: PlanningContext;
  now?: Date;
}): Promise<StudyRescheduleMoveResult> {
  const { proposal, userId, date, householdId, timeline, planningContext } =
    input;

  try {
    observePilotProposalAccepted({
      userId,
      householdId,
      proposalId: proposal.proposalId,
    });
  } catch {
    // fail-open — continue with move attempt
  }

  const stillValid = revalidateStudyRescheduleProposal(proposal, {
    timeline,
    planningContext,
    date,
    now: input.now,
  });

  if (!stillValid) {
    return {
      ok: false,
      message: formatStudyRescheduleConflictMessage(),
    };
  }

  try {
    const result = await applyBlockAction({
      userId,
      date,
      entry: proposal.entry,
      action: "reschedule",
      rescheduleOption: "custom",
      customDateTime: proposal.alternative.startsAt,
    });

    return {
      ok: true,
      explanation: result.explanation,
      timeline: result.timeline,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : formatStudyRescheduleConflictMessage(),
    };
  }
}
