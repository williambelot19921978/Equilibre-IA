/**
 * EPIC1-B — Present translated reasons for UI (no business logic in React).
 */

import type { ExplainabilityReasonCode } from "./explainabilityReasonCodes";
import { translateExplainabilityReasons } from "./translateExplainabilityReasons";

export function presentExplainabilityReasons(
  codes: readonly ExplainabilityReasonCode[],
): string[] {
  return translateExplainabilityReasons(codes);
}
