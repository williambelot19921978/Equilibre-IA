import type { CalendarColorCategory } from "../../config/calendarColors";
import type { CalendarItemRecord } from "../../types";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { ExternalCalendarEventRecord } from "../../types/googleCalendar";
import { isWorkDay } from "../time/daySchedule";
import { resolveCalendarItemColor } from "./resolveCalendarColor";
import type { MonthDisplayEvent } from "./monthEventLayout";

function calendarItemFilterTags(
  item: CalendarItemRecord,
  colorCategory: CalendarColorCategory,
): string[] {
  const tags = ["all", colorCategory];
  if (colorCategory === "work") tags.push("work");
  if (colorCategory === "appointment") tags.push("appointments");
  if (colorCategory === "children" || colorCategory === "family") {
    tags.push("children");
  }
  if (item.item_type === "task") tags.push("tasks");
  return tags;
}

function classifyExternalEvent(
  event: ExternalCalendarEventRecord,
): CalendarColorCategory {
  if (event.event_type === "birthday") return "birthday";
  if (event.event_type === "vacation") return "vacation";
  if (event.event_type === "work") return "work";
  if (event.event_type === "family") return "family";
  return "google";
}

function externalFilterTags(
  event: ExternalCalendarEventRecord,
): string[] {
  const tags = ["google", "all"];
  if (event.event_type === "birthday") tags.push("birthdays");
  if (event.event_type === "appointment") tags.push("appointments");
  if (event.event_type === "work") tags.push("work");
  if (event.event_type === "vacation") tags.push("vacations");
  return tags;
}

export function buildMonthDisplayEvents({
  dates,
  calendarItems = [],
  periods = [],
  externalEvents = [],
  workDays = [],
  includeWorkPreview = false,
}: {
  dates: string[];
  calendarItems?: CalendarItemRecord[];
  periods?: FamilyContextPeriodRecord[];
  externalEvents?: ExternalCalendarEventRecord[];
  workDays?: string[];
  includeWorkPreview?: boolean;
}): MonthDisplayEvent[] {
  const events: MonthDisplayEvent[] = [];

  for (const period of periods) {
    if (
      period.context_type !== "user_vacation" &&
      period.context_type !== "children_vacation"
    ) {
      continue;
    }

    events.push({
      id: `vacation-${period.id}`,
      title: period.title || "Vacances",
      startDate: period.starts_at.slice(0, 10),
      endDate: period.ends_at.slice(0, 10),
      colorCategory: "vacation",
      source: "vacation",
      allDay: true,
      filterTags: ["vacations", "all"],
      metadata: { periodId: period.id },
    });
  }

  for (const item of calendarItems) {
    const startDate = item.starts_at.slice(0, 10);
    const endDate = item.ends_at.slice(0, 10);
    const colorCategory = resolveCalendarItemColor(item);

    events.push({
      id: `item-${item.id}`,
      title: item.title,
      startDate,
      endDate,
      colorCategory,
      source: "calendar_item",
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      allDay: startDate !== endDate,
      filterTags: calendarItemFilterTags(item, colorCategory),
      metadata: { calendarItemId: item.id },
    });
  }

  for (const external of externalEvents) {
    if (external.status === "cancelled") continue;

    events.push({
      id: `external-${external.id}`,
      title: external.title,
      startDate: external.starts_at.slice(0, 10),
      endDate: external.ends_at.slice(0, 10),
      colorCategory: classifyExternalEvent(external),
      source: external.event_type === "birthday" ? "birthday" : "external",
      allDay: external.all_day,
      startsAt: external.starts_at,
      endsAt: external.ends_at,
      filterTags: externalFilterTags(external),
      metadata: {
        externalEventId: external.external_event_id,
        provider: external.provider,
        htmlLink: external.raw_metadata?.htmlLink,
      },
    });
  }

  if (includeWorkPreview) {
    for (const date of dates) {
      if (!isWorkDay(date, workDays)) continue;

      events.push({
        id: `work-preview-${date}`,
        title: "Travail",
        startDate: date,
        endDate: date,
        colorCategory: "work",
        source: "work",
        filterTags: ["work", "all"],
      });
    }
  }

  return events;
}

export function filterMonthDisplayEvents(
  events: MonthDisplayEvent[],
  activeFilter: string,
): MonthDisplayEvent[] {
  if (activeFilter === "all") return events;
  return events.filter((event) => event.filterTags.includes(activeFilter));
}

export function pickUpcomingMonthHighlights(
  events: MonthDisplayEvent[],
  fromDate: string,
): MonthDisplayEvent[] {
  return events
    .filter((event) => event.startDate >= fromDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);
}

export function eventOverlapsDate(
  event: MonthDisplayEvent,
  date: string,
): boolean {
  return (
    date >= event.startDate.slice(0, 10) &&
    date <= event.endDate.slice(0, 10)
  );
}
