import { describe, expect, it } from "vitest";

import { calculateBalanceScore } from "./calculateBalanceScore";
import { detectOverload } from "./detectOverload";
import { detectRepeatedPostponements } from "./detectRepeatedPostponements";
import { explainBalanceLevel } from "./explainBalanceScore";
import { generateProactiveInsights } from "./generateProactiveInsights";
import type { DayAnalysisInput, ScheduledDayItem } from "./types";

const DATE = "2026-07-17";

function item(
  overrides: Partial<ScheduledDayItem> & Pick<ScheduledDayItem, "id" | "title" | "startsAt" | "endsAt">,
): ScheduledDayItem {
  return {
    category: "task",
    status: "planned",
    priority: "low",
    postponementCount: 0,
    ...overrides,
  };
}

function balancedDay(): DayAnalysisInput {
  return {
    date: DATE,
    scheduledItems: [
      item({
        id: "1",
        title: "Travail",
        category: "work",
        startsAt: `${DATE}T08:00:00.000Z`,
        endsAt: `${DATE}T12:00:00.000Z`,
      }),
      item({
        id: "2",
        title: "Pause",
        category: "free",
        startsAt: `${DATE}T12:00:00.000Z`,
        endsAt: `${DATE}T13:00:00.000Z`,
      }),
      item({
        id: "3",
        title: "Sport",
        category: "sport",
        startsAt: `${DATE}T17:00:00.000Z`,
        endsAt: `${DATE}T18:00:00.000Z`,
      }),
    ],
    sleep: { plannedHours: 8 },
    personalTimeMinutes: 90,
    sportMinutes: 60,
    userPreferences: {
      preferredDailyLoadMinutes: 480,
      minimumSleepHours: 7,
      minimumPersonalTimeMinutes: 60,
    },
  };
}

