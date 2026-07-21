/**
 * EPIC 6E — Forget system — immediate respect of user choices.
 */

import type { LifeKnowledgeItem } from "../types/lifeKnowledgeTypes";
import {
  applyUserControls,
  forgetKnowledge,
  getForgottenIds,
  modifyKnowledge,
  resetKnowledge,
  restoreKnowledge,
} from "../store/knowledgeStore";

export function filterVisibleKnowledge(
  userId: string,
  items: readonly LifeKnowledgeItem[],
): LifeKnowledgeItem[] {
  return applyUserControls(userId, items).filter(
    (item) => item.status !== "forgotten" && item.status !== "rejected",
  );
}

export function forgetItem(userId: string, knowledgeId: string): void {
  forgetKnowledge(userId, knowledgeId);
}

export function editItem(
  userId: string,
  knowledgeId: string,
  patch: Partial<Pick<LifeKnowledgeItem, "label" | "value">>,
): void {
  modifyKnowledge(userId, knowledgeId, patch);
}

export function resetAllKnowledge(userId: string): void {
  resetKnowledge(userId);
}

export function isForgotten(userId: string, knowledgeId: string): boolean {
  return getForgottenIds(userId).includes(knowledgeId);
}

export function unforgetItem(userId: string, knowledgeId: string): void {
  restoreKnowledge(userId, knowledgeId);
}
