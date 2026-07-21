/**
 * P2 vertical orchestrator — study task smart reschedule.
 */

import type { PlanningContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { isStudyTimelineEntry } from "./isStudyTimelineEntry";
import {
  findAlternativeStudySlots,
  pickBestAlternativeSlot,
  type AlternativeStudySlot,
} from "./findAlternativeStudySlots";
import {
  formatStudyRescheduleNoSolutionMessage,
  formatStudyRescheduleProposalMessage,
} from "./formatStudyRescheduleMessage";

export type StudyRescheduleProposal = {
  readonly proposalId: string;
  readonly entry: DayTimelineEntry;
  readonly alternative: AlternativeStudySlot;
  readonly message: string;
  readonly durationMinutes: number;
};

export type StudyRescheduleSearchResult =
  | { readonly kind: "proposal"; readonly proposal: StudyRescheduleProposal }
  | { readonly kind: "no_solution"; readonly message: string }
  | { readonly kind: "not_eligible" };

function buildJustification(alternative: AlternativeStudySlot): string {
  return `Il ne chevauche aucun autre engagement et te permet de conserver ta séance aujourd'hui (${alternative.scoreReason}).`;
}

export function buildStudyRescheduleProposal({
  timeline,
  movingEntry,
  planningContext,
  date,
  now = new Date(),
}: {
  timeline: DayTimelineEntry[];
  movingEntry: DayTimelineEntry;
  planningContext: PlanningContext;
  date: string;
  now?: Date;
}): StudyRescheduleSearchResult {
  if (!isStudyTimelineEntry(movingEntry)) {
    return { kind: "not_eligible" };
  }

  const alternatives = findAlternativeStudySlots({
    timeline,
    movingEntry,
    planningContext,
    date,
    now,
  });

  const best = pickBestAlternativeSlot(alternatives);
  if (!best) {
    return {
      kind: "no_solution",
      message: formatStudyRescheduleNoSolutionMessage(),
    };
  }

  const proposalId = `p2-reschedule-${movingEntry.id}-${best.startsAt}`;

  return {
    kind: "proposal",
    proposal: {
      proposalId,
      entry: movingEntry,
      alternative: best,
      durationMinutes: best.durationMinutes,
      message: formatStudyRescheduleProposalMessage({
        taskTitle: movingEntry.title,
        durationMinutes: best.durationMinutes,
        startsAt: best.startsAt,
        endsAt: best.endsAt,
        justification: buildJustification(best),
      }),
    },
  };
}

export function revalidateStudyRescheduleProposal(
  proposal: StudyRescheduleProposal,
  input: {
    timeline: DayTimelineEntry[];
    planningContext: PlanningContext;
    date: string;
    now?: Date;
  },
): boolean {
  const result = buildStudyRescheduleProposal({
    ...input,
    movingEntry: proposal.entry,
  });

  if (result.kind !== "proposal") return false;

  return result.proposal.alternative.startsAt === proposal.alternative.startsAt;
}
