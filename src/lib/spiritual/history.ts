const STORAGE_PREFIX = "spiritual_history_";
const MAX_HISTORY = 20;

export function mergeHistoryIds(current: string[], contentId: string): string[] {
  return [contentId, ...current.filter((id) => id !== contentId)].slice(
    0,
    MAX_HISTORY,
  );
}

export function loadSpiritualHistory(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function appendSpiritualHistory(
  userId: string,
  contentId: string,
): string[] {
  const next = mergeHistoryIds(loadSpiritualHistory(userId), contentId);

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(next));
  } catch {
    // Ignore quota errors — history is best-effort.
  }

  return next;
}

export function clearSpiritualHistory(userId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch {
    // noop
  }
}
