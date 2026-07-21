/**
 * Shadow comparison types — Sprint A3 DecisionEngine migration.
 */

export type ValidationResultLike = {
  readonly valid: boolean;
  readonly reason: string;
};

export type ShadowComparisonResult = {
  readonly operation: string;
  readonly matched: boolean;
  readonly legacy: ValidationResultLike;
  readonly candidate: ValidationResultLike;
  readonly explanation: string;
};
