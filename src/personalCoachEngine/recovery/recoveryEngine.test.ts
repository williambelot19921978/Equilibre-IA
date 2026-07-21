import { describe, expect, it } from "vitest";

import { detectRecoveryNeeds } from "../recovery/recoveryEngine";
import { baseCoachInput, tiredCoachInput } from "../testing/fixtures";

describe("RecoveryEngine", () => {
  it("détecte fatigue et propose allègement", () => {
    const recovery = detectRecoveryNeeds(tiredCoachInput());
    expect(recovery.length).toBeGreaterThan(0);
    expect(recovery[0]?.suggestion).toMatch(/reporter|pause|alléger/i);
  });

  it("détecte surcharge mentale", () => {
    const recovery = detectRecoveryNeeds(
      baseCoachInput({ mentalLoad: 85, dailyStress: 9, conflictCount: 3 }),
    );
    expect(recovery.some((item) => item.title.includes("Surcharge"))).toBe(true);
  });

  it("reste bienveillant — pas de critique", () => {
    for (const item of detectRecoveryNeeds(tiredCoachInput())) {
      expect(item.message.toLowerCase()).not.toMatch(/échec|nul|mauvais/);
    }
  });
});
