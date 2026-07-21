/**
 * EPIC 6B — Notification Dispatcher (architecture only — no real send).
 */

import type { NotificationChannel, ProactiveNotification } from "../types/proactiveTypes";

export type DispatchRequest = {
  readonly channel: NotificationChannel;
  readonly message: string;
  readonly suggestionId: string;
};

export class NotificationDispatcher {
  private readonly history: ProactiveNotification[] = [];
  private dispatchListener?: (notification: ProactiveNotification) => void;

  /** EPIC 7B — optional listener for mobile notification delivery. */
  setDispatchListener(listener?: (notification: ProactiveNotification) => void): void {
    this.dispatchListener = listener;
  }

  /** Must pass through AttentionEngine before dispatch — enforced by orchestrator. */
  dispatch(request: DispatchRequest): ProactiveNotification {
    const notification: ProactiveNotification = {
      channel: request.channel,
      message: request.message,
      suggestionId: request.suggestionId,
      at: new Date().toISOString(),
      architectureOnly: true,
    };
    this.history.unshift(notification);
    this.dispatchListener?.(notification);
    return notification;
  }

  getHistory(): readonly ProactiveNotification[] {
    return this.history;
  }

  clear(): void {
    this.history.length = 0;
  }
}

export const defaultNotificationDispatcher = new NotificationDispatcher();

export const FUTURE_CHANNELS: readonly NotificationChannel[] = [
  "in_app",
  "push",
  "email",
  "watch",
  "widget",
];
