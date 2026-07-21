export {
  validatePlannedBlockViaPort,
  validateDayPlanViaPort,
  type ValidatePlannedBlockInput,
  type BlockValidationResult,
} from "./decisionEnginePort";

export {
  compareValidationResults,
  getShadowComparisonLog,
  clearShadowComparisonLog,
} from "./shadowCompare";

export {
  createLegacyDecisionEngineAdapter,
  LegacyDecisionEngineAdapter,
} from "./legacyDecisionEngineAdapter";

export type { ShadowComparisonResult, ValidationResultLike } from "./types";
