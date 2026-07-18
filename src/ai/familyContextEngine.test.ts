import { describe, expect, it } from "vitest";

import {
  findOverlappingPeriods,
  getActivePeriodsForDate,
  resolveFamilyContextForDate,
} from "../ai/familyContextEngine";
import type { FamilyContextPeriodRecord } from "../types/familyContext";

function createPeriod(
  overrides: Partial<FamilyContextPeriodRecord> = {},
): FamilyContextPeriodRecord {
  return {
    id: "period-1",
    household_id: "household-1",
    user_id: null,
    context_type: "user_vacation",
    title: "Vacances",
    starts_at: "2026-07-01T00:00:00.000Z",
    ends_at: "2026-07-31T23:59:00.000Z",
    affected_member_id: null,
    impact: {},
    description: null,
    status: "active",
    created_by: "user-1",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("familyContextEngine", () => {
  it("A — vacances : désactive le travail habituel", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [
        createPeriod({
          context_type: "user_vacation",
          title: "Vacances familiales",
        }),
      ],
      date: "2026-07-13",
      currentUserId: "user-1",
    });

    expect(resolved.disableWork).toBe(true);
    expect(resolved.userVacation).toBe(true);
    expect(resolved.adaptations).toContain(
      "Les horaires de travail habituels sont désactivés pendant tes vacances.",
    );
  });

  it("B — William absent : utilisateur indisponible", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [
        createPeriod({
          id: "travel-1",
          context_type: "work_travel",
          title: "William en déplacement",
          user_id: "william-id",
          starts_at: "2026-07-18T00:00:00.000Z",
          ends_at: "2026-07-24T23:59:00.000Z",
        }),
      ],
      date: "2026-07-20",
      currentUserId: "madeline-id",
    });

    expect(resolved.unavailableUserIds).toContain("william-id");
  });

  it("C — parent seul : remplissage maximum 60 %", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [
        createPeriod({
          context_type: "solo_parent",
          title: "Seule avec les enfants",
        }),
      ],
      date: "2026-07-13",
      currentUserId: "user-1",
    });

    expect(resolved.maxFillRatio).toBe(0.6);
    expect(resolved.soloParentWithChildren).toBe(true);
  });

  it("D — vacances enfants : pas de départ école automatique", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [
        createPeriod({
          context_type: "children_vacation",
          title: "Vacances des enfants",
        }),
      ],
      date: "2026-07-13",
      currentUserId: "user-1",
    });

    expect(resolved.disableSchoolDeparture).toBe(true);
    expect(resolved.childrenVacation).toBe(true);
  });

  it("H — période commençant en cours de journée", () => {
    const active = getActivePeriodsForDate(
      [
        createPeriod({
          starts_at: "2026-07-13T14:00:00.000Z",
          ends_at: "2026-07-13T20:00:00.000Z",
          context_type: "solo_parent",
        }),
      ],
      "2026-07-13",
    );

    expect(active).toHaveLength(1);
  });

  it("I — détecte deux périodes qui se chevauchent", () => {
    const overlaps = findOverlappingPeriods([
      createPeriod({
        id: "a",
        starts_at: "2026-07-10T00:00:00.000Z",
        ends_at: "2026-07-20T23:59:00.000Z",
      }),
      createPeriod({
        id: "b",
        starts_at: "2026-07-15T00:00:00.000Z",
        ends_at: "2026-07-25T23:59:00.000Z",
      }),
    ]);

    expect(overlaps).toHaveLength(1);
  });

  it("K — avertissements de chevauchement avec identifiants stables uniques", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [
        createPeriod({
          id: "guadeloupe",
          title: "Guadeloupe",
          starts_at: "2026-07-10T00:00:00.000Z",
          ends_at: "2026-07-25T23:59:00.000Z",
        }),
        createPeriod({
          id: "fatigue-1",
          context_type: "other",
          title: "Journée allégée — fatigue",
          starts_at: "2026-07-20T00:00:00.000Z",
          ends_at: "2026-07-20T23:59:59.999Z",
        }),
        createPeriod({
          id: "fatigue-2",
          context_type: "other",
          title: "Journée allégée — fatigue",
          starts_at: "2026-07-20T00:00:00.000Z",
          ends_at: "2026-07-20T23:59:59.999Z",
        }),
      ],
      date: "2026-07-20",
      currentUserId: "user-1",
    });

    expect(resolved.warnings).toHaveLength(3);
    expect(new Set(resolved.warnings.map((warning) => warning.id)).size).toBe(3);
    expect(resolved.warnings.every((warning) => warning.id.includes(":"))).toBe(true);
  });

  it("J — période annulée ignorée", () => {
    const resolved = resolveFamilyContextForDate({
      periods: [
        createPeriod({
          status: "cancelled",
          context_type: "user_vacation",
        }),
      ],
      date: "2026-07-13",
      currentUserId: "user-1",
    });

    expect(resolved.userVacation).toBe(false);
    expect(resolved.disableWork).toBe(false);
  });
});
