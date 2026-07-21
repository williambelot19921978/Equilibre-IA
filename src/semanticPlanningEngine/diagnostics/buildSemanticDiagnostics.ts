/**
 * EPIC 5C — Semantic diagnostics builder.
 */

import type { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import { defaultSemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import type { SemanticPlanningSnapshot } from "../types/semanticTypes";

export type SemanticDiagnostics = SemanticPlanningSnapshot & {
  readonly mentalLoadScore: number;
  readonly averageConfidence: number;
};

export async function buildSemanticDiagnostics(input: {
  readonly userId: string;
  readonly householdId?: string | null;
  readonly date: string;
  readonly goals?: readonly { id: string; name: string }[];
  readonly childrenCount?: number;
  readonly memberCount?: number;
  readonly engine?: SemanticPlanningEngine;
}): Promise<SemanticDiagnostics> {
  const engine = input.engine ?? defaultSemanticPlanningEngine;
  const snapshot = await engine.analyze({
    userId: input.userId,
    householdId: input.householdId,
    date: input.date,
    goals: input.goals,
    childrenCount: input.childrenCount,
    memberCount: input.memberCount,
  });

  const averageConfidence =
    snapshot.items.length > 0
      ? snapshot.items.reduce((sum, item) => sum + item.confidence, 0) / snapshot.items.length
      : 0;

  return {
    ...snapshot,
    mentalLoadScore: snapshot.dailyLoad.mentalLoad,
    averageConfidence,
  };
}
