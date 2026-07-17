import { getLocalWeekBounds } from "./weekBounds";

export type StatisticsPeriod = "week" | "month" | "year";

export type PeriodBounds = {
  period: StatisticsPeriod;
  start: string;
  end: string;
  label: string;
  previousStart: string;
  previousEnd: string;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoStart(date: string): string {
  return `${date}T00:00:00.000`;
}

function toIsoEnd(date: string): string {
  return `${date}T23:59:59.999`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getPeriodBounds(
  referenceDate: string,
  period: StatisticsPeriod,
): PeriodBounds {
  const [yearText, monthText] = referenceDate.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);

  if (period === "week") {
    const current = getLocalWeekBounds(referenceDate);
    const previousRef = new Date(`${referenceDate}T12:00:00`);
    previousRef.setDate(previousRef.getDate() - 7);
    const previous = getLocalWeekBounds(previousRef.toISOString().slice(0, 10));
    return {
      period,
      start: current.start,
      end: current.end,
      label: `Semaine du ${current.weekStart}`,
      previousStart: previous.start,
      previousEnd: previous.end,
    };
  }

  if (period === "month") {
    const monthStart = `${year}-${pad(month)}-01`;
    const monthEnd = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousStart = `${previousYear}-${pad(previousMonth)}-01`;
    const previousEnd = `${previousYear}-${pad(previousMonth)}-${pad(daysInMonth(previousYear, previousMonth))}`;

    return {
      period,
      start: toIsoStart(monthStart),
      end: toIsoEnd(monthEnd),
      label: `${pad(month)}/${year}`,
      previousStart: toIsoStart(previousStart),
      previousEnd: toIsoEnd(previousEnd),
    };
  }

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const previousYear = year - 1;

  return {
    period,
    start: toIsoStart(yearStart),
    end: toIsoEnd(yearEnd),
    label: String(year),
    previousStart: toIsoStart(`${previousYear}-01-01`),
    previousEnd: toIsoEnd(`${previousYear}-12-31`),
  };
}
