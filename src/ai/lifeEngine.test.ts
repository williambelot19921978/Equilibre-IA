import { describe, expect, it } from "vitest";

import { buildDayConstraints } from "./planningEngine";
import type { PlanningContext } from "./memoryEngine";
import {
  determineDayType,
  generateLifeProposals,
  getEffectiveWorkHours,
  resolveLifeContext,
  scoreFreeSlot,
} from "./lifeEngine";
import { generateFreeTimeSuggestions } from "./freeTimeSuggestionEngine";
import { buildSpiritualInputFromLifeContext } from "./spiritualSuggestionEngine";
import { buildDisplayDayView } from "../lib/planning/buildDisplayDayView";
import { splitLargeFreeGaps } from "../lib/planning/splitFreeSlots";
import { formatFreeSlotTitle } from "../lib/planning/splitFreeSlots";
import type { ResolvedFamilyContext } from "../types/familyContext";
import type { FamilyContextPeriodRecord } from "../types/familyContext";
import { buildSpiritualPreferences } from "../lib/spiritual/preferences";

function createPeriod(
  overrides: Partial<FamilyContextPeriodRecord> = {},
): FamilyContextPeriodRecord {
  return {
    id: "period-1",
    household_id: "household-1",
    user_id: "user-1",
    context_type: "work_travel",
    title: "Déplacement",
    starts_at: "2026-07-10T00:00:00.000Z",
    ends_at: "2026-07-20T23:59:00.000Z",
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

function makeFamilyContext(
  overrides: Partial<ResolvedFamilyContext> = {},
): ResolvedFamilyContext {
  return {
    activePeriods: [],
    disableWork: false,
    disableSchoolDeparture: false,
    maxFillRatio: 0.8,
    soloParentWithChildren: false,
    childSick: false,
    onlyMicroTasks: false,
    childrenVacation: false,
    userVacation: false,
    unavailableUserIds: [],
    adaptations: [],
    warnings: [],
    ...overrides,
  };
}

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [],
  childrenCount: 0,
  wakeTime: "07:00",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "18:00",
  mainPriority: "studies",
  onboardingCompleted: true,
  profile: {
    morningDurationMinutes: 60,
    childrenDepartureTime: "08:00",
    eveningRoutine: [],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 30,
    afterWorkEnergy: "low",
    studiesActive: true,
    studyWeeklyHours: 6,
    studyBestPeriod: "morning",
    procrastinationCauses: [],
    preferredFocusMinutes: 25,
    sleepNeededHours: 8,
    sleepProblems: [],
    sportInterests: [],
    sportMinimumMinutes: 15,
    sportMusic: [],
    restPreferences: [],
    faithImportance: "important",
    faithContent: ["verse", "prayer"],
  },
  childRoutines: [],
  householdEvening: {
    eveningRoutineStart: "19:00",
    eveningRoutineManager: "both",
    averageEveningRoutineMinutes: 90,
  },
  familyContext: makeFamilyContext(),
  familyContextPeriods: [],
  targetDate: "2026-07-13",
  currentUserId: "user-1",
};

describe("Sprint 3.0 — Life Engine", () => {
  it("A. WORKDAY on Monday with profile work days", () => {
    const result = determineDayType({
      date: "2026-07-13",
      context: baseContext,
    });
    expect(result.dayType).toBe("WORKDAY");
    expect(result.reason).toContain("travaillé");
  });

  it("B. RESTDAY when work disabled for the day", () => {
    const result = determineDayType({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({ disableWork: true }),
      },
    });
    expect(result.dayType).toBe("RESTDAY");
  });

  it("C. VACATION when user vacation active", () => {
    const result = determineDayType({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({ userVacation: true, disableWork: true }),
      },
    });
    expect(result.dayType).toBe("VACATION");
  });

  it("D. TRAVEL when work_travel period active", () => {
    const result = determineDayType({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({
          activePeriods: [createPeriod()],
        }),
      },
    });
    expect(result.dayType).toBe("TRAVEL");
  });

  it("E. PARENT_ALONE when solo parent with children", () => {
    const result = determineDayType({
      date: "2026-07-13",
      context: {
        ...baseContext,
        childrenCount: 2,
        familyContext: makeFamilyContext({ soloParentWithChildren: true }),
      },
    });
    expect(result.dayType).toBe("PARENT_ALONE");
  });

  it("F. WEEKEND on Saturday", () => {
    const result = determineDayType({
      date: "2026-07-11",
      context: baseContext,
    });
    expect(result.dayType).toBe("WEEKEND");
  });

  it("G. work blocks as hard constraints on workday", () => {
    const life = resolveLifeContext({
      date: "2026-07-13",
      context: baseContext,
    });

    const { displayConstraints } = buildDayConstraints({
      date: "2026-07-13",
      context: { ...baseContext, lifeContext: life },
      existingItems: [],
    });

    expect(displayConstraints.some((item) => item.title === "Travail")).toBe(true);
    expect(
      displayConstraints.some((item) => item.title === "Trajet aller travail"),
    ).toBe(true);
    expect(
      displayConstraints.some((item) => item.title === "Trajet retour travail"),
    ).toBe(true);
  });

  it("H. rest block instead of work on rest day", () => {
    const life = resolveLifeContext({
      date: "2026-07-11",
      context: baseContext,
    });

    const { displayConstraints } = buildDayConstraints({
      date: "2026-07-11",
      context: { ...baseContext, lifeContext: life },
      existingItems: [],
    });

    expect(displayConstraints.some((item) => item.title === "Repos")).toBe(true);
    expect(displayConstraints.some((item) => item.title === "Travail")).toBe(false);
  });

  it("I. no work on vacation", () => {
    const context = {
      ...baseContext,
      familyContext: makeFamilyContext({ userVacation: true, disableWork: true }),
    };
    const life = resolveLifeContext({ date: "2026-07-13", context });

    expect(life.vacation).toBe(true);
    expect(life.workDay).toBe(false);

    const { displayConstraints } = buildDayConstraints({
      date: "2026-07-13",
      context: { ...context, lifeContext: life },
      existingItems: [],
    });

    expect(displayConstraints.some((item) => item.title === "Travail")).toBe(false);
    expect(displayConstraints.some((item) => item.title === "Vacances")).toBe(true);
  });

  it("J. travel lowers energy and limits sport", () => {
    const context = {
      ...baseContext,
      familyContext: makeFamilyContext({
        activePeriods: [createPeriod()],
      }),
    };
    const life = resolveLifeContext({ date: "2026-07-13", context });

    expect(life.travelDay).toBe(true);
    expect(life.energyPrediction).toBe("low");
    expect(life.sportPossible).toBe(false);
    expect(
      life.proposals.some((proposal) => proposal.title === "Récupération trajet"),
    ).toBe(true);
  });

  it("K. parent alone limits load via maxFillRatio reasoning", () => {
    const context = {
      ...baseContext,
      childrenCount: 2,
      familyContext: makeFamilyContext({
        soloParentWithChildren: true,
        maxFillRatio: 0.5,
      }),
    };
    const life = resolveLifeContext({ date: "2026-07-13", context });

    expect(life.dayType).toBe("PARENT_ALONE");
    expect(life.reasoning.some((line) => line.includes("50"))).toBe(true);
  });

  it("L. splits large free gaps instead of one 8h block", () => {
    const gaps = splitLargeFreeGaps({
      occupied: [
        {
          startsAt: "2026-07-13T07:00:00.000Z",
          endsAt: "2026-07-13T08:00:00.000Z",
        },
        {
          startsAt: "2026-07-13T19:00:00.000Z",
          endsAt: "2026-07-13T20:00:00.000Z",
        },
      ],
      dayStart: "2026-07-13T06:00:00.000Z",
      dayEnd: "2026-07-13T21:00:00.000Z",
      maxChunkMinutes: 120,
    });

    const longGap = gaps.find(
      (gap) =>
        (new Date(gap.endsAt).getTime() - new Date(gap.startsAt).getTime()) /
          60_000 >
        120,
    );
    expect(longGap).toBeUndefined();
    expect(gaps.length).toBeGreaterThan(1);
  });

  it("M. free slot title uses duration label", () => {
    const title = formatFreeSlotTitle(
      "2026-07-13T10:00:00.000Z",
      "2026-07-13T11:30:00.000Z",
    );
    expect(title).toMatch(/^Temps libre — /);
    expect(title).toContain("min");
  });

  it("N. proposals include explicit reasoning for workday sport", () => {
    const life = resolveLifeContext({
      date: "2026-07-13",
      context: {
        ...baseContext,
        mainPriority: "sport",
      },
    });

    const sportProposal = life.proposals.find(
      (proposal) => proposal.category === "sport",
    );
    expect(sportProposal).toBeDefined();
    expect(sportProposal?.reason).toMatch(/Créneau|énergie|sport/i);
  });

  it("O. evening slot scores higher", () => {
    const evening = scoreFreeSlot({
      slot: {
        id: "evening",
        startsAt: "2026-07-13T20:00:00.000Z",
        endsAt: "2026-07-13T21:00:00.000Z",
        durationMinutes: 60,
        slotKind: "evening_available",
      },
      lifeContext: {
        dayType: "WORKDAY",
        energyPrediction: "medium",
        workDay: true,
        vacation: false,
      },
    });

    const morning = scoreFreeSlot({
      slot: {
        id: "morning",
        startsAt: "2026-07-13T08:00:00.000Z",
        endsAt: "2026-07-13T09:00:00.000Z",
        durationMinutes: 60,
        slotKind: "day",
      },
      lifeContext: {
        dayType: "WORKDAY",
        energyPrediction: "medium",
        workDay: true,
        vacation: false,
      },
    });

    expect(evening.score).toBeGreaterThan(morning.score);
  });

  it("P. free time suggestions delegate to LifeContext", () => {
    const life = resolveLifeContext({
      date: "2026-07-13",
      context: baseContext,
    });

    const slot = life.freeSlots[0];
    expect(slot).toBeDefined();

    const suggestions = generateFreeTimeSuggestions({
      slot: slot!,
      date: "2026-07-13",
      planningContext: { ...baseContext, lifeContext: life },
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.type).toBeDefined();
    expect(suggestions.some((item) => item.reason.length > 0)).toBe(true);
  });

  it("Q. spiritual engine uses LifeContext for vacation and alone", () => {
    const life = resolveLifeContext({
      date: "2026-08-01",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({ userVacation: true, disableWork: true }),
      },
    });

    const prefs = buildSpiritualPreferences(baseContext.profile);
    const input = buildSpiritualInputFromLifeContext(life, prefs);

    expect(input.isVacation).toBe(true);
    expect(input.fatigueLevel).toBeDefined();
  });

  it("R. default work hours when profile incomplete", () => {
    const context = {
      ...baseContext,
      workStart: undefined,
      workEnd: undefined,
    };
    const hours = getEffectiveWorkHours(context);
    expect(hours.estimated).toBe(true);
    expect(hours.workStart).toBe("09:00");
    expect(hours.workEnd).toBe("17:00");
  });

  it("S. buildDisplayDayView returns lifeContext", () => {
    const { lifeContext, timeline } = buildDisplayDayView({
      date: "2026-07-13",
      context: baseContext,
      tasks: [],
      persistedItems: [],
    });

    expect(lifeContext.dayType).toBe("WORKDAY");
    expect(lifeContext.proposals.length).toBeGreaterThan(0);
    expect(timeline.some((entry) => entry.title === "Travail")).toBe(true);
  });

  it("T. spiritual proposal on rest day with faith enabled", () => {
    const proposals = generateLifeProposals({
      lifeContext: {
        date: "2026-07-11",
        dayType: "RESTDAY",
        dayTypeReason: "Week-end",
        workDay: false,
        vacation: false,
        restDay: true,
        travelDay: false,
        familySituation: "normal",
        availableMinutes: 120,
        lockedMinutes: 400,
        energyPrediction: "medium",
        childrenPresent: false,
        partnerPresent: true,
        sportPossible: false,
        studyPossible: false,
        freeEvening: false,
        workoutCompletedToday: true,
        workoutMinutesCompletedToday: 30,
        workoutTypeCompletedToday: "run",
        priority: null,
        reasoning: [],
        freeSlots: [
          {
            id: "slot-evening",
            startsAt: "2026-07-11T20:00:00.000Z",
            endsAt: "2026-07-11T21:00:00.000Z",
            durationMinutes: 60,
            slotKind: "evening_available",
            score: 90,
            scoreReason: "Soirée disponible",
          },
        ],
        proposals: [],
        maxFillRatio: 0.8,
      },
      context: baseContext,
      activityCompletion: {
        workoutDone: true,
        studyDone: true,
        spiritualDone: false,
        familyTimeDone: true,
        coupleTimeDone: true,
        restDone: true,
        priorityTaskDone: true,
      },
    });

    expect(
      proposals.some((proposal) => proposal.category === "spiritual"),
    ).toBe(true);
  });
});
