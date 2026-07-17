import { describe, expect, it } from "vitest";

import {
  PlanningGenerationError,
  getPlanningErrorMessage,
  isPlanningGenerationError,
} from "./planningGenerationError";

describe("PlanningGenerationError", () => {
  it("exposes a user-facing message", () => {
    const error = new PlanningGenerationError({
      code: "TEST",
      userMessage: "Le rendez-vous « Médecin » se termine avant son heure de début.",
      technicalDetails: "ends_at <= starts_at",
      entityId: "item-1",
      step: "normalize",
    });

    expect(isPlanningGenerationError(error)).toBe(true);
    expect(getPlanningErrorMessage(error)).toBe(
      "Le rendez-vous « Médecin » se termine avant son heure de début.",
    );
    expect(error.step).toBe("normalize");
  });

  it("formats Supabase RLS errors", () => {
    const error = PlanningGenerationError.fromSupabase({
      operation: "DELETE",
      step: "save",
      error: {
        message: "new row violates row-level security policy",
        code: "42501",
      },
    });

    expect(error.userMessage).toContain("[calendar_items] DELETE");
    expect(error.userMessage).toContain("42501");
  });
});
