/** EPIC 4C — Preview assembly from action draft. */

import type { ActionPreview, SecureActionDraft } from "../types/secureAction";

export function buildPreviewFromDraft(draft: SecureActionDraft): ActionPreview {
  return {
    title: draft.preview.title,
    before: draft.preview.before,
    after: draft.preview.after,
    impact: draft.preview.impact,
    affectedItems: draft.preview.affectedItems,
    confidence: draft.preview.confidence,
    risk: draft.preview.risk,
    why: [
      ...draft.explainability.whyAction,
      ...draft.explainability.whyTarget,
      ...draft.explainability.whyTiming,
    ],
  };
}

export function enrichPreviewConfidence(
  preview: ActionPreview,
  validationValid: boolean,
): ActionPreview {
  if (validationValid) return preview;
  return {
    ...preview,
    confidence: Math.min(preview.confidence, 0.35),
  };
}
