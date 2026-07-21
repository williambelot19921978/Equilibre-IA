/**
 * EPIC 6E — Life Knowledge diagnostics.
 */

import type { LifeKnowledgeCategory, LifeKnowledgeSnapshot } from "../types/lifeKnowledgeTypes";
import { CATEGORY_LABELS } from "../types/lifeKnowledgeTypes";
import { defaultLifeKnowledgeEngine, type LifeKnowledgeEngine } from "../engine/lifeKnowledgeEngine";
import { averageConfidence } from "../confidence/knowledgeConfidenceEngine";

export type LifeKnowledgeDiagnostics = LifeKnowledgeSnapshot & {
  readonly averageConfidence: number;
  readonly itemsByCategory: Readonly<Record<LifeKnowledgeCategory, number>>;
};

export async function buildLifeKnowledgeDiagnostics(input: {
  readonly userId: string;
  readonly date: string;
  readonly knowledgeInput?: import("../types/lifeKnowledgeTypes").LifeKnowledgeInput;
  readonly engine?: LifeKnowledgeEngine;
}): Promise<LifeKnowledgeDiagnostics> {
  const engine = input.engine ?? defaultLifeKnowledgeEngine;
  const knowledgeInput = input.knowledgeInput ?? {
    userId: input.userId,
    date: input.date,
    now: new Date().toISOString(),
  };

  const snapshot = engine.analyze(knowledgeInput);

  const itemsByCategory = {
    personal_life: 0,
    work: 0,
    health_recovery: 0,
    preferences: 0,
    long_term_goals: 0,
    life_changes: 0,
  } satisfies Record<LifeKnowledgeCategory, number>;

  for (const item of snapshot.visibleItems) {
    itemsByCategory[item.category] += 1;
  }

  return {
    ...snapshot,
    averageConfidence: averageConfidence(snapshot.visibleItems),
    itemsByCategory,
  };
}

export { CATEGORY_LABELS };
