/**
 * DecisionEngine port — single entry for planningEngine (Sprint A3).
 * Feature flag selects authority; shadow comparison always runs.
 */

import { isNewDecisionEngineEnabled } from "../../../config/featureFlags";
import {
  validatePlannedBlockCore,
  validateDayPlanCore,
  type ValidatePlannedBlockInput,
  type BlockValidationResult,
} from "../../engines/decision/decisionEngineCore";
import {
  validatePlannedBlock as legacyValidatePlannedBlock,
  validateDayPlan as legacyValidateDayPlan,
} from "../../decisionEngine";
import { compareValidationResults } from "./shadowCompare";

export type { ValidatePlannedBlockInput, BlockValidationResult };

export function validatePlannedBlockViaPort(
  input: ValidatePlannedBlockInput,
): BlockValidationResult {
  const legacyResult = legacyValidatePlannedBlock(input);
  const candidateResult = validatePlannedBlockCore(input);

  compareValidationResults(
    "validatePlannedBlock",
    legacyResult,
    candidateResult,
  );

  if (isNewDecisionEngineEnabled()) {
    return candidateResult;
  }

  return legacyResult;
}

export function validateDayPlanViaPort(input: {
  blocks: ValidatePlannedBlockInput["block"][];
  context: ValidatePlannedBlockInput["context"];
  totalFreeMinutes: number;
}): BlockValidationResult[] {
  const legacyResults = legacyValidateDayPlan({
    blocks: input.blocks,
    context: input.context,
    totalFreeMinutes: input.totalFreeMinutes,
    plannedMinutes: 0,
  });

  const candidateResults = validateDayPlanCore({
    blocks: input.blocks,
    context: input.context,
    totalFreeMinutes: input.totalFreeMinutes,
  });

  const legacyAggregate: BlockValidationResult = {
    valid: legacyResults.length === 0,
    reason: legacyResults.map((item) => item.reason).join("; "),
  };
  const candidateAggregate: BlockValidationResult = {
    valid: candidateResults.length === 0,
    reason: candidateResults.map((item) => item.reason).join("; "),
  };

  compareValidationResults(
    "validateDayPlan",
    legacyAggregate,
    candidateAggregate,
  );

  if (isNewDecisionEngineEnabled()) {
    return candidateResults;
  }

  return legacyResults;
}
