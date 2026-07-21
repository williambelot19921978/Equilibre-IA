/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { buildTimelineFromInput, recordLifeChange } from "../timeline/lifeTimelineEngine";
import { clearKnowledgeStore, getTimelineEvents } from "../store/knowledgeStore";
import { baseKnowledgeInput, TEST_USER } from "../testing/fixtures";

describe("LifeTimeline", () => {
  beforeEach(() => {
    clearKnowledgeStore(TEST_USER);
  });

  it("historise les nouveaux objectifs", () => {
    const timeline = buildTimelineFromInput(baseKnowledgeInput());
    expect(timeline.some((event) => event.kind === "new_goal")).toBe(true);
  });

  it("enregistre un changement de vie manuel", () => {
    recordLifeChange(TEST_USER, {
      id: "move-1",
      kind: "move",
      title: "Déménagement",
      description: "Nouvelle ville",
      date: "2026-07-20",
      source: "voluntary",
    });
    expect(getTimelineEvents(TEST_USER).some((event) => event.kind === "move")).toBe(true);
  });
});
