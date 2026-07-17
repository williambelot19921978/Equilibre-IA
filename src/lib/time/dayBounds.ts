/** Bornes calendaires locales pour une date YYYY-MM-DD. */
export function getLocalDayBounds(date: string): { start: string; end: string } {
  return {
    start: new Date(`${date}T00:00:00`).toISOString(),
    end: new Date(`${date}T23:59:59.999`).toISOString(),
  };
}

/** Vérifie qu'un intervalle touche la journée ciblée (fuseau local du navigateur). */
export function overlapsLocalDay({
  startsAt,
  endsAt,
  date,
}: {
  startsAt: string;
  endsAt: string;
  date: string;
}): boolean {
  const { start, end } = getLocalDayBounds(date);
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const itemStartMs = new Date(startsAt).getTime();
  const itemEndMs = new Date(endsAt).getTime();

  return itemStartMs < endMs && itemEndMs > startMs;
}
