import type { CalendarItemRecord } from "../../types";

/** Ignore une réponse async si une requête plus récente a déjà démarré. */
export function shouldApplyRequest(
  requestId: number,
  latestRequestId: number,
): boolean {
  return requestId === latestRequestId;
}

/** Fusionne les éléments par id en conservant les entrées existantes pendant un refresh. */
export function mergeCalendarItemsById(
  existing: CalendarItemRecord[],
  incoming: CalendarItemRecord[],
): CalendarItemRecord[] {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
}

export function buildDayLoadKey(
  userId: string,
  householdId: string,
  date: string,
): string {
  return `${userId}:${householdId}:day:${date}`;
}

export function buildMonthLoadKey(
  userId: string,
  householdId: string,
  year: number,
  month: number,
  periodsRevision: number,
): string {
  return `${userId}:${householdId}:month:${year}-${month}:p${periodsRevision}`;
}
