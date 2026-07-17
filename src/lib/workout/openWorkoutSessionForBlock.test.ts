import { describe, expect, it } from "vitest";

import { generateWorkoutSession } from "../../ai/workoutGenerationEngine";
import {
  isSportProposalEntry,
  isValidWorkoutSession,
  openWorkoutSessionForBlock,
  resolveWorkoutSessionForEntry,
} from "./openWorkoutSessionForBlock";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";

const date = "2026-07-20";
const session = generateWorkoutSession({
  durationMinutes: 15,
  level: "beginner",
  slotHour: 14,
});

function baseEntry(overrides: Partial<DayTimelineEntry> = {}): DayTimelineEntry {
  return {
    id: "entry-1",
    visualType: "sport",
    title: "Sport",
    startsAt: `${date}T16:00:00.000Z`,
    endsAt: `${date}T16:30:00.000Z`,
    locked: false,
    origin: "persisted",
    blockKind: "task",
    calendarItemId: "cal-1",
    activityType: "sport",
    ...overrides,
  };
}

describe("openWorkoutSessionForBlock", () => {
  it("A. ouvre une séance persistée présente", () => {
    const entry = baseEntry({ workoutSession: session });
    const outcome = openWorkoutSessionForBlock(entry, session);
    expect(outcome.status).toBe("opened");
    if (outcome.status === "opened") {
      expect(outcome.isProposal).toBe(false);
      expect(outcome.session.id).toBe(session.id);
    }
  });

  it("B. sport sans séance → needs_session", () => {
    const outcome = openWorkoutSessionForBlock(baseEntry());
    expect(outcome.status).toBe("needs_session");
  });

  it("C. proposition sur créneau libre reconnue", () => {
    const entry = baseEntry({
      blockKind: "free_slot",
      origin: "computed",
      calendarItemId: undefined,
      workoutSession: undefined,
      proposedWorkoutSession: session,
    });
    expect(isSportProposalEntry(entry)).toBe(true);
    const outcome = openWorkoutSessionForBlock(entry);
    expect(outcome.status).toBe("opened");
    if (outcome.status === "opened") {
      expect(outcome.isProposal).toBe(true);
    }
  });

  it("D. séance invalide détectée", () => {
    const outcome = openWorkoutSessionForBlock(baseEntry(), {
      id: "bad",
    } as never);
    expect(outcome.status).toBe("needs_session");
  });

  it("E. séance persistée ne doit pas être traitée comme proposition", () => {
    const entry = baseEntry({
      workoutSession: session,
      proposedWorkoutSession: session,
    });
    expect(isSportProposalEntry(entry)).toBe(false);
    expect(resolveWorkoutSessionForEntry(entry, session)?.id).toBe(session.id);
  });

  it("F. isValidWorkoutSession valide une séance générée", () => {
    expect(isValidWorkoutSession(session)).toBe(true);
    expect(isValidWorkoutSession({ title: "x" })).toBe(false);
  });

  it("G. aucune action silencieuse pour non-sport", () => {
    const outcome = openWorkoutSessionForBlock(
      baseEntry({ visualType: "task", activityType: undefined }),
    );
    expect(outcome.status).toBe("not_sport");
  });

  it("H. proposition créneau libre reconnue comme sport", () => {
    const session = generateWorkoutSession({
      durationMinutes: 10,
      level: "beginner",
      slotHour: 14,
    });
    const freeSlot = baseEntry({
      visualType: "free",
      blockKind: "free_slot",
      origin: "computed",
      calendarItemId: undefined,
      proposedWorkoutSession: session,
    });
    const outcome = openWorkoutSessionForBlock(freeSlot);
    expect(outcome.status).toBe("opened");
  });
});
