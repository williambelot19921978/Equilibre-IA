import { describe, expect, it } from "vitest";

import type { DayConstraint } from "../../types/planning";
import { mergeOverlappingConstraints } from "./mergeOverlappingConstraints";

function makeConstraint(
  overrides: Partial<DayConstraint> & Pick<DayConstraint, "startsAt" | "endsAt">,
): DayConstraint {
  return {
    id: "c-1",
    type: "manual",
    title: "Bloc",
    locked: true,
    source: "manual",
    ...overrides,
  };
}

describe("mergeOverlappingConstraints", () => {
  it("F. merges two overlapping manual appointments", () => {
    const merged = mergeOverlappingConstraints([
      makeConstraint({
        id: "a",
        title: "Médecin",
        startsAt: "2026-07-13T12:00:00.000Z",
        endsAt: "2026-07-13T13:30:00.000Z",
      }),
      makeConstraint({
        id: "b",
        title: "Pharmacie",
        startsAt: "2026-07-13T13:00:00.000Z",
        endsAt: "2026-07-13T14:00:00.000Z",
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].title).toContain("Médecin");
    expect(merged[0].title).toContain("Pharmacie");
    expect(merged[0].endsAt).toBe("2026-07-13T14:00:00.000Z");
  });

  it("E. keeps work and manual overlap as one merged interval", () => {
    const merged = mergeOverlappingConstraints([
      makeConstraint({
        id: "work",
        type: "work",
        title: "Travail",
        source: "engine",
        startsAt: "2026-07-13T07:00:00.000Z",
        endsAt: "2026-07-13T15:00:00.000Z",
      }),
      makeConstraint({
        id: "manual",
        title: "Réunion externe",
        startsAt: "2026-07-13T14:00:00.000Z",
        endsAt: "2026-07-13T16:00:00.000Z",
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].startsAt).toBe("2026-07-13T07:00:00.000Z");
    expect(merged[0].endsAt).toBe("2026-07-13T16:00:00.000Z");
  });

  it("keeps adjacent commute and work as separate blocks", () => {
    const merged = mergeOverlappingConstraints([
      makeConstraint({
        id: "commute-out",
        type: "commute_out",
        title: "Trajet aller",
        source: "engine",
        startsAt: "2026-07-13T07:00:00.000Z",
        endsAt: "2026-07-13T08:30:00.000Z",
      }),
      makeConstraint({
        id: "work",
        type: "work",
        title: "Travail",
        source: "engine",
        startsAt: "2026-07-13T08:30:00.000Z",
        endsAt: "2026-07-13T16:30:00.000Z",
      }),
      makeConstraint({
        id: "commute-in",
        type: "commute_in",
        title: "Trajet retour",
        source: "engine",
        startsAt: "2026-07-13T16:30:00.000Z",
        endsAt: "2026-07-13T17:00:00.000Z",
      }),
    ]);

    expect(merged).toHaveLength(3);
    expect(merged.some((item) => item.type === "work")).toBe(true);
    expect(merged.filter((item) => item.type === "commute_out" || item.type === "commute_in")).toHaveLength(2);
  });

  it("never produces negative duration", () => {
    const merged = mergeOverlappingConstraints([
      makeConstraint({
        startsAt: "2026-07-13T10:00:00.000Z",
        endsAt: "2026-07-13T11:00:00.000Z",
      }),
    ]);

    expect(
      new Date(merged[0].endsAt).getTime() -
        new Date(merged[0].startsAt).getTime(),
    ).toBeGreaterThan(0);
  });

  it("preserves wake and sleep markers", () => {
    const merged = mergeOverlappingConstraints([
      makeConstraint({
        id: "wake",
        type: "wake",
        title: "Réveil",
        source: "engine",
        startsAt: "2026-07-13T06:30:00.000Z",
        endsAt: "2026-07-13T06:30:00.000Z",
      }),
      makeConstraint({
        id: "sleep",
        type: "sleep",
        title: "Sommeil",
        source: "engine",
        startsAt: "2026-07-13T22:00:00.000Z",
        endsAt: "2026-07-13T22:00:00.000Z",
      }),
      makeConstraint({
        startsAt: "2026-07-13T12:00:00.000Z",
        endsAt: "2026-07-13T13:00:00.000Z",
      }),
    ]);

    expect(merged.some((item) => item.type === "wake")).toBe(true);
    expect(merged.some((item) => item.type === "sleep")).toBe(true);
  });
});
