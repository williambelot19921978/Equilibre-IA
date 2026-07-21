/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { observeFromInput, recordObservations } from "./observationEngine";
import { clearObservations, getObservations } from "./observationStore";

const USER = "obs-test-user";

describe("ObservationEngine", () => {
  beforeEach(() => {
    clearObservations(USER);
  });

  it("observe les événements calendrier avec timestamp, source, type, confidence", () => {
    const observations = observeFromInput({
      userId: USER,
      date: "2026-07-20",
      calendarEvents: [
        {
          id: "evt-1",
          title: "Basic Fit",
          start: "2026-07-20T18:30:00.000Z",
          end: "2026-07-20T19:30:00.000Z",
          category: "sport",
        },
      ],
    });

    expect(observations.length).toBeGreaterThanOrEqual(2);
    expect(observations[0]?.timestamp).toBeTruthy();
    expect(observations[0]?.source).toBe("calendar");
    expect(observations[0]?.type).toBe("repeated");
    expect(observations[0]?.confidence).toBeGreaterThan(0);
    expect(observations.some((obs) => obs.metadata.kind === "sport")).toBe(true);
  });

  it("détecte créations, reports et annulations via taskEvents", () => {
    const observations = observeFromInput({
      userId: USER,
      date: "2026-07-20",
      taskEvents: [
        {
          id: "te-1",
          title: "Révision maths",
          eventType: "created",
          occurredAt: "2026-07-20T10:00:00.000Z",
        },
        {
          id: "te-2",
          title: "Révision maths",
          eventType: "moved",
          occurredAt: "2026-07-20T11:00:00.000Z",
        },
        {
          id: "te-3",
          title: "Réunion",
          eventType: "cancelled",
          occurredAt: "2026-07-20T12:00:00.000Z",
        },
      ],
    });

    expect(observations.some((obs) => obs.type === "created")).toBe(true);
    expect(observations.some((obs) => obs.type === "moved")).toBe(true);
    expect(observations.some((obs) => obs.type === "cancelled")).toBe(true);
    expect(observations.some((obs) => obs.type === "rescheduled")).toBe(true);
  });

  it("historise toutes les observations", () => {
    recordObservations(USER, {
      userId: USER,
      date: "2026-07-20",
      calendarEvents: [
        {
          id: "evt-1",
          title: "Course",
          start: "2026-07-20T07:00:00.000Z",
          end: "2026-07-20T08:00:00.000Z",
          category: "sport",
        },
      ],
    });

    const history = getObservations(USER);
    expect(history.length).toBeGreaterThan(0);
    expect(history.every((obs) => obs.metadata)).toBeTruthy();
  });
});
