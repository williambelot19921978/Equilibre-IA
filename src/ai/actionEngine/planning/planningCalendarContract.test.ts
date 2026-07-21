import { describe, expect, it } from "vitest";

import {
  buildPlanningCalendarTarget,
  buildScopePreviewHint,
  resolveDefaultCalendarScope,
  resolvePlanningOperation,
} from "./planningCalendarContract";
import { enrichDraftMetadata } from "../builders/actionBuilders";
import type { SecureActionDraft } from "../types/secureAction";

describe("EPIC4C PlanningCalendarContract", () => {
  it("rescheduleEvent cible une opération synchronisée sans Google direct", () => {
    const operation = resolvePlanningOperation("rescheduleEvent");
    expect(operation).toBe("rescheduleEvent");

    const scope = resolveDefaultCalendarScope("rescheduleEvent");
    expect(scope).toBe("synchronized");

    const target = buildPlanningCalendarTarget({
      operation: "rescheduleEvent",
      scope,
      date: "2026-07-20",
      summary: "Reporter bloc",
    });
    expect(target.operation).toBe("rescheduleEvent");
    expect(target.scope).toBe("synchronized");

    const hint = buildScopePreviewHint("synchronized");
    expect(hint.userMessage).toMatch(/Aura et votre agenda/i);
  });

  it("enrichDraftMetadata marque rescheduleEvent non exécutable", () => {
    const draft: SecureActionDraft = {
      type: "rescheduleEvent",
      description: "Reporter",
      summary: "Reporter bloc",
      target: "planning",
      payload: { userId: "u1", date: "2026-07-20", entryId: "" },
      riskLevel: "medium",
      requiresConfirmation: true,
      estimatedImpact: "Déplacement",
      sourceIntent: "planning",
      origin: "assistant",
      preview: {
        title: "Reporter",
        before: [],
        after: [],
        impact: "Impact",
        affectedItems: [],
        confidence: 0.5,
        risk: "medium",
        why: [],
      },
      explainability: {
        summary: "s",
        whyAction: [],
        whyTarget: [],
        whyTiming: [],
      },
    };

    const enriched = enrichDraftMetadata(draft);
    expect(enriched.executionAvailable).toBe(false);
    expect(enriched.planningTarget?.operation).toBe("rescheduleEvent");
    expect(enriched.calendarScope).toBe("synchronized");
  });
});
