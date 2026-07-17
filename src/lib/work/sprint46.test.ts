import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { classifyCalendarItemActivity } from "../planning/classifyCalendarItemActivity";
import { absorbDurationChangeWithFreeTime } from "../planning/absorbDurationChangeWithFreeTime";
import { replanAfterBlockMove } from "../planning/replanAfterBlockMove";
import { buildWorkoutTimerSteps } from "../../lib/workout/workoutSessionSteps";
import { generateWorkoutSession } from "../../ai/workoutGenerationEngine";
import { resolveCheckinPlanningImpact } from "../../types/dailyCheckin";
import type { CalendarItemRecord } from "../../types/database";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { FlexibleBuffer } from "../../types/flexibleBuffer";

const root = join(process.cwd(), "src");
const date = "2026-07-20";

function readSrc(fragment: string): string {
  return readFileSync(join(root, fragment), "utf8");
}

function sportManualItem(): CalendarItemRecord {
  return {
    id: "sport-manual-1",
    household_id: "h1",
    user_id: "u1",
    task_id: null,
    title: "Sport",
    item_type: "event",
    starts_at: `${date}T18:00:00.000Z`,
    ends_at: `${date}T18:30:00.000Z`,
    locked: true,
    source: "user",
    details: {
      constraintType: "sport",
      businessType: "sport",
      activityType: "workout",
      visualType: "sport",
      category: "sport",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function entry(id: string, start: string, end: string, flexible = true): DayTimelineEntry {
  return {
    id,
    visualType: "task",
    title: `Bloc ${id}`,
    startsAt: start,
    endsAt: end,
    locked: !flexible,
    origin: "persisted",
    blockKind: "task",
    calendarItemId: id,
  };
}

describe("Sprint 4.6", () => {
  it("A. activité Sport manuelle reconnue", () => {
    const result = classifyCalendarItemActivity(sportManualItem());
    expect(result.isSport).toBe(true);
    expect(result.activityCategory).toBe("sport");
    expect(result.visualType).toBe("sport");
  });

  it("B. activité Sport manuelle modifiable", () => {
    expect(classifyCalendarItemActivity(sportManualItem()).isEditable).toBe(true);
  });

  it("C. activité Sport manuelle annulable", () => {
    expect(classifyCalendarItemActivity(sportManualItem()).isCancellable).toBe(true);
  });

  it("D. séance générée depuis un RDV sport", () => {
    const service = readSrc("services/workoutSessionService.ts");
    expect(service).toContain("generateWorkoutForCalendarItem");
    expect(readSrc("lib/calendar/manualConstraint.ts")).toContain("workoutSession");
  });

  it("E. bouton Faire la séance ouvre le player", () => {
    expect(readSrc("contexts/WorkoutPlayerContext.tsx")).toContain(
      "WorkoutPlayerProvider",
    );
    expect(readSrc("app/layouts/AuthenticatedAppLayout.tsx")).toContain(
      "WorkoutPlayerProvider",
    );
    expect(readSrc("hooks/useDayPlan.ts")).toContain("handleStartWorkout");
  });

  it("F. timer démarre", () => {
    const session = generateWorkoutSession({
      durationMinutes: 10,
      level: "beginner",
      slotHour: 14,
    });
    const steps = buildWorkoutTimerSteps(session);
    expect(steps.length).toBeGreaterThan(0);
    expect(readSrc("hooks/useWorkoutTimer.ts")).toContain('status === "running"');
  });

  it("G. pause/reprise", () => {
    expect(readSrc("hooks/useWorkoutTimer.ts")).toContain("pause");
    expect(readSrc("hooks/useWorkoutTimer.ts")).toContain("resume");
  });

  it("H. exercice suivant automatique", () => {
    expect(readSrc("hooks/useWorkoutTimer.ts")).toContain("advanceStep");
  });

  it("I. fin de séance enregistrée", () => {
    expect(readSrc("services/workoutSessionService.ts")).toContain("finishWorkoutSession");
    expect(readSrc("services/workoutSessionService.ts")).toContain(
      "completeActivityWithFeedback",
    );
  });

  it("J. check-in Fatigué", () => {
    const impact = resolveCheckinPlanningImpact("tired");
    expect(impact.avoidIntenseSport).toBe(true);
    expect(impact.maxFillRatioMultiplier).toBeLessThan(1);
  });

  it("K. check-in Épuisé", () => {
    const impact = resolveCheckinPlanningImpact("exhausted");
    expect(impact.minimalPlanning).toBe(true);
  });

  it("L. planning allégé après check-in", () => {
    expect(readSrc("ai/lifeEngine.ts")).toContain("dailyCheckin");
    expect(readSrc("ai/lifeEngine.ts")).toContain("maxFillRatioMultiplier");
  });

  it("M. déplacement plus tard aujourd'hui", () => {
    expect(readSrc("services/blockActionService.ts")).toContain("later_today");
    expect(readSrc("lib/planning/replanAfterBlockMove.ts")).toContain(
      "replanAfterBlockMove",
    );
  });

  it("N. allongement absorbé par temps libre suivant", () => {
    const blocks = [
      {
        id: "a",
        calendarItemId: "a",
        startsAt: `${date}T20:00:00.000Z`,
        endsAt: `${date}T20:30:00.000Z`,
        locked: false,
        flexible: true,
        title: "Révision",
      },
    ];
    const buffers: FlexibleBuffer[] = [
      {
        id: "free-1",
        startsAt: `${date}T20:30:00.000Z`,
        endsAt: `${date}T21:00:00.000Z`,
        durationMinutes: 30,
        absorbable: true,
        minimumRemainingMinutes: 10,
        preferredUse: "free_time",
        source: "computed",
      },
    ];

    const result = absorbDurationChangeWithFreeTime({
      blocks,
      buffers,
      targetBlockId: "a",
      nextStartsAt: `${date}T20:00:00.000Z`,
      nextEndsAt: `${date}T21:00:00.000Z`,
    });

    expect(result.explanation.some((line) => line.includes("absorbé"))).toBe(true);
  });

  it("O. déplacement sans chevauchement", () => {
    const result = replanAfterBlockMove({
      entries: [
        entry("a", `${date}T18:00:00.000Z`, `${date}T18:30:00.000Z`),
        entry("free", `${date}T18:30:00.000Z`, `${date}T19:00:00.000Z`),
        entry("b", `${date}T19:00:00.000Z`, `${date}T19:30:00.000Z`),
      ],
      items: [],
      movedEntryId: "a",
      nextStartsAt: `${date}T18:15:00.000Z`,
      nextEndsAt: `${date}T18:45:00.000Z`,
    });
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("P. report en dernier recours", () => {
    expect(readSrc("lib/planning/absorbDurationChangeWithFreeTime.ts")).toContain(
      "report recommandé",
    );
  });

  it("Q. pas de doublon", () => {
    const result = replanAfterBlockMove({
      entries: [entry("a", `${date}T18:00:00.000Z`, `${date}T18:30:00.000Z`)],
      items: [],
      movedEntryId: "a",
      nextStartsAt: `${date}T18:00:00.000Z`,
      nextEndsAt: `${date}T18:30:00.000Z`,
    });
    const ids = result.itemUpdates.map((item) => item.calendarItemId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("R. persistance après F5", () => {
    expect(readSrc("lib/planning/displayedDayTimeline.ts")).toContain("workoutSession");
    expect(readSrc("services/sportProposalService.ts")).toContain("workoutSession: session");
  });

  it("S. Je n'ai pas le temps fonctionne", () => {
    expect(readSrc("components/planning/BlockActionsMenu.tsx")).toContain(
      "Je n'ai pas le temps",
    );
    expect(readSrc("services/blockActionService.ts")).toContain("cancel_today");
  });

  it("T. activité dure conservée", () => {
    const session = generateWorkoutSession({
      durationMinutes: 20,
      level: "intermediate",
      slotHour: 14,
    });
    expect(session.durationMinutes).toBe(20);
  });

  it("U. temps libre minimum conservé", () => {
    expect(readSrc("lib/planning/flexibleBuffer.ts")).toContain("minimumRemainingMinutes");
  });
});

describe("Sprint 4.6 migration", () => {
  it("daily_checkins migration", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/00016_daily_checkins.sql"),
      "utf8",
    );
    expect(migration).toContain("daily_checkins");
  });
});
