import { describe, expect, it } from "vitest";

import { withRetry } from "./errorRecoveryEngine";

describe("errorRecoveryEngine", () => {
  it("réessaie puis réussit", async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new TypeError("network");
      return "ok";
    }, { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2 });

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });
});
