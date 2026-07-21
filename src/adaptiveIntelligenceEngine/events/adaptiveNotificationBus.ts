/**
 * EPIC 6A — Adaptive notifications (architecture only — never auto-sent).
 */

import type { AdaptiveNotification, AdaptiveNotificationKind } from "../types/adaptiveTypes";

export type AdaptiveEventListener = (notification: AdaptiveNotification) => void;

export class AdaptiveNotificationBus {
  private readonly listeners = new Set<AdaptiveEventListener>();
  private readonly history: AdaptiveNotification[] = [];

  subscribe(listener: AdaptiveEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Queue only — no push/email in EPIC 6A. */
  queue(kind: AdaptiveNotificationKind, message: string): AdaptiveNotification {
    const notification: AdaptiveNotification = {
      kind,
      message,
      at: new Date().toISOString(),
      architectureOnly: true,
    };
    this.history.unshift(notification);
    for (const listener of this.listeners) {
      listener(notification);
    }
    return notification;
  }

  getHistory(): readonly AdaptiveNotification[] {
    return this.history;
  }
}

export const defaultAdaptiveNotificationBus = new AdaptiveNotificationBus();
