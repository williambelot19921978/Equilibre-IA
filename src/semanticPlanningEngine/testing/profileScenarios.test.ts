import { describe, expect, it } from "vitest";

import { SemanticPlanningEngine } from "../engine/semanticPlanningEngine";
import { ALL_PROFILES } from "../testing/fixtures";
import type { ICalendarProvider } from "../../planningCalendarEngine/providers/calendarProvider";
import { PlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import { vi } from "vitest";

describe("EPIC5C profile scenarios", () => {
  for (const profile of ALL_PROFILES) {
    it(`${profile.label} — enrichissement complet`, async () => {
      const provider: ICalendarProvider = {
        id: "test",
        label: profile.label,
        fetchItems: vi.fn(async () => ({
          items: profile.items,
          syncState: "local" as const,
          available: true,
        })),
      };

      const engine = new SemanticPlanningEngine({
        planningEngine: new PlanningCalendarEngine({
          providers: [provider],
          rescheduleNonUrgentTasks: vi.fn(),
          defaultTimezone: "America/Montreal",
        }),
      });

      const snapshot = await engine.analyze({
        userId: "user-1",
        householdId: "hh-1",
        date: "2026-07-20",
        goals: profile.goals,
        childrenCount: profile.childrenCount,
        memberCount: profile.memberCount,
      });

      expect(snapshot.enabled).toBe(true);
      expect(snapshot.items.length).toBe(profile.items.length);
      expect(snapshot.dailyLoad.totalBusyMinutes).toBeGreaterThanOrEqual(0);
      expect(snapshot.balance.daily.score).toBeGreaterThanOrEqual(0);
      expect(snapshot.predictions.every((prediction) => prediction.architectureOnly)).toBe(
        true,
      );
    });
  }
});
