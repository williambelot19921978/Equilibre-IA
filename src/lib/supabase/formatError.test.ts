import { describe, expect, it } from "vitest";

import { formatSupabaseError } from "./formatError";

describe("formatSupabaseError", () => {
  it("affiche message, code, details et hint pour un objet Postgrest plain", () => {
    const formatted = formatSupabaseError({
      table: "calendar_items",
      operation: "INSERT",
      error: {
        message:
          'new row for relation "calendar_items" violates check constraint "calendar_items_source_check"',
        code: "23514",
        details: "Failing row contains (...)",
        hint: null,
      },
    });

    expect(formatted.message).toContain("[calendar_items] INSERT");
    expect(formatted.message).toContain("violates check constraint");
    expect(formatted.message).toContain("code=23514");
    expect(formatted.message).toContain("details=Failing row contains");
  });

  it("n'affiche plus « erreur inconnue » pour un objet Postgrest", () => {
    const formatted = formatSupabaseError({
      table: "calendar_items",
      operation: "INSERT",
      error: {
        message: "check constraint failed",
        code: "23514",
      },
    });

    expect(formatted.message).not.toContain("erreur inconnue");
  });
});
