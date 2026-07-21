/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { LifeKnowledgeEngine } from "../engine/lifeKnowledgeEngine";
import { clearKnowledgeStore } from "../store/knowledgeStore";
import { baseKnowledgeInput, TEST_USER } from "../testing/fixtures";

describe("LifeKnowledgeEngine", () => {
  const engine = new LifeKnowledgeEngine();

  beforeEach(() => {
    clearKnowledgeStore(TEST_USER);
  });

  it("agrège les connaissances depuis plusieurs sources", () => {
    const snapshot = engine.analyze(baseKnowledgeInput());
    expect(snapshot.knowledgeCount).toBeGreaterThan(3);
    expect(snapshot.confirmedCount).toBeGreaterThan(0);
  });

  it("propose des confirmations sans validation automatique", () => {
    const snapshot = engine.analyze(baseKnowledgeInput());
    expect(snapshot.pendingConfirmations.length).toBeGreaterThan(0);
    expect(snapshot.pendingConfirmations[0]?.message).toContain("J'ai remarqué");
  });

  it("expose une timeline de changements", () => {
    const snapshot = engine.analyze(baseKnowledgeInput());
    expect(snapshot.timeline.some((event) => event.kind === "new_goal")).toBe(true);
  });

  it("chaque item possède source, confiance et dates", () => {
    const item = engine.analyze(baseKnowledgeInput()).visibleItems[0];
    expect(item?.source).toBeTruthy();
    expect(item?.confidence).toBeGreaterThan(0);
    expect(item?.createdAt).toBeTruthy();
    expect(item?.updatedAt).toBeTruthy();
  });
});
