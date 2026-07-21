/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { editItem, filterVisibleKnowledge, forgetItem, resetAllKnowledge } from "../forget/forgetEngine";
import { mergeKnowledgeFromSources } from "../merge/knowledgeMergeEngine";
import { getForgottenIds, getKnowledgeOverrides } from "../store/knowledgeStore";
import { baseKnowledgeInput, TEST_USER } from "../testing/fixtures";

describe("Forget system", () => {
  beforeEach(() => {
    resetAllKnowledge(TEST_USER);
  });

  it("oublie immédiatement une connaissance", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    forgetItem(TEST_USER, items[0]!.id);
    expect(getForgottenIds(TEST_USER)).toContain(items[0]!.id);
    expect(filterVisibleKnowledge(TEST_USER, items).length).toBeLessThan(items.length);
  });

  it("modifie une connaissance", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    editItem(TEST_USER, items[0]!.id, { value: "Nouvelle valeur" });
    const updated = filterVisibleKnowledge(TEST_USER, items).find((item) => item.id === items[0]!.id);
    expect(updated?.value).toBe("Nouvelle valeur");
    expect(getKnowledgeOverrides(TEST_USER)[items[0]!.id]?.value).toBe("Nouvelle valeur");
  });

  it("réinitialise toutes les overrides", () => {
    const items = mergeKnowledgeFromSources(baseKnowledgeInput());
    forgetItem(TEST_USER, items[0]!.id);
    resetAllKnowledge(TEST_USER);
    expect(getForgottenIds(TEST_USER)).toHaveLength(0);
  });
});
