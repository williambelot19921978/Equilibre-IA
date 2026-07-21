/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  buildConfirmationMessage,
  generateConfirmationProposals,
  shouldProposeConfirmation,
} from "../confirmation/confirmationEngine";
import { clearKnowledgeStore } from "../store/knowledgeStore";
import { mergeKnowledgeFromSources } from "../merge/knowledgeMergeEngine";
import { baseKnowledgeInput, TEST_USER } from "../testing/fixtures";

describe("ConfirmationEngine", () => {
  beforeEach(() => {
    clearKnowledgeStore(TEST_USER);
  });

  it("propose confirmation quand confiance suffisante", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    const observed = items.find((item) => item.source === "observed")!;
    expect(shouldProposeConfirmation(observed, [])).toBe(true);
    expect(buildConfirmationMessage(observed)).toContain("Souhaites-tu");
  });

  it("jamais de validation automatique", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    const proposals = generateConfirmationProposals(TEST_USER, items);
    expect(proposals.every((item) => item.status === "pending" || item.status === "deferred")).toBe(
      true,
    );
  });
});
