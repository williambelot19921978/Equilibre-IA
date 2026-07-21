/**
 * EPIC 6E — Guards — confirmed or high-confidence only for downstream engines.
 */

import type { LifeKnowledgeItem } from "../types/lifeKnowledgeTypes";
import { COACH_KNOWLEDGE_THRESHOLD } from "../types/lifeKnowledgeTypes";

export function isConfirmedKnowledge(item: LifeKnowledgeItem): boolean {
  return item.status === "confirmed" || item.source === "user_confirmed" || item.source === "settings";
}

export function isUsableForCoach(item: LifeKnowledgeItem): boolean {
  return isConfirmedKnowledge(item) || item.confidence >= COACH_KNOWLEDGE_THRESHOLD;
}

export function isUsableForConversation(item: LifeKnowledgeItem): boolean {
  return isConfirmedKnowledge(item);
}

export function getConfirmedKnowledge(items: readonly LifeKnowledgeItem[]): LifeKnowledgeItem[] {
  return items.filter(isUsableForConversation);
}

export function getCoachKnowledge(items: readonly LifeKnowledgeItem[]): LifeKnowledgeItem[] {
  return items.filter(isUsableForCoach);
}

export function getKnowledgeLabelsForCoach(items: readonly LifeKnowledgeItem[]): string[] {
  return getCoachKnowledge(items).map((item) => `${item.label}: ${item.value}`);
}
