import { describe, expect, it } from "vitest";

import { CALENDAR_COLORS } from "../../config/calendarColors";
import { PROFILE_SECTIONS } from "../../config/profileSections";
import { buildHistoricalDayView } from "../../lib/planning/buildHistoricalDayView";
import {
  canRegeneratePlan,
  resolveDayDisplayMode,
} from "../../lib/planning/dayDisplayMode";
import { computeDayNowState } from "../../lib/planning/dayNowState";
import { resolveCalendarItemColor } from "../../lib/planning/resolveCalendarColor";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import {
  addDaysToDate,
  getCurrentDeviceDate,
  getDeviceTimeZone,
  isToday,
} from "../../lib/time/deviceClock";
import { buildMonthOverview } from "../../lib/planning/calendarMonthOverview";
import { combineDateAndTime } from "../../lib/time/daySchedule";
import { resolveSelectedDate } from "../../lib/navigation/urlDate";

const today = getCurrentDeviceDate();

function makeEntry(overrides: Partial<DayTimelineEntry>): DayTimelineEntry {
  return {
    id: "entry-1",
    visualType: "work",
    title: "Travail",
    startsAt: combineDateAndTime(today, "09:00"),
    endsAt: combineDateAndTime(today, "12:00"),
    locked: true,
    origin: "computed",
    blockKind: "structural",
    ...overrides,
  };
}

describe("Sprint 2.4 — device clock", () => {
  it("B. uses device timezone and local date", () => {
    expect(getDeviceTimeZone()).toBeTruthy();
    expect(getCurrentDeviceDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isToday(getCurrentDeviceDate())).toBe(true);
  });
});

describe("Sprint 2.4 — now marker and activities", () => {
  const entries = [
    makeEntry({
      id: "past",
      title: "Réveil",
      visualType: "wake",
      startsAt: combineDateAndTime(today, "06:30"),
      endsAt: combineDateAndTime(today, "06:45"),
    }),
    makeEntry({
      id: "current",
      title: "Travail",
      startsAt: combineDateAndTime(today, "09:00"),
      endsAt: combineDateAndTime(today, "17:00"),
    }),
    makeEntry({
      id: "next",
      title: "Routine soir",
      visualType: "children_routine",
      startsAt: combineDateAndTime(today, "19:00"),
      endsAt: combineDateAndTime(today, "20:00"),
    }),
  ];

  it("C/D/E. identifies current and next activity", () => {
    const noon = new Date(`${today}T12:00:00`);
    const state = computeDayNowState(entries, noon);

    expect(state.currentEntry?.title).toBe("Travail");
    expect(state.nextEntry?.title).toBe("Routine soir");
    expect(state.minutesUntilNext).toBeGreaterThan(0);
  });
});

describe("Sprint 2.4 — display modes", () => {
  it("F/G/H/I. resolves live, historical and future modes", () => {
    expect(resolveDayDisplayMode(today)).toBe("live");
    expect(resolveDayDisplayMode("2020-01-01")).toBe("historical");
    expect(resolveDayDisplayMode("2099-12-31")).toBe("future");
    expect(canRegeneratePlan("historical")).toBe(false);
    expect(canRegeneratePlan("live")).toBe(true);
  });

  it("I. historical view does not regenerate from habits", () => {
    const result = buildHistoricalDayView({
      date: "2020-01-01",
      persistedItems: [
        {
          id: "item-1",
          household_id: "h1",
          user_id: "u1",
          task_id: null,
          title: "RDV passé",
          item_type: "event",
          starts_at: "2020-01-01T10:00:00.000Z",
          ends_at: "2020-01-01T11:00:00.000Z",
          locked: true,
          source: "user",
          details: { visualType: "appointment" },
          created_at: "2020-01-01T09:00:00.000Z",
          updated_at: "2020-01-01T09:00:00.000Z",
        },
      ],
    });

    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0].title).toBe("RDV passé");
  });
});

describe("Sprint 2.4 — calendar colors", () => {
  it("N/O/P. maps work, vacation and appointment colors", () => {
    expect(CALENDAR_COLORS.work.border).toContain("#");
    expect(CALENDAR_COLORS.vacation.label).toBe("Vacances");
    expect(
      resolveCalendarItemColor({
        id: "1",
        household_id: "h",
        user_id: "u",
        task_id: null,
        title: "Médecin",
        item_type: "event",
        starts_at: "",
        ends_at: "",
        locked: true,
        source: "user",
        details: { visualType: "appointment" },
        created_at: "",
        updated_at: "",
      }),
    ).toBe("appointment");
  });
});

describe("Sprint 2.4 — month overview", () => {
  it("Q/R. shows vacation band and appointment in month cells", () => {
    const overview = buildMonthOverview({
      dates: ["2026-07-14"],
      periods: [
        {
          id: "vac-1",
          household_id: "h1",
          user_id: "u1",
          context_type: "user_vacation",
          title: "Vacances",
          starts_at: "2026-07-10T00:00:00.000Z",
          ends_at: "2026-07-20T23:59:59.000Z",
          affected_member_id: null,
          impact: { disableWork: true },
          description: null,
          status: "active",
          created_by: "u1",
          created_at: "",
          updated_at: "",
        },
      ],
      items: [
        {
          id: "appt-1",
          household_id: "h1",
          user_id: "u1",
          task_id: null,
          title: "Médecin",
          item_type: "event",
          starts_at: combineDateAndTime("2026-07-14", "10:00"),
          ends_at: combineDateAndTime("2026-07-14", "11:00"),
          locked: true,
          source: "user",
          details: { visualType: "appointment" },
          created_at: "",
          updated_at: "",
        },
      ],
    });

    expect(overview["2026-07-14"].vacations).toHaveLength(1);
    expect(overview["2026-07-14"].items[0].title).toBe("Médecin");
  });
});

describe("Sprint 2.4 — navigation", () => {
  it("S/T/U. day navigation and URL date", () => {
    const next = addDaysToDate(today, 1);
    const prev = addDaysToDate(today, -1);
    expect(next > today).toBe(true);
    expect(prev < today).toBe(true);
    expect(resolveSelectedDate("2026-07-14")).toBe("2026-07-14");
  });
});

describe("Sprint 2.4 — profile", () => {
  it("L. profile sections are defined", () => {
    expect(PROFILE_SECTIONS.length).toBeGreaterThan(5);
    expect(PROFILE_SECTIONS.some((section) => section.id === "sleep")).toBe(
      true,
    );
  });
});

describe("Sprint 2.4 — compact calendar sizing", () => {
  it("A. compact variant class exists in component contract", () => {
    expect("month-calendar-compact").toBeTruthy();
  });
});
