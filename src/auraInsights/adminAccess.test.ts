import { describe, expect, it } from "vitest";

import { isAuraAdmin } from "./adminAccess";

describe("isAuraAdmin", () => {
  it("returns true when app_metadata aura_role is admin", () => {
    expect(isAuraAdmin("user@example.com", { aura_role: "admin" })).toBe(true);
  });

  it("returns true when app_metadata role is admin", () => {
    expect(isAuraAdmin("user@example.com", { role: "admin" })).toBe(true);
  });

  it("falls back to env email list when metadata is absent", () => {
    const previous = import.meta.env.VITE_AURA_ADMIN_EMAILS;
    import.meta.env.VITE_AURA_ADMIN_EMAILS = "admin@aura.test,other@aura.test";

    expect(isAuraAdmin("admin@aura.test", null)).toBe(true);
    expect(isAuraAdmin("guest@aura.test", null)).toBe(false);

    import.meta.env.VITE_AURA_ADMIN_EMAILS = previous;
  });
});