describe("proactiveEngine v1", () => {
  it("1. journée équilibrée — score élevé et niveau balanced", () => {
    const result = calculateBalanceScore(balancedDay());
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("balanced");
  });

  it("2. journée surchargée — détection et score bas", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "long-1",
          title: "Bloc matin",
          startsAt: `${DATE}T06:00:00.000Z`,
          endsAt: `${DATE}T12:00:00.000Z`,
        }),
        item({
          id: "long-2",
          title: "Bloc après-midi",
          startsAt: `${DATE}T12:00:00.000Z`,
          endsAt: `${DATE}T18:00:00.000Z`,
        }),
        item({
          id: "long-3",
          title: "Bloc soir",
          startsAt: `${DATE}T18:00:00.000Z`,
          endsAt: `${DATE}T23:00:00.000Z`,
        }),
      ],
    };

    const overload = detectOverload(input);
    expect(overload.overloaded).toBe(true);
    expect(overload.reasons.some((reason) => reason.code.includes("planned_duration"))).toBe(
      true,
    );

    const score = calculateBalanceScore(input);
    expect(score.level).not.toBe("balanced");
  });

  it("3. sommeil insuffisant — insight sommeil", () => {
    const input: DayAnalysisInput = {
      ...balancedDay(),
      sleep: { plannedHours: 5.5 },
    };
    const analysis = generateProactiveInsights(input);
    expect(analysis.insights.some((insight) => insight.type === "sleep")).toBe(true);
    expect(calculateBalanceScore(input).factors.some((f) => f.code === "insufficient_sleep")).toBe(
      true,
    );
  });

  it("4. aucune donnée — état neutre", () => {
    const analysis = generateProactiveInsights({ date: DATE, scheduledItems: [] });
    expect(analysis.hasSufficientData).toBe(false);
    expect(analysis.balanceScore).toBeNull();
    expect(analysis.insights).toHaveLength(0);
  });

  it("5. tâche reportée 2 fois — insight informatif", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "t1",
          title: "Révision",
          startsAt: `${DATE}T10:00:00.000Z`,
          endsAt: `${DATE}T11:00:00.000Z`,
          postponementCount: 2,
        }),
      ],
    };
    const postponements = detectRepeatedPostponements(input);
    expect(postponements.items).toHaveLength(1);
    expect(postponements.items[0].severity).toBe("info");
  });

  it("6. tâche reportée 5 fois — insight critical", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "t2",
          title: "Admin",
          startsAt: `${DATE}T14:00:00.000Z`,
          endsAt: `${DATE}T15:00:00.000Z`,
          postponementCount: 5,
        }),
      ],
    };
    const postponements = detectRepeatedPostponements(input);
    expect(postponements.items[0].severity).toBe("critical");
    const analysis = generateProactiveInsights(input);
    expect(analysis.insights.some((insight) => insight.severity === "critical")).toBe(true);
  });

  it("7. chevauchement de rendez-vous", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "a",
          title: "Réunion",
          startsAt: `${DATE}T09:00:00.000Z`,
          endsAt: `${DATE}T10:30:00.000Z`,
        }),
        item({
          id: "b",
          title: "Appel",
          startsAt: `${DATE}T10:00:00.000Z`,
          endsAt: `${DATE}T11:00:00.000Z`,
        }),
      ],
    };
    const overload = detectOverload(input);
    expect(overload.overlapCount).toBeGreaterThan(0);
    expect(overload.reasons.some((reason) => reason.code === "schedule_overlap")).toBe(true);
  });

  it("8. journée se terminant tard", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "late",
          title: "Travail tardif",
          startsAt: `${DATE}T20:00:00.000Z`,
          endsAt: `${DATE}T23:00:00.000Z`,
        }),
      ],
    };
    const overload = detectOverload(input);
    expect(overload.reasons.some((reason) => reason.code === "late_day_end")).toBe(true);
  });

  it("9. score borné à 0 minimum", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: Array.from({ length: 12 }, (_, index) =>
        item({
          id: `heavy-${index}`,
          title: `Tâche ${index}`,
          priority: "high",
          startsAt: `${DATE}T0${Math.min(index, 9)}:00:00.000Z`,
          endsAt: `${DATE}T${Math.min(index + 2, 23)}:00:00.000Z`,
          postponementCount: 5,
        }),
      ),
      sleep: { plannedHours: 4 },
      personalTimeMinutes: 0,
      travelMinutes: 120,
    };
    const score = calculateBalanceScore(input);
    expect(score.score).toBeGreaterThanOrEqual(0);
  });

  it("10. score borné à 100 maximum", () => {
    const score = calculateBalanceScore(balancedDay());
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it("11. ordre de priorité des insights — critique avant info", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "critical-postpone",
          title: "Projet",
          startsAt: `${DATE}T20:00:00.000Z`,
          endsAt: `${DATE}T23:00:00.000Z`,
          postponementCount: 5,
        }),
      ],
      sleep: { plannedHours: 5 },
    };
    const analysis = generateProactiveInsights(input);
    expect(analysis.insights.length).toBeGreaterThan(0);
    expect(analysis.insights[0].severity).toBe("critical");
  });

  it("12. maximum de 3 insights", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "a",
          title: "A",
          startsAt: `${DATE}T08:00:00.000Z`,
          endsAt: `${DATE}T12:00:00.000Z`,
          postponementCount: 4,
        }),
        item({
          id: "b",
          title: "B",
          startsAt: `${DATE}T12:00:00.000Z`,
          endsAt: `${DATE}T16:00:00.000Z`,
          postponementCount: 3,
        }),
        item({
          id: "c",
          title: "C",
          startsAt: `${DATE}T16:00:00.000Z`,
          endsAt: `${DATE}T20:00:00.000Z`,
        }),
        item({
          id: "d",
          title: "D",
          startsAt: `${DATE}T20:00:00.000Z`,
          endsAt: `${DATE}T23:00:00.000Z`,
        }),
      ],
      sleep: { plannedHours: 5 },
      personalTimeMinutes: 0,
      sportMinutes: 0,
    };
    const analysis = generateProactiveInsights(input);
    expect(analysis.insights.length).toBeLessThanOrEqual(3);
  });

  it("13. absence de doublons d'insights", () => {
    const input: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "overlap-1",
          title: "X",
          startsAt: `${DATE}T09:00:00.000Z`,
          endsAt: `${DATE}T11:00:00.000Z`,
        }),
        item({
          id: "overlap-2",
          title: "Y",
          startsAt: `${DATE}T10:00:00.000Z`,
          endsAt: `${DATE}T12:00:00.000Z`,
        }),
      ],
      sleep: { plannedHours: 5 },
    };
    const analysis = generateProactiveInsights(input);
    const keys = analysis.insights.map((insight) => `${insight.type}:${insight.title}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("14. données partielles — analyse possible avec planning minimal", () => {
    const analysis = generateProactiveInsights({
      date: DATE,
      scheduledItems: [
        item({
          id: "only",
          title: "Unique",
          startsAt: `${DATE}T10:00:00.000Z`,
          endsAt: `${DATE}T11:00:00.000Z`,
        }),
      ],
    });
    expect(analysis.hasSufficientData).toBe(true);
    expect(analysis.balanceScore).not.toBeNull();
  });

  it("15. dates indépendantes du fuseau horaire — durées stables", () => {
    const utcInput: DayAnalysisInput = {
      date: DATE,
      scheduledItems: [
        item({
          id: "utc",
          title: "Bloc UTC",
          startsAt: `${DATE}T09:00:00.000Z`,
          endsAt: `${DATE}T10:30:00.000Z`,
        }),
      ],
    };
    const overload = detectOverload(utcInput);
    expect(overload.totalPlannedMinutes).toBe(90);
    expect(explainBalanceLevel(calculateBalanceScore(utcInput).level)).toBeTruthy();
  });
});
