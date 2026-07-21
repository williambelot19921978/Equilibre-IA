/**
 * EPIC 8B — Local event store (backend-branchable).
 */

import type { AuraInsightEvent, AuraInsightEventType } from "./types";
import { sanitizeMeta, toAnonymousId } from "./anonymize";
import { isAnalyticsAllowedForUser } from "./privacyGate";

const STORAGE_KEY = "aura-insights-events-v1";
const MAX_EVENTS = 8000;

export type InsightsBackendAdapter = {
  send(events: readonly AuraInsightEvent[]): Promise<void>;
};

let backendAdapter: InsightsBackendAdapter | null = null;

export function setInsightsBackendAdapter(adapter: InsightsBackendAdapter | null): void {
  backendAdapter = adapter;
}

function readEvents(): AuraInsightEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuraInsightEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: AuraInsightEvent[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function listInsightEvents(): AuraInsightEvent[] {
  return readEvents();
}

export function clearInsightEvents(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function clearInsightEventsForUser(userId: string): void {
  const anonymousId = toAnonymousId(userId);
  writeEvents(readEvents().filter((event) => event.anonymousId !== anonymousId));
}

export function trackInsightEvent(
  userId: string | null | undefined,
  type: AuraInsightEventType,
  meta: Record<string, unknown> = {},
): AuraInsightEvent | null {
  if (!userId || !isAnalyticsAllowedForUser(userId)) return null;

  const event: AuraInsightEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    anonymousId: toAnonymousId(userId),
    at: new Date().toISOString(),
    meta: sanitizeMeta(meta),
  };

  const events = [...readEvents(), event];
  writeEvents(events);

  if (backendAdapter) {
    void backendAdapter.send([event]).catch(() => {
      // Local-first — silent fail until backend wired
    });
  }

  return event;
}

export function trackAnonymousInsightEvent(
  type: AuraInsightEventType,
  meta: Record<string, unknown> = {},
): AuraInsightEvent | null {
  const pseudoUser = "anonymous-session";
  return trackInsightEvent(pseudoUser, type, meta);
}
