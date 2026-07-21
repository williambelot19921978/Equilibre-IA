import { describe, expect, it } from "vitest";

import { evaluateAttention } from "./attentionEngine";
import { generateSuggestions } from "../suggestion/suggestionEngine";
import {
  BUSY_DAY_INPUT,
  EMPTY_DAY_INPUT,
  FOCUS_NOW,
  MEETING_NOW,
  focusEvent,
  meetingEvent,
} from "../testing/fixtures";

describe("AttentionEngine", () => {
  it("bloque intervention pendant une réunion", () => {
    const suggestions = generateSuggestions({
      ...BUSY_DAY_INPUT,
      calendarEvents: [meetingEvent(9)],
    });
    const suggestion = suggestions[0]!;
    const decision = evaluateAttention({
      suggestion,
      now: MEETING_NOW,
      calendarEvents: [meetingEvent(9)],
      mentalLoad: 0.5,
      availability: 0.3,
      dismissCount: 0,
      totalShown: 1,
    });

    expect(decision.shouldIntervene).toBe(false);
    expect(decision.why).toContain("réunion");
    expect(decision.delayUntil).toBeTruthy();
  });

  it("bloque intervention pendant focus", () => {
    const suggestions = generateSuggestions(BUSY_DAY_INPUT);
    const suggestion = suggestions[0]!;
    const decision = evaluateAttention({
      suggestion,
      now: FOCUS_NOW,
      calendarEvents: [focusEvent()],
      mentalLoad: 0.8,
      availability: 0.2,
      dismissCount: 0,
      totalShown: 1,
    });

    expect(decision.shouldIntervene).toBe(false);
    expect(decision.why).toBeTruthy();
  });

  it("autorise intervention quand score suffisant et moment calme", () => {
    const suggestions = generateSuggestions(BUSY_DAY_INPUT);
    const alert = suggestions.find((suggestion) => suggestion.kind === "alert");
    expect(alert).toBeDefined();

    const decision = evaluateAttention({
      suggestion: alert!,
      now: EMPTY_DAY_INPUT.now!,
      calendarEvents: [],
      mentalLoad: 0.5,
      availability: 0.8,
      dismissCount: 0,
      totalShown: 1,
    });

    expect(decision.shouldIntervene).toBe(true);
    expect(decision.score.finalScore).toBeGreaterThan(0.4);
    expect(decision.why).toContain("Score");
  });

  it("annule suggestion si historique de refus élevé", () => {
    const suggestions = generateSuggestions(BUSY_DAY_INPUT);
    expect(suggestions.length).toBeGreaterThan(0);
    const suggestion = suggestions[0]!;
    const decision = evaluateAttention({
      suggestion,
      now: EMPTY_DAY_INPUT.now!,
      calendarEvents: [],
      mentalLoad: 0.3,
      availability: 0.5,
      dismissCount: 9,
      totalShown: 10,
      kindDismissRate: 0.9,
    });

    expect(decision.cancel).toBe(true);
    expect(decision.shouldIntervene).toBe(false);
  });
});
