import { describe, expect, it } from "vitest";

import { buildPreviewFromDraft, enrichPreviewConfidence } from "../preview/previewEngine";
import type { SecureActionDraft } from "../types/secureAction";

const draft: SecureActionDraft = {
  type: "createTask",
  description: "Créer",
  summary: "Créer tâche",
  target: "tasks",
  payload: { userId: "u1", title: "Test" },
  riskLevel: "low",
  requiresConfirmation: true,
  estimatedImpact: "Ajout",
  sourceIntent: "organization",
  origin: "assistant",
  preview: {
    title: "Créer une tâche",
    before: ["Avant"],
    after: ["Après"],
    impact: "Impact",
    affectedItems: ["Test"],
    confidence: 0.8,
    risk: "low",
    why: [],
  },
  explainability: {
    summary: "Pour organisation",
    whyAction: ["Intent organisation"],
    whyTarget: ["Titre proposé"],
    whyTiming: ["Aujourd'hui"],
  },
};

describe("EPIC4C PreviewEngine", () => {
  it("assemble la preview avec explainability", () => {
    const preview = buildPreviewFromDraft(draft);
    expect(preview.before).toEqual(["Avant"]);
    expect(preview.after).toEqual(["Après"]);
    expect(preview.why).toContain("Intent organisation");
    expect(preview.why).toContain("Titre proposé");
  });

  it("baisse la confiance si validation échouée", () => {
    const enriched = enrichPreviewConfidence(draft.preview, false);
    expect(enriched.confidence).toBeLessThanOrEqual(0.35);
  });
});
