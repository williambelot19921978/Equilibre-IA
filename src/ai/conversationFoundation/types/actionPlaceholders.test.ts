import { describe, expect, it } from "vitest";

import {
  CONVERSATION_ACTION_PLACEHOLDERS,
  executePlaceholderAction,
} from "./actionPlaceholders";

describe("EPIC4-A Action placeholders", () => {
  it("expose les actions futures sans exécution", async () => {
    expect(CONVERSATION_ACTION_PLACEHOLDERS.length).toBeGreaterThan(3);

    const result = await executePlaceholderAction("createTask", { title: "Test" });
    expect(result.status).toBe("not_implemented");
  });
});
