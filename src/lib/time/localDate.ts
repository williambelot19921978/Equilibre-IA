/** Date locale stable au format YYYY-MM-DD (fuseau appareil). */
export type LocalDateString = string;

export function parseLocalDateParts(date: LocalDateString): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function localDateToMonthKey(date: LocalDateString): string {
  const { year, month } = parseLocalDateParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
