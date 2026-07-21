/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";

import { mapAuthError, mapUserFacingError } from "./userFacingError";

describe("userFacingError", () => {
  it("maps Supabase auth errors to French", () => {
    expect(mapAuthError(new Error("Invalid login credentials"))).toContain("Identifiants");
  });

  it("hides technical supabase table errors", () => {
    expect(
      mapUserFacingError(
        new Error("[tasks] INSERT — row-level security"),
        "Erreur",
      ),
    ).toContain("Accès refusé");
  });
});
