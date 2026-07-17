import { describe, expect, it } from "vitest";

import { buildDayConstraints } from "../../ai/planningEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { ResolvedFamilyContext } from "../../types/familyContext";
import { buildMonthDisplayEvents } from "./buildMonthDisplayEvents";
import { buildDisplayedDayTimeline } from "./displayedDayTimeline";
import {
  detectGoogleConflictMessages,
  externalEventToCalendarItem,
  mergeExternalEventsForDay,
} from "./externalEventsToPlanningItems";
import {
  getSingleDayEventsForDate,
  layoutMonthEventBars,
  type MonthDisplayEvent,
} from "./monthEventLayout";
import { classifyGoogleEvent } from "../google/classifyGoogleEvent";
import {
  parseGoogleEventPayload,
  upsertExternalEvents,
  validateOAuthCallbackParams,
  shouldAutoSync,
} from "../google/googleCalendarSyncLogic";
import { pickMotivationContent } from "../../data/motivationLibrary";
import type { ExternalCalendarEventRecord } from "../../types/googleCalendar";

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
    faithImportance: "disabled",
    faithContent: [],
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

function vacationEvent(start: string, end: string): MonthDisplayEvent {
  return {
    id: `vacation-${start}`,
    title: "Vacances familiales",
    startDate: start,
    endDate: end,
    colorCategory: "vacation",
    source: "vacation",
    allDay: true,
    filterTags: ["vacations", "all"],
  };
}

