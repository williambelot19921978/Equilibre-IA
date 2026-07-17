import { describe, expect, it } from "vitest";

import { resolveDayCellVisual } from "../../design-system/dayCellVisual";
import { extractWorkDaysFromFacts } from "../profile/extractWorkDays";
import { resolveCalendarDayStatus } from "../calendar/resolveCalendarDayStatus";
import type { ProfileFactRecord } from "../../types";

/** Exemple utilisateur Sprint 4.1 : lun/mar/jeu/ven travail, mer repos */
const USER_WORK_DAYS = ["monday", "tuesday", "thursday", "friday"];

function fact(key: string, value: unknown): ProfileFactRecord {
  return {
    fact_key: key,
    fact_value: { value: value as string | number | string[] | null },
  };
}

describe("extractWorkDaysFromFacts", () => {
  it("lit work_days depuis profile_facts", () => {
    expect(
      extractWorkDaysFromFacts([
        fact("work_days", ["monday", "tuesday", "thursday", "friday"]),
      ]),
    ).toEqual(USER_WORK_DAYS);
  });

  it("retourne [] si absent", () => {
    expect(extractWorkDaysFromFacts([])).toEqual([]);
  });
});

describe("rythme profil — exemple Mon Profil (régression Sprint 4.1)", () => {
  /** Semaine du 13 juillet 2026 : lun 13 → ven 17 */
  const week = [
    { date: "2026-07-13", weekday: "lundi", expected: "work" },
    { date: "2026-07-14", weekday: "mardi", expected: "work" },
    { date: "2026-07-15", weekday: "mercredi", expected: "rest" },
    { date: "2026-07-16", weekday: "jeudi", expected: "work" },
    { date: "2026-07-17", weekday: "vendredi", expected: "work" },
  ] as const;

  week.forEach(({ date, weekday, expected }) => {
    it(`${weekday} ${date} → ${expected}`, () => {
      const visual = resolveDayCellVisual(date, { workDays: USER_WORK_DAYS });
      expect(visual.type).toBe(expected);
      expect(visual.fill).toBe(
        expected === "work" ? "var(--day-work)" : "var(--day-rest)",
      );
    });
  });

  it("vacances écrase un lundi travaillé", () => {
    const visual = resolveDayCellVisual("2026-07-13", {
      workDays: USER_WORK_DAYS,
      contextPeriods: [
        {
          id: "vac-1",
          household_id: "h1",
          user_id: "u1",
          context_type: "user_vacation",
          title: "Vacances",
          starts_at: "2026-07-10T00:00:00.000Z",
          ends_at: "2026-07-20T23:59:59.999Z",
          affected_member_id: null,
          impact: {},
          description: null,
          status: "active",
          created_by: "u1",
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
    expect(visual.type).toBe("vacation");
  });

  it("compact et full produisent le même statut", () => {
    const input = { workDays: USER_WORK_DAYS, contextPeriods: [] as const };
    const monday = "2026-07-13";
    expect(resolveDayCellVisual(monday, input)).toEqual(
      resolveDayCellVisual(monday, input),
    );
  });

  it("fonctionne sans calendar_item ni planning généré", () => {
    const status = resolveCalendarDayStatus({
      date: "2026-07-13",
      workDays: USER_WORK_DAYS,
    });
    expect(status.status).toBe("workday");
    expect(status.source).toBe("profile");
  });
});
