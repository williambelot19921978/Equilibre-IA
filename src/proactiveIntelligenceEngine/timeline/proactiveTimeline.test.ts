/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  acceptSuggestion,
  dismissSuggestion,
  clearSuggestions,
  upsertSuggestion,
} from "../suggestion/suggestionStore";
import {
  clearProactiveTimeline,
  getProactiveTimeline,
  recordSuggestionLifecycle,
} from "./proactiveTimeline";
import { generateSuggestions } from "../suggestion/suggestionEngine";
import { BUSY_DAY_INPUT } from "../testing/fixtures";
import type { ProactiveSuggestion } from "../types/proactiveTypes";

const USER = "timeline-proactive";

describe("ProactiveTimeline", () => {
  beforeEach(() => {
    clearSuggestions(USER);
    clearProactiveTimeline(USER);
  });

  it("historise création, affichage, acceptation, refus", () => {
    const suggestions = generateSuggestions({ ...BUSY_DAY_INPUT, userId: USER });
    const suggestion = suggestions[0]!;

    recordSuggestionLifecycle(USER, suggestion, "suggestion_created");
    recordSuggestionLifecycle(USER, { ...suggestion, status: "displayed" }, "suggestion_displayed");

    upsertSuggestion(USER, { ...suggestion, status: "displayed" });
    const accepted = acceptSuggestion(USER, suggestion.id);
    if (accepted) {
      recordSuggestionLifecycle(USER, accepted, "suggestion_accepted");
    }

    const timeline = getProactiveTimeline(USER);
    expect(timeline.some((entry) => entry.kind === "suggestion_created")).toBe(true);
    expect(timeline.some((entry) => entry.kind === "suggestion_displayed")).toBe(true);
    expect(timeline.some((entry) => entry.kind === "suggestion_accepted")).toBe(true);
  });

  it("historise refus utilisateur", () => {
    const suggestions = generateSuggestions({ ...BUSY_DAY_INPUT, userId: USER });
    const suggestion = suggestions[0]!;
    upsertSuggestion(USER, suggestion);

    dismissSuggestion(USER, suggestion.id);
    recordSuggestionLifecycle(USER, { ...suggestion, status: "dismissed" }, "suggestion_dismissed");

    expect(getProactiveTimeline(USER).some((entry) => entry.kind === "suggestion_dismissed")).toBe(
      true,
    );
  });
});
