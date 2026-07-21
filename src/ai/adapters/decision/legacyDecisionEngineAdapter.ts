/**
 * Legacy DecisionEngine adapter — wraps legacy functions as IDecisionEngine (Sprint A3).
 */

import type { AutonomyLevel, Result } from "../../contracts/common/primitives.ts";
import type {
  IDecisionEngine,
  ValidateProposalInput,
} from "../../contracts/engines/decision-engine.contract.ts";
import { DECISION_ENGINE_META } from "../../contracts/engines/decision-engine.contract.ts";
import type {
  DayConstraint,
  DayPlan,
  DecisionValidation,
} from "../../contracts/engines/shared-domain.ts";
import {
  validatePlannedBlock as legacyValidatePlannedBlock,
  validateDayPlan as legacyValidateDayPlan,
} from "../../decisionEngine";
import type { PlanningContext } from "../../memoryEngine";
import type { PlannedBlock } from "../../../types/planning";

const HIGH_RISK_ACTION_PREFIXES = [
  "Delete",
  "Cancel",
  "Remove",
  "Clear",
] as const;

export type LegacyDayPlanValidationInput = {
  readonly blocks: PlannedBlock[];
  readonly context: PlanningContext;
  readonly totalFreeMinutes: number;
};

export class LegacyDecisionEngineAdapter implements IDecisionEngine {
  readonly meta = DECISION_ENGINE_META;

  validateProposal(input: ValidateProposalInput): Result<DecisionValidation> {
    const requiresConfirm = this.requiresConfirmation(
      input.proposedDecision.summary,
      input.autonomyLevel,
    );

    const hardViolations = input.constraints
      .filter((constraint) => constraint.kind === "hard" && constraint.ruleKey.startsWith("reject:"))
      .map((constraint) => `Contrainte dure violée : ${constraint.ruleKey}`);

    return {
      ok: true,
      value: {
        approved: hardViolations.length === 0,
        violations: hardViolations,
        requiresConfirmation: requiresConfirm,
        autonomyLevel: input.autonomyLevel,
      },
    };
  }

  validateDayPlan(
    _plan: DayPlan,
    _constraints: readonly DayConstraint[],
  ): Result<DecisionValidation> {
    return {
      ok: true,
      value: {
        approved: true,
        violations: [],
        requiresConfirmation: false,
        autonomyLevel: 2,
      },
    };
  }

  requiresConfirmation(actionType: string, autonomyLevel: AutonomyLevel): boolean {
    if (autonomyLevel <= 2) {
      return true;
    }

    const isHighRisk = HIGH_RISK_ACTION_PREFIXES.some((prefix) =>
      actionType.includes(prefix),
    );

    if (autonomyLevel === 3) {
      return isHighRisk;
    }

    return false;
  }

  /** Block validation — legacy reference path (not part of IDecisionEngine). */
  validatePlannedBlock(input: {
    block: PlannedBlock;
    context: PlanningContext;
    existingBlocks: PlannedBlock[];
    totalFreeMinutes: number;
    plannedMinutes: number;
  }): { valid: boolean; reason: string } {
    return legacyValidatePlannedBlock(input);
  }

  /** Day plan validation — legacy reference path. */
  validateDayPlanBlocks(input: LegacyDayPlanValidationInput): { valid: boolean; reason: string }[] {
    return legacyValidateDayPlan({
      blocks: input.blocks,
      context: input.context,
      totalFreeMinutes: input.totalFreeMinutes,
      plannedMinutes: 0,
    });
  }
}

export function createLegacyDecisionEngineAdapter(): LegacyDecisionEngineAdapter {
  return new LegacyDecisionEngineAdapter();
}
