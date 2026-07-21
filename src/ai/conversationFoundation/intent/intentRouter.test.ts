import { describe, expect, it } from "vitest";

import {
  classifyIntent,
  createIntentRouterRegistry,
} from "./intentRouter";

describe("EPIC4-A Intent Router", () => {
  it("détecte l'intention planning", () => {
    const result = classifyIntent("Comment organiser mon planning de demain ?");
    expect(result.intent).toBe("planning");
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("retombe sur conversation libre sans mot-clé métier", () => {
    const result = classifyIntent("Bonjour, comment vas-tu ?");
    expect(result.intent).toBe("free_conversation");
  });

  it("accepte de nouvelles règles via le registre", () => {
    const registry = createIntentRouterRegistry().register({
      intent: "finances",
      keywords: ["crypto", "bourse"],
      weight: 12,
    });

    const result = classifyIntent("Parle-moi de crypto", registry);
    expect(result.intent).toBe("finances");
  });
});
