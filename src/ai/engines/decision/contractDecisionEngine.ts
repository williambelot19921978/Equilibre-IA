/**
 * Contract-compliant DecisionEngine — Sprint A3.
 * Implements IDecisionEngine; block-level validation delegates to decisionEngineCore.
 */

import type { AutonomyLevel, Result } from "../../contracts/common/primitives.ts";
import { contractError } from "../../contracts/common/primitives.ts";
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

const HIGH_RISK_ACTION_PREFIXES = [
  "Delete",
  "Cancel",
  "Remove",
  "Clear",
] as const;

function toDecisionValidation(
  approved: boolean,
  violations: readonly string[],
  autonomyLevel: AutonomyLevel,
  requiresConfirmation: boolean,
): DecisionValidation {
  return {
    approved,
    violations,
    requiresConfirmation,
    autonomyLevel,
  };
}

export class ContractDecisionEngine implements IDecisionEngine {
  readonly meta = DECISION_ENGINE_META;

  validateProposal(input: ValidateProposalInput): Result<DecisionValidation> {
    const violations: string[] = [];

    for (const constraint of input.constraints) {
      if (constraint.kind === "hard" && constraint.ruleKey.startsWith("reject:")) {
        violations.push(`Contrainte dure violée : ${constraint.ruleKey}`);
      }
    }

    const requiresConfirm = this.requiresConfirmation(
      input.proposedDecision.summary,
      input.autonomyLevel,
    );

    if (input.proposedDecision.schedulingRequested && violations.length === 0) {
      return {
        ok: true,
        value: toDecisionValidation(
          true,
          [],
          input.autonomyLevel,
          requiresConfirm,
        ),
      };
    }

    return {
      ok: true,
      value: toDecisionValidation(
        violations.length === 0,
        violations,
        input.autonomyLevel,
        requiresConfirm,
      ),
    };
  }

  validateDayPlan(
    plan: DayPlan,
    constraints: readonly DayConstraint[],
  ): Result<DecisionValidation> {
    const violations: string[] = [];

    for (const constraint of constraints) {
      if (constraint.kind === "hard") {
        violations.push(`Contrainte dure active : ${constraint.ruleKey}`);
      }
    }

    const sortedBlocks = [...plan.blocks].sort((a, b) =>
      a.start.localeCompare(b.start),
    );

    for (let index = 0; index < sortedBlocks.length; index += 1) {
      const current = sortedBlocks[index];
      for (let otherIndex = index + 1; otherIndex < sortedBlocks.length; otherIndex += 1) {
        const other = sortedBlocks[otherIndex];
        if (current.start < other.end && other.start < current.end) {
          violations.push(
            `Chevauchement entre blocs ${String(current.blockId)} et ${String(other.blockId)}`,
          );
        }
      }
    }

    return {
      ok: true,
      value: toDecisionValidation(
        violations.length === 0,
        violations,
        2,
        violations.length > 0,
      ),
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
}

export function createContractDecisionEngine(): IDecisionEngine {
  return new ContractDecisionEngine();
}

export function notImplementedResult(): Result<DecisionValidation> {
  return {
    ok: false,
    error: contractError(
      "decision-engine",
      "NOT_IMPLEMENTED",
      "Operation requires legacy PlanningContext — use decisionEnginePort for block validation",
    ),
  };
}
