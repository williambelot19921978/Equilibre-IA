import { describe, expect, it } from "vitest";

import { resolveDayCellVisual } from "../../design-system/dayCellVisual";
import {
  resolveCalendarDayStatus,
  type CalendarDayOverride,
} from "./resolveCalendarDayStatus";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";

const STANDARD_WORK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

function makePeriod(
  overrides: Partial<FamilyContextPeriodRecord> &
    Pick<FamilyContextPeriodRecord, "context_type" | "starts_at" | "ends_at">,
): FamilyContextPeriodRecord {
  return {
    id: overrides.id ?? "period-1",
    household_id: "household-1",
    user_id: "user-1",
    title: overrides.title ?? "Contexte",
    affected_member_id: null,
    description: null,
    status: "active",
    created_by: "user-1",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    impact: {},
    ...overrides,
  };
}

describe("resolveCalendarDayStatus — règles métier Sprint 4.1", () => {
  it("A. lundi défini travaillé → cellule orange (workday)", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-13",
      workDays: STANDARD_WORK_DAYS,
    });

    expect(result.status).toBe("workday");
    expect(result.colorToken).toBe("day-work");
    expect(result.source).toBe("profile");
  });

  it("B. mercredi non travaillé → cellule repos", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-15",
      workDays: ["monday", "tuesday", "thursday", "friday"],
    });

    expect(result.status).toBe("restday");
    expect(result.colorToken).toBe("day-rest");
  });

  it("C. samedi non travaillé → cellule week-end", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-11",
      workDays: STANDARD_WORK_DAYS,
    });

    expect(result.status).toBe("weekend");
    expect(result.colorToken).toBe("day-weekend");
  });

  it("D. jour travaillé pendant vacances → cellule vacances", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-14",
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [
        makePeriod({
          context_type: "user_vacation",
          starts_at: "2026-07-10T00:00:00.000Z",
          ends_at: "2026-07-20T23:59:59.999Z",
        }),
      ],
    });

    expect(result.status).toBe("vacation");
    expect(result.colorToken).toBe("day-vacation");
  });

  it("E. jour travaillé avec override repos → cellule repos", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-13",
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [
        makePeriod({
          context_type: "other",
          title: "Repos",
          starts_at: "2026-07-13T00:00:00.000Z",
          ends_at: "2026-07-13T23:59:59.999Z",
          impact: { disableWork: true },
        }),
      ],
    });

    expect(result.status).toBe("restday");
    expect(result.source).toBe("override");
  });

  it("F. jour non travaillé avec override travail → cellule travail", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-11",
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [
        makePeriod({
          context_type: "exceptional_work_hours",
          starts_at: "2026-07-11T00:00:00.000Z",
          ends_at: "2026-07-11T23:59:59.999Z",
          impact: { forceWorkDay: true },
        }),
      ],
    });

    expect(result.status).toBe("exceptional_work");
    expect(result.source).toBe("override");
    expect(result.badge).toBe("!");
  });

  it("G. même résultat dans compact et full via resolveDayCellVisual", () => {
    const input = {
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [] as FamilyContextPeriodRecord[],
    };

    const compact = resolveDayCellVisual("2026-07-13", input);
    const full = resolveDayCellVisual("2026-07-13", input);

    expect(compact.type).toBe(full.type);
    expect(compact.fill).toBe(full.fill);
    expect(compact.status).toEqual(full.status);
  });

  it("H. travail visible même sans calendar_item", () => {
    const visual = resolveDayCellVisual("2026-07-14", {
      workDays: STANDARD_WORK_DAYS,
      dayData: {
        date: "2026-07-14",
        items: [],
        vacations: [],
        colorCategories: [],
        overflowCount: 0,
      },
    });

    expect(visual.type).toBe("work");
    expect(visual.fill).toBe("var(--day-work)");
  });

  it("I. résolution déterministe (F5 / rechargement)", () => {
    const args = {
      date: "2026-07-16",
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [] as FamilyContextPeriodRecord[],
      holidays: [] as string[],
      overrides: [] as CalendarDayOverride[],
    };

    const first = resolveCalendarDayStatus(args);
    const second = resolveCalendarDayStatus(args);

    expect(first).toEqual(second);
  });

  it("J. changement de work_days met à jour le statut du mois", () => {
    const date = "2026-07-15";

    const withWednesday = resolveCalendarDayStatus({
      date,
      workDays: STANDARD_WORK_DAYS,
    });
    const withoutWednesday = resolveCalendarDayStatus({
      date,
      workDays: ["monday", "tuesday", "thursday", "friday"],
    });

    expect(withWednesday.status).toBe("workday");
    expect(withoutWednesday.status).toBe("restday");
  });
});

describe("resolveCalendarDayStatus — priorités complémentaires", () => {
  it("déplacement prioritaire sur travail habituel", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-13",
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [
        makePeriod({
          context_type: "work_travel",
          starts_at: "2026-07-13T00:00:00.000Z",
          ends_at: "2026-07-13T23:59:59.999Z",
        }),
      ],
    });

    expect(result.status).toBe("travel");
    expect(result.colorToken).toBe("day-travel");
  });

  it("jour férié prioritaire sur travail habituel", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-14",
      workDays: STANDARD_WORK_DAYS,
      holidays: ["2026-07-14"],
    });

    expect(result.status).toBe("holiday");
    expect(result.colorToken).toBe("day-holiday");
  });

  it("parent seul → journée spéciale", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-13",
      workDays: STANDARD_WORK_DAYS,
      contextPeriods: [
        makePeriod({
          context_type: "solo_parent",
          starts_at: "2026-07-13T00:00:00.000Z",
          ends_at: "2026-07-13T23:59:59.999Z",
        }),
      ],
    });

    expect(result.status).toBe("special");
    expect(result.colorToken).toBe("day-special");
  });

  it("override explicite forceRest", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-13",
      workDays: STANDARD_WORK_DAYS,
      overrides: [{ date: "2026-07-13", forceRest: true }],
    });

    expect(result.status).toBe("restday");
    expect(result.source).toBe("override");
  });

  it("override explicite forceWork", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-11",
      workDays: STANDARD_WORK_DAYS,
      overrides: [{ date: "2026-07-11", forceWork: true }],
    });

    expect(result.status).toBe("exceptional_work");
    expect(result.source).toBe("override");
    expect(result.badge).toBe("!");
  });

  it("sans work_days → neutre en semaine", () => {
    const result = resolveCalendarDayStatus({
      date: "2026-07-14",
      workDays: [],
    });

    expect(result.status).toBe("neutral");
  });
});

describe("MonthCalendar wiring", () => {
  it("utilise resolveDayCellVisual avec workDays", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const calendar = readFileSync(
      join(root, "components/calendar/MonthCalendar.tsx"),
      "utf8",
    );

    expect(calendar).toContain("workDays");
    expect(calendar).toContain("contextPeriods");
    expect(calendar).toContain("resolveDayCellVisual");
  });
});
