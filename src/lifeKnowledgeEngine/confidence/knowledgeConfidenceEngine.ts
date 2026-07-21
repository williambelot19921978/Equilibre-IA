/**
 * EPIC 6E — Confidence scoring for life knowledge.
 */

import type { LifeKnowledgeItem } from "../types/lifeKnowledgeTypes";
import { HIGH_CONFIDENCE_THRESHOLD } from "../types/lifeKnowledgeTypes";

export function normalizeConfidence(value: number): number {
  return Math.round(Math.max(0, Math.min(0.99, value)) * 100) / 100;
}

export function isHighConfidence(item: LifeKnowledgeItem): boolean {
  return item.confidence >= HIGH_CONFIDENCE_THRESHOLD;
}

export function confidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)} %`;
}

export function rankByConfidence(items: readonly LifeKnowledgeItem[]): LifeKnowledgeItem[] {
  return [...items].sort((left, right) => right.confidence - left.confidence);
}

export function averageConfidence(items: readonly LifeKnowledgeItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((total, item) => total + item.confidence, 0);
  return normalizeConfidence(sum / items.length);
}
