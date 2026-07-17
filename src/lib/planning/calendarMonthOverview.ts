import type { CalendarColorCategory } from "../../config/calendarColors";
import { overlapsLocalDay } from "../time/dayBounds";
import { formatDeviceTime } from "../time/deviceClock";
import {
  formatShortEventLabel,
  resolveCalendarItemColor,
} from "./resolveCalendarColor";
import type { CalendarItemRecord } from "../../types";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";
import type { MonthDisplayEvent } from "./monthEventLayout";

export type MonthDayPreviewItem = {
  id: string;
  title: string;
  shortLabel: string;
  timeLabel: string;
  colorCategory: CalendarColorCategory;
  startsAt: string;
  endsAt: string;
  item: CalendarItemRecord;
};

export type MonthDayVacationInfo = {
  periodId: string;
  label: string;
  contextType: string;
};

export type MonthDayData = {
  date: string;
  items: MonthDayPreviewItem[];
  vacations: MonthDayVacationInfo[];
  colorCategories: CalendarColorCategory[];
  overflowCount: number;
};

export type MonthOverviewData = Record<string, MonthDayData>;

function getVacationLabel(contextType: string): string {
  if (contextType === "user_vacation") return "Vacances";
  if (contextType === "children_vacation") return "Vacances enfants";
  return "Vacances";
}

function periodOverlapsDate(
  period: FamilyContextPeriodRecord,
  date: string,
): boolean {
  return overlapsLocalDay({
    startsAt: period.starts_at,
    endsAt: period.ends_at,
    date,
  });
}

export function buildMonthOverview({
  dates,
  items,
  periods,
  externalPreview = [],
  maxPreviewItems = 3,
}: {
  dates: string[];
  items: CalendarItemRecord[];
  periods: FamilyContextPeriodRecord[];
  externalPreview?: MonthDisplayEvent[];
  maxPreviewItems?: number;
}): MonthOverviewData {
  const overview: MonthOverviewData = {};

  for (const date of dates) {
    const dayItems = items
      .filter((item) =>
        overlapsLocalDay({
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          date,
        }),
      )
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )
      .map((item) => {
        const colorCategory = resolveCalendarItemColor(item);
        return {
          id: item.id,
          title: item.title,
          shortLabel: formatShortEventLabel(item.title),
          timeLabel: formatDeviceTime(item.starts_at),
          colorCategory,
          startsAt: item.starts_at,
          endsAt: item.ends_at,
          item,
        };
      });

    const vacations = periods
      .filter((period) => periodOverlapsDate(period, date))
      .map((period) => ({
        periodId: period.id,
        label: getVacationLabel(period.context_type),
        contextType: period.context_type,
      }));

    const externalCategories = externalPreview
      .filter((event) => event.startDate <= date && event.endDate >= date)
      .map((event) => event.colorCategory);

    const colorCategories = [
      ...new Set([
        ...vacations.map(() => "vacation" as CalendarColorCategory),
        ...dayItems.map((item) => item.colorCategory),
        ...externalCategories,
      ]),
    ];

    overview[date] = {
      date,
      items: dayItems.slice(0, maxPreviewItems),
      vacations,
      colorCategories,
      overflowCount: Math.max(0, dayItems.length - maxPreviewItems),
    };
  }

  return overview;
}
