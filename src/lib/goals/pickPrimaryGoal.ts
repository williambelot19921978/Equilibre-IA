/**
 * EPIC2 — Pick the most relevant user goal (importance, recency).
 */

import type { UserGoal } from "../../types/goal";

const IMPORTANCE_RANK = { high: 3, medium: 2, low: 1 } as const;

export function pickPrimaryGoal(goals: readonly UserGoal[]): UserGoal | null {
  if (goals.length === 0) return null;

  return [...goals].sort((a, b) => {
    const rankDiff =
      IMPORTANCE_RANK[b.importance] - IMPORTANCE_RANK[a.importance];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  })[0];
}
