/**
 * EPIC 6D — Personal Coach diagnostics.
 */

import type { PersonalCoachSnapshot } from "../types/personalCoachTypes";
import { buildPersonalCoachInputFromUser } from "../context/buildPersonalCoachInput";
import { defaultPersonalCoachEngine, type PersonalCoachEngine } from "../engine/personalCoachEngine";
import { getDismissedAdviceIds } from "../store/coachStore";

export type PersonalCoachDiagnostics = PersonalCoachSnapshot & {
  readonly opportunityCount: number;
  readonly recoveryCount: number;
  readonly successCount: number;
  readonly dismissedCount: number;
};

export async function buildPersonalCoachDiagnostics(input: {
  readonly userId: string;
  readonly date: string;
  readonly coachInput?: import("../types/personalCoachTypes").PersonalCoachInput;
  readonly firstName?: string;
  readonly childrenCount?: number;
  readonly engine?: PersonalCoachEngine;
}): Promise<PersonalCoachDiagnostics> {
  const engine = input.engine ?? defaultPersonalCoachEngine;
  const coachInput =
    input.coachInput ??
    (await buildPersonalCoachInputFromUser(input.userId, input.date, {
      firstName: input.firstName,
      childrenCount: input.childrenCount,
    }));

  const snapshot = engine.analyze(coachInput);

  return {
    ...snapshot,
    opportunityCount: snapshot.opportunities.length,
    recoveryCount: snapshot.recovery.length,
    successCount: snapshot.successes.length,
    dismissedCount: getDismissedAdviceIds(input.userId).length,
  };
}
