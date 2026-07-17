/** Début de semaine locale (lundi) pour une date YYYY-MM-DD. */
export function getLocalWeekStartDate(referenceDate: string): string {
  const date = new Date(`${referenceDate}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

/** Bornes ISO de la semaine locale (lundi 00:00 → dimanche 23:59:59). */
export function getLocalWeekBounds(referenceDate: string): {
  weekStart: string;
  start: string;
  end: string;
} {
  const weekStart = getLocalWeekStartDate(referenceDate);
  const endDate = new Date(`${weekStart}T12:00:00`);
  endDate.setDate(endDate.getDate() + 6);

  return {
    weekStart,
    start: new Date(`${weekStart}T00:00:00`).toISOString(),
    end: new Date(`${endDate.toISOString().slice(0, 10)}T23:59:59.999`).toISOString(),
  };
}
