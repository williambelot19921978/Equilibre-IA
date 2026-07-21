/**
 * EPIC 6B — Proactive behavior metrics store.
 */

import type { ProactiveBehaviorMetrics } from "../types/proactiveTypes";

const STORAGE_PREFIX = "proactive-behavior-";

const DEFAULT_METRICS: ProactiveBehaviorMetrics = {
  interruptionTolerance: 0.6,
  notificationPreference: "balanced",
  acceptanceRate: 0.5,
  dismissRate: 0.2,
  preferredMoments: ["09:00", "14:00", "18:00"],
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): ProactiveBehaviorMetrics {
  if (typeof localStorage === "undefined") return DEFAULT_METRICS;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_METRICS;
    return { ...DEFAULT_METRICS, ...(JSON.parse(raw) as ProactiveBehaviorMetrics) };
  } catch {
    return DEFAULT_METRICS;
  }
}

function write(userId: string, metrics: ProactiveBehaviorMetrics): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(metrics));
}

export function getBehaviorMetrics(userId: string): ProactiveBehaviorMetrics {
  return read(userId);
}

export function recordSuggestionOutcome(
  userId: string,
  accepted: boolean,
): ProactiveBehaviorMetrics {
  const current = read(userId);
  const total = Math.max(1, current.acceptanceRate + current.dismissRate > 0 ? 10 : 1);
  const acceptedCount = Math.round(current.acceptanceRate * total) + (accepted ? 1 : 0);
  const dismissedCount = Math.round(current.dismissRate * total) + (accepted ? 0 : 1);
  const newTotal = acceptedCount + dismissedCount;

  const acceptanceRate = acceptedCount / newTotal;
  const dismissRate = dismissedCount / newTotal;

  let notificationPreference = current.notificationPreference;
  if (dismissRate > 0.7) notificationPreference = "minimal";
  else if (acceptanceRate > 0.7) notificationPreference = "active";

  const interruptionTolerance = Math.max(
    0.2,
    Math.min(0.95, 0.5 + acceptanceRate * 0.3 - dismissRate * 0.25),
  );

  const updated: ProactiveBehaviorMetrics = {
    ...current,
    acceptanceRate,
    dismissRate,
    notificationPreference,
    interruptionTolerance,
  };

  write(userId, updated);
  return updated;
}

export function clearBehaviorMetrics(userId: string): void {
  write(userId, DEFAULT_METRICS);
}

export { DEFAULT_METRICS };
