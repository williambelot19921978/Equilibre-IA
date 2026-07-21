/**
 * EPIC 5C — Explainability helpers.
 */

import type { SemanticExplainability } from "../types/semanticTypes";

export function buildExplainability(input: {
  why: string;
  dataUsed: readonly string[];
  calculation: string;
  confidenceLevel: number;
}): SemanticExplainability {
  return {
    why: input.why,
    dataUsed: input.dataUsed,
    calculation: input.calculation,
    confidenceLevel: Math.max(0, Math.min(1, input.confidenceLevel)),
  };
}
