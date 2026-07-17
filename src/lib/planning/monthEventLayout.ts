import type { CalendarColorCategory } from "../../config/calendarColors";
import { datesInMonth } from "../navigation/urlDate";

export type MonthDisplayEventSource =
  | "vacation"
  | "calendar_item"
  | "external"
  | "work"
  | "birthday"
  | "task"
  | "family";

export type MonthDisplayEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  colorCategory: CalendarColorCategory;
  source: MonthDisplayEventSource;
  allDay?: boolean;
  startsAt?: string;
  endsAt?: string;
  filterTags: string[];
  metadata?: Record<string, unknown>;
};

export type MonthEventBarSegment = {
  eventId: string;
  title: string;
  startCol: number;
  endCol: number;
  lane: number;
  isSegmentStart: boolean;
  isSegmentEnd: boolean;
  colorCategory: CalendarColorCategory;
  source: MonthDisplayEventSource;
  event: MonthDisplayEvent;
};

export type MonthWeekLayout = {
  weekIndex: number;
  days: string[];
  bars: MonthEventBarSegment[];
  hiddenCountByDay: Record<string, number>;
};

function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

function getWeekRows(year: number, month: number): string[][] {
  const monthDays = datesInMonth(year, month);
  if (monthDays.length === 0) return [];

  const firstWeekday = new Date(`${monthDays[0]}T12:00:00`).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;

  const cells: string[] = [
    ...Array.from({ length: mondayOffset }, () => ""),
    ...monthDays,
  ];

  while (cells.length % 7 !== 0) {
    cells.push("");
  }

  const weeks: string[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function eventOverlapsWeek(
  event: MonthDisplayEvent,
  weekDays: string[],
): boolean {
  const validDays = weekDays.filter(Boolean);
  if (validDays.length === 0) return false;

  const weekStart = validDays[0];
  const weekEnd = validDays[validDays.length - 1];

  return (
    compareDates(event.endDate, weekStart) >= 0 &&
    compareDates(event.startDate, weekEnd) <= 0
  );
}

function isMultiDayEvent(event: MonthDisplayEvent): boolean {
  if (event.source === "birthday") {
    return compareDates(event.startDate, event.endDate) < 0;
  }

  return (
    compareDates(event.startDate, event.endDate) < 0 ||
    (event.allDay === true && event.source !== "calendar_item")
  );
}

export function layoutMonthEventBars({
  year,
  month,
  events,
  maxLanes = 3,
}: {
  year: number;
  month: number;
  events: MonthDisplayEvent[];
  maxLanes?: number;
}): MonthWeekLayout[] {
  const weeks = getWeekRows(year, month);

  return weeks.map((days, weekIndex) => {
    const bars: MonthEventBarSegment[] = [];
    const laneEndByIndex: number[] = [];

    const weekEvents = events
      .filter((event) => eventOverlapsWeek(event, days))
      .sort((a, b) => {
        const spanA = compareDates(a.endDate, a.startDate);
        const spanB = compareDates(b.endDate, b.startDate);
        if (spanA !== spanB) return spanB - spanA;
        return compareDates(a.startDate, b.startDate);
      });

    for (const event of weekEvents) {
      const validDayIndexes = days
        .map((day, index) => ({ day, index }))
        .filter(({ day }) => Boolean(day));

      if (validDayIndexes.length === 0) continue;

      const weekStart = validDayIndexes[0].day;
      const weekEnd = validDayIndexes[validDayIndexes.length - 1].day;

      const segmentStart = compareDates(event.startDate, weekStart) > 0
        ? event.startDate
        : weekStart;
      const segmentEnd = compareDates(event.endDate, weekEnd) < 0
        ? event.endDate
        : weekEnd;

      const startCol = days.indexOf(segmentStart);
      const endCol = days.indexOf(segmentEnd);

      if (startCol === -1 || endCol === -1) continue;

      const showAsBar = isMultiDayEvent(event) || event.source === "vacation";

      if (!showAsBar) continue;

      let lane = 0;
      while (
        lane < maxLanes &&
        (laneEndByIndex[lane] ?? -1) >= startCol
      ) {
        lane += 1;
      }

      if (lane >= maxLanes) continue;

      laneEndByIndex[lane] = endCol;

      bars.push({
        eventId: event.id,
        title: event.title,
        startCol,
        endCol,
        lane,
        isSegmentStart: segmentStart === event.startDate,
        isSegmentEnd: segmentEnd === event.endDate,
        colorCategory: event.colorCategory,
        source: event.source,
        event,
      });
    }

    return {
      weekIndex,
      days,
      bars,
      hiddenCountByDay: {},
    };
  });
}

export function getSingleDayEventsForDate({
  date,
  events,
  maxVisible = 3,
}: {
  date: string;
  events: MonthDisplayEvent[];
  maxVisible?: number;
}): {
  visible: MonthDisplayEvent[];
  hiddenCount: number;
} {
  const dayEvents = events
    .filter((event) => {
      const inRange =
        compareDates(date, event.startDate) >= 0 &&
        compareDates(date, event.endDate) <= 0;

      if (!inRange) return false;

      const isSingle =
        !isMultiDayEvent(event) ||
        event.source === "birthday" ||
        (event.source !== "vacation" &&
          compareDates(event.startDate, event.endDate) === 0 &&
          Boolean(event.startsAt) &&
          !event.allDay);

      return isSingle;
    })
    .sort((a, b) => {
      const timeA = a.startsAt ?? `${a.startDate}T12:00:00`;
      const timeB = b.startsAt ?? `${b.startDate}T12:00:00`;
      return timeA.localeCompare(timeB);
    });

  return {
    visible: dayEvents.slice(0, maxVisible),
    hiddenCount: Math.max(0, dayEvents.length - maxVisible),
  };
}
