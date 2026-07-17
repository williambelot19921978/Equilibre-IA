import { describe, expect, it } from "vitest";

describe("QuickActionCard", () => {
  it("K. exposes actionable card structure via module", async () => {
    const module = await import("./QuickActionCard");
    expect(typeof module.QuickActionCard).toBe("function");
  });
});
