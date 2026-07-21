import { describe, expect, it } from "vitest";

import { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import {
  canRescheduleSemantically,
  shouldBlockMedicalBeforeSport,
} from "../action/semanticActionGuards";
import { ITEM_DENTIST, ITEM_GYM } from "../testing/fixtures";

describe("EPIC5C semanticActionGuards", () => {
  const engine = new SemanticPlanningEngine({
    planningEngine: { buildSnapshot: async () => ({}) } as never,
  });

  it("bloque déplacement RDV médical avant sport", () => {
    const sportBefore = {
      ...ITEM_GYM,
      start: "2026-07-20T10:00:00.000Z",
      end: "2026-07-20T11:00:00.000Z",
    };
    const [medical, sport] = engine.enrichItems([ITEM_DENTIST, sportBefore]);
    expect(
      shouldBlockMedicalBeforeSport({
        source: medical!,
        target: sport!,
      }),
    ).toBe(true);
  });

  it("RDV médical non déplaçable", () => {
    const [medical] = engine.enrichItems([ITEM_DENTIST]);
    expect(canRescheduleSemantically(medical!)).toBe(false);
  });
});