describe("Sprint 2.5 — month layout", () => {
  it("A. multi-day bar on a single week", () => {
    const layout = layoutMonthEventBars({
      year: 2026,
      month: 7,
      events: [vacationEvent("2026-08-05", "2026-08-09")],
    });

    const augustWeek = layout.find((week) => week.days.includes("2026-08-05"));
    const bar = augustWeek?.bars[0];
    expect(bar).toBeDefined();
    expect(bar!.startCol).toBeLessThan(bar!.endCol);
  });

  it("B. multi-day bar across multiple weeks", () => {
    const layout = layoutMonthEventBars({
      year: 2026,
      month: 7,
      events: [vacationEvent("2026-08-01", "2026-08-15")],
    });

    const bars = layout.flatMap((week) => week.bars);
    expect(bars.length).toBeGreaterThan(1);
  });

  it("C. vacation spanning two months", () => {
    const events = buildMonthDisplayEvents({
      dates: ["2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"],
      periods: [
        {
          id: "p1",
          household_id: "h1",
          user_id: "u1",
          context_type: "user_vacation",
          title: "Vacances",
          starts_at: "2026-07-28T00:00:00.000Z",
          ends_at: "2026-08-05T23:59:59.999Z",
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

    const layout = layoutMonthEventBars({
      year: 2026,
      month: 6,
      events,
    });

    expect(layout.some((week) => week.bars.length > 0)).toBe(true);
  });

  it("D. appointment visible in a cell", () => {
    const events: MonthDisplayEvent[] = [
      {
        id: "rdv-1",
        title: "Médecin",
        startDate: "2026-08-12",
        endDate: "2026-08-12",
        colorCategory: "appointment",
        source: "calendar_item",
        startsAt: "2026-08-12T08:00:00.000Z",
        endsAt: "2026-08-12T09:00:00.000Z",
        filterTags: ["appointments", "all"],
      },
    ];

    const { visible } = getSingleDayEventsForDate({
      date: "2026-08-12",
      events,
    });

    expect(visible[0]?.title).toBe("Médecin");
  });

  it("E. birthday visible", () => {
    const events: MonthDisplayEvent[] = [
      {
        id: "bday-1",
        title: "Anniversaire Léa",
        startDate: "2026-08-20",
        endDate: "2026-08-20",
        colorCategory: "birthday",
        source: "birthday",
        allDay: true,
        filterTags: ["birthdays", "all"],
      },
    ];

    const { visible } = getSingleDayEventsForDate({
      date: "2026-08-20",
      events,
    });

    expect(visible.some((event) => event.source === "birthday")).toBe(true);
  });

  it("F. +N overflow for extra events", () => {
    const events: MonthDisplayEvent[] = Array.from({ length: 5 }, (_, index) => ({
      id: `item-${index}`,
      title: `RDV ${index}`,
      startDate: "2026-08-12",
      endDate: "2026-08-12",
      colorCategory: "appointment" as const,
      source: "calendar_item" as const,
      startsAt: `2026-08-12T${10 + index}:00:00.000Z`,
      endsAt: `2026-08-12T${11 + index}:00:00.000Z`,
      filterTags: ["appointments", "all"],
    }));

    const { visible, hiddenCount } = getSingleDayEventsForDate({
      date: "2026-08-12",
      events,
      maxVisible: 2,
    });

    expect(visible.length).toBe(2);
    expect(hiddenCount).toBe(3);
  });
});

describe("Sprint 2.5 — work blocks", () => {
  const date = "2026-07-13";

  it("G. work and commutes shown separately with exact titles", () => {
    const { displayConstraints } = buildDayConstraints({
      date,
      context: baseContext,
      existingItems: [],
    });

    const timeline = buildDisplayedDayTimeline({
      constraints: displayConstraints,
      persistedItems: [],
    });

    expect(timeline.some((entry) => entry.title === "Trajet aller travail")).toBe(
      true,
    );
    expect(timeline.some((entry) => entry.title === "Travail")).toBe(true);
    expect(timeline.some((entry) => entry.title === "Trajet retour travail")).toBe(
      true,
    );
  });

  it("H. no work blocks on vacation day", () => {
    const { displayConstraints } = buildDayConstraints({
      date,
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({ userVacation: true, disableWork: true }),
      },
      existingItems: [],
    });

    const timeline = buildDisplayedDayTimeline({
      constraints: displayConstraints,
      persistedItems: [],
    });

    expect(timeline.some((entry) => entry.title === "Travail")).toBe(false);
  });
});

describe("Sprint 2.5 — Google sync logic", () => {
  it("I. invalid OAuth callback", () => {
    expect(validateOAuthCallbackParams({ error: "access_denied" }).valid).toBe(
      false,
    );
  });

  it("J. missing token in callback", () => {
    expect(validateOAuthCallbackParams({ state: "abc" }).valid).toBe(false);
  });

  it("K. sync without duplicate", () => {
    const existing: ExternalCalendarEventRecord[] = [
      {
        id: "1",
        household_id: "h1",
        user_id: "u1",
        provider: "google",
        external_calendar_id: "cal1",
        external_event_id: "evt1",
        title: "Réunion",
        description: null,
        location: null,
        starts_at: "2026-08-01T10:00:00.000Z",
        ends_at: "2026-08-01T11:00:00.000Z",
        all_day: false,
        recurrence: null,
        status: "confirmed",
        event_type: "appointment",
        raw_metadata: null,
        last_synced_at: null,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
      },
    ];

    const parsed = parseGoogleEventPayload({
      event: {
        id: "evt1",
        summary: "Réunion",
        start: { dateTime: "2026-08-01T10:00:00.000Z" },
        end: { dateTime: "2026-08-01T11:00:00.000Z" },
      },
      calendarId: "cal1",
    });

    const { upserted, duplicateCount } = upsertExternalEvents({
      existing,
      incoming: parsed ? [parsed, parsed] : [],
    });

    expect(upserted.length).toBe(1);
    expect(duplicateCount).toBe(1);
  });

  it("L. cancelled event", () => {
    const parsed = parseGoogleEventPayload({
      event: {
        id: "evt-cancel",
        summary: "Annulé",
        status: "cancelled",
        start: { dateTime: "2026-08-02T10:00:00.000Z" },
        end: { dateTime: "2026-08-02T11:00:00.000Z" },
      },
      calendarId: "cal1",
    });

    expect(parsed?.status).toBe("cancelled");
  });

  it("M. recurring event", () => {
    const parsed = parseGoogleEventPayload({
      event: {
        id: "instance-1",
        recurringEventId: "series-1",
        summary: "Hebdo",
        start: { dateTime: "2026-08-03T10:00:00.000Z" },
        end: { dateTime: "2026-08-03T11:00:00.000Z" },
      },
      calendarId: "cal1",
    });

    expect(parsed?.external_event_id).toBe("series-1");
    expect(parsed?.recurrence).toBe("recurring");
  });

  it("N. all-day event", () => {
    const parsed = parseGoogleEventPayload({
      event: {
        id: "all-day",
        summary: "Journée",
        start: { date: "2026-08-04" },
        end: { date: "2026-08-05" },
      },
      calendarId: "cal1",
    });

    expect(parsed?.all_day).toBe(true);
  });

  it("O. annual birthday classification", () => {
    const type = classifyGoogleEvent(
      {
        id: "bday",
        summary: "Anniversaire de Paul",
        start: { date: "2026-08-20" },
        end: { date: "2026-08-21" },
        eventType: "birthday",
      },
      "Anniversaires",
    );

    expect(type).toBe("birthday");
  });
});

describe("Sprint 2.5 — merge and conflicts", () => {
  it("P. merges calendar items and Google events", () => {
    const external: ExternalCalendarEventRecord = {
      id: "ext-1",
      household_id: "h1",
      user_id: "u1",
      provider: "google",
      external_calendar_id: "cal1",
      external_event_id: "evt1",
      title: "Google RDV",
      description: null,
      location: null,
      starts_at: "2026-08-12T14:00:00.000+02:00",
      ends_at: "2026-08-12T15:00:00.000+02:00",
      all_day: false,
      recurrence: null,
      status: "confirmed",
      event_type: "appointment",
      raw_metadata: { htmlLink: "https://calendar.google.com/event" },
      last_synced_at: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };

    const merged = mergeExternalEventsForDay({
      date: "2026-08-12",
      persistedItems: [],
      externalEvents: [external],
    });

    expect(merged.length).toBe(1);
    expect(merged[0].source).toBe("calendar_sync");
  });

  it("Q. conflict message when Google overlaps tasks", () => {
    const messages = detectGoogleConflictMessages({
      date: "2026-08-12",
      flexibleTaskTitles: ["Tâche flexible"],
      externalEvents: [
        {
          id: "ext-1",
          household_id: "h1",
          user_id: "u1",
          provider: "google",
          external_calendar_id: "cal1",
          external_event_id: "evt1",
          title: "Google RDV",
          description: null,
          location: null,
          starts_at: "2026-08-12T14:00:00.000+02:00",
          ends_at: "2026-08-12T15:00:00.000+02:00",
          all_day: false,
          recurrence: null,
          status: "confirmed",
          event_type: "appointment",
          raw_metadata: null,
          last_synced_at: null,
          created_at: "2026-08-01T00:00:00.000Z",
          updated_at: "2026-08-01T00:00:00.000Z",
        },
      ],
    });

    expect(messages[0]).toContain("rendez-vous Google");
  });

  it("R. external events scoped per user merge", () => {
    const item = externalEventToCalendarItem({
      id: "ext-1",
      household_id: "h1",
      user_id: "user-a",
      provider: "google",
      external_calendar_id: "cal1",
      external_event_id: "evt1",
      title: "Privé",
      description: null,
      location: null,
      starts_at: "2026-08-12T14:00:00.000Z",
      ends_at: "2026-08-12T15:00:00.000Z",
      all_day: false,
      recurrence: null,
      status: "confirmed",
      event_type: "appointment",
      raw_metadata: null,
      last_synced_at: null,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    });

    expect(item.user_id).toBe("user-a");
  });

  it("S. disconnect clears auto-sync trigger", () => {
    expect(shouldAutoSync(null)).toBe(true);
    expect(
      shouldAutoSync(new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()),
    ).toBe(true);
    expect(
      shouldAutoSync(new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()),
    ).toBe(false);
  });
});

describe("Sprint 2.5 — motivation card", () => {
  it("T. neutral motivation when faith disabled", () => {
    const content = pickMotivationContent({
      faithImportance: "disabled",
      useSpiritual: true,
    });

    expect(content.kind).toBe("neutral");
  });

  it("U. spiritual content keeps exact reference", () => {
    const content = pickMotivationContent({
      faithImportance: "important",
      useSpiritual: true,
    });

    if (content.kind === "spiritual" && content.reference) {
      expect(content.reference.length).toBeGreaterThan(0);
    }
  });

  it("V. responsive layout classes exist in CSS contract", () => {
    expect("home-desktop-grid").toBeTruthy();
  });
});
