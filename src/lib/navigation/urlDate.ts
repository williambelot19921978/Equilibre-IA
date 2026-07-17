import { getCurrentDeviceDate } from "../time/deviceClock";

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayDateString(): string {
  return getCurrentDeviceDate();
}

export function isValidDateParam(value: string | null | undefined): value is string {
  if (!value || !DATE_PARAM_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseUrlDate(value: string | null | undefined): string | null {
  return isValidDateParam(value) ? value : null;
}

export function resolveSelectedDate(
  value: string | null | undefined,
  fallback = getTodayDateString(),
): string {
  return parseUrlDate(value) ?? fallback;
}

export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getMonthBounds(year: number, month: number): {
  start: string;
  end: string;
} {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function datesInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
