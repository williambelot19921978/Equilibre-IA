import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { computeEveningFreeSegments } from "../planning/computeEveningFreeSegments";
import {
  resolveAvailableStudyRevisionDurations,
  resolveRecommendedStudyRevisionDuration,
  validateStudyRevisionDuration,
} from "../planning/resolveStudyRevisionDuration";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";

describe("Sprint 4.7 — durée révision & affichage planning", () => {
  it("A. durée recommandée mais modifiable via options", () => {
    const recommended = resolveRecommendedStudyRevisionDuration({
      slotMinutes: 180,
      preferredFocusMinutes: 30,
      energy: "medium",
      hour: 20,
    });
    const options = resolveAvailableStudyRevisionDurations(180);
    expect(options).toContain(recommended);
    expect(options.length).toBeGreaterThan(1);
  });

  it("B. choix 10 min autorisé si créneau suffisant", () => {
    expect(resolveAvailableStudyRevisionDurations(60)).toContain(10);
  });

  it("C. choix 30 min autorisé", () => {
    expect(resolveAvailableStudyRevisionDurations(60)).toContain(30);
  });

  it("D. choix 60 min si créneau suffisant", () => {
    expect(resolveAvailableStudyRevisionDurations(90)).toContain(60);
  });

  it("E. durée refusée si trop longue", () => {
    const result = validateStudyRevisionDuration(60, 45);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/créneau/i);
  });

  it("F. acceptation study sans regénération complète", () => {
    const service = readFileSync(
      resolve(process.cwd(), "src/services/suggestionAcceptanceService.ts"),
      "utf8",
    );
    expect(service).toContain("acceptStudyRevisionSuggestion");
    expect(service).toContain('userAccepted: true');
    expect(service).toContain('activityType: "revision"');
    expect(service).toContain("loadDisplayedDayPlan");
  });

  it("G. soirée scindée après révision acceptée", () => {
    const revision: DayTimelineEntry = {
      id: "revision-1",
      visualType: "task",
      title: "Révision",
      startsAt: "2026-07-20T20:30:00",
      endsAt: "2026-07-20T21:00:00",
      locked: true,
      origin: "persisted",
      blockKind: "override",
      calendarItemId: "ci-revision",
      activityType: "revision" as DayTimelineEntry["activityType"],
    };

    const segments = computeEveningFreeSegments({
      occupiedEntries: [revision],
      eveningStart: "2026-07-20T20:30:00",
      eveningEnd: "2026-07-20T23:30:00",
    });

    expect(segments).toHaveLength(1);
    expect(segments[0]?.startsAt).toBe("2026-07-20T21:00:00");
    expect(segments[0]?.endsAt).toBe("2026-07-20T23:30:00");
  });

  it("H. révision persistée visible comme tâche", async () => {
    const { persistedItemToTimelineEntry } = await import(
      "../planning/displayedDayTimeline"
    );

    const entry = persistedItemToTimelineEntry({
      id: "ci-1",
      household_id: "h",
      user_id: "u",
      task_id: null,
      title: "Formation naturopathie",
      item_type: "task",
      starts_at: "2026-07-20T20:30:00",
      ends_at: "2026-07-20T21:00:00",
      locked: true,
      source: "user",
      details: {
        businessType: "study",
        activityType: "revision",
        userAccepted: true,
      },
      created_at: "",
      updated_at: "",
    });

    expect(entry.title).toBe("Révision");
    expect(entry.visualType).toBe("task");
    expect(entry.calendarItemId).toBe("ci-1");
  });

  it("I. temps libre raccourci après révision dans la soirée", () => {
    const segments = computeEveningFreeSegments({
      occupiedEntries: [
        {
          id: "revision-1",
          visualType: "task",
          title: "Révision",
          startsAt: "2026-07-20T20:30:00",
          endsAt: "2026-07-20T21:00:00",
          locked: true,
          origin: "persisted",
          blockKind: "override",
          calendarItemId: "ci-revision",
        },
      ],
      eveningStart: "2026-07-20T20:30:00",
      eveningEnd: "2026-07-20T23:30:00",
    });

    expect(segments[0]?.title).toMatch(/Temps libre/i);
  });
});
