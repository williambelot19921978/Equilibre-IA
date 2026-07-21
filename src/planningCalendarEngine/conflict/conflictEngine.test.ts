import { describe, expect, it } from "vitest";

import { detectCalendarConflicts } from "../conflict/conflictEngine";
import {
  FIXTURE_GOAL_APPOINTMENT,
  FIXTURE_OVERLAPS,
  FIXTURE_SIMPLE,
  item,
} from "../testing/fixtures";

describe("EPIC5A Conflict Engine", () => {
  it("agenda simple — aucun conflit", () => {
    expect(detectCalendarConflicts(FIXTURE_SIMPLE)).toHaveLength(0);
  });

  it("détecte les chevauchements", () => {
    const conflicts = detectCalendarConflicts(FIXTURE_OVERLAPS);
    expect(conflicts.some((conflict) => conflict.kind === "overlap")).toBe(true);
  });

  it("détecte objectif pendant rendez-vous", () => {
    const conflicts = detectCalendarConflicts(FIXTURE_GOAL_APPOINTMENT);
    expect(conflicts.some((conflict) => conflict.kind === "goal_during_appointment")).toBe(
      true,
    );
  });

  it("détecte les doublons probables", () => {
    const conflicts = detectCalendarConflicts([
      item({
        id: "dup-1",
        title: "Réunion équipe",
        start: "2026-07-20T09:00:00.000Z",
        end: "2026-07-20T10:00:00.000Z",
      }),
      item({
        id: "dup-2",
        title: "Réunion équipe",
        start: "2026-07-20T09:02:00.000Z",
        end: "2026-07-20T10:02:00.000Z",
      }),
    ]);
    expect(conflicts.some((conflict) => conflict.kind === "duplicate")).toBe(true);
  });

  it("détecte créneaux impossibles", () => {
    const conflicts = detectCalendarConflicts([
      item({
        id: "bad-1",
        title: "Durée nulle",
        start: "2026-07-20T09:00:00.000Z",
        end: "2026-07-20T09:00:00.000Z",
      }),
    ]);
    expect(conflicts.some((conflict) => conflict.kind === "impossible_slot")).toBe(true);
  });

  it("détecte sync incompatible entre sources externes", () => {
    const conflicts = detectCalendarConflicts([
      item({
        id: "ext-1",
        title: "Google event",
        start: "2026-07-20T09:00:00.000Z",
        end: "2026-07-20T10:00:00.000Z",
        syncState: "external",
        source: "google-calendar",
        origin: "google",
      }),
      item({
        id: "ext-2",
        title: "Outlook event",
        start: "2026-07-20T09:30:00.000Z",
        end: "2026-07-20T10:30:00.000Z",
        syncState: "external",
        source: "outlook",
        origin: "internal",
      }),
    ]);
    expect(conflicts.some((conflict) => conflict.kind === "sync_incompatible")).toBe(true);
  });
});
