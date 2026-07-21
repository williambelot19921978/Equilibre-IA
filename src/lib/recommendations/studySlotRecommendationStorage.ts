/**
 * P1 — Session-scoped defer/dismiss state (reversible, no server).
 */

export function buildStudyRecommendationStorageKey(
  userId: string,
  date: string,
  entryId: string,
  kind: "defer" | "dismiss",
): string {
  return `p1-study-${kind}:${userId}:${date}:${entryId}`;
}

export function isStudyRecommendationDeferred(
  userId: string,
  date: string,
  entryId: string,
): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return (
    sessionStorage.getItem(
      buildStudyRecommendationStorageKey(userId, date, entryId, "defer"),
    ) === "1"
  );
}

export function isStudyRecommendationDismissed(
  userId: string,
  date: string,
  entryId: string,
): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return (
    sessionStorage.getItem(
      buildStudyRecommendationStorageKey(userId, date, entryId, "dismiss"),
    ) === "1"
  );
}

export function deferStudyRecommendation(
  userId: string,
  date: string,
  entryId: string,
): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    buildStudyRecommendationStorageKey(userId, date, entryId, "defer"),
    "1",
  );
}

export function dismissStudyRecommendation(
  userId: string,
  date: string,
  entryId: string,
): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    buildStudyRecommendationStorageKey(userId, date, entryId, "dismiss"),
    "1",
  );
}

export function clearStudyRecommendationSessionKeys(userId: string): void {
  if (typeof sessionStorage === "undefined") return;

  const prefix = `p1-study-`;
  const keysToRemove: string[] = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(prefix) && key.includes(userId)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
}
