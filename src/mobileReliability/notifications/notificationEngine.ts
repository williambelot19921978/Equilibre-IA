/**
 * EPIC 7B — Notification engine.
 * Consumes Proactive Engine output only — never auto-sends without rule validation.
 */

import type { ProactiveNotification } from "../../proactiveIntelligenceEngine/types/proactiveTypes";
import {
  getNotificationPreferences,
  isInQuietHours,
} from "./notificationPreferencesStore";
import type {
  DeliveredNotification,
  NotificationChannelId,
} from "../types/mobileTypes";
import { trackInsightEvent } from "../../auraInsights/eventStore";

const INBOX_PREFIX = "notification-inbox-";
const MAX_DAILY = 3;

function inboxKey(userId: string): string {
  return `${INBOX_PREFIX}${userId}`;
}

function readInbox(userId: string): DeliveredNotification[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(inboxKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as DeliveredNotification[];
  } catch {
    return [];
  }
}

function writeInbox(userId: string, items: DeliveredNotification[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(inboxKey(userId), JSON.stringify(items.slice(0, 100)));
}

function todayCount(items: DeliveredNotification[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return items.filter((item) => item.deliveredAt.startsWith(today)).length;
}

function mapChannelFromMessage(message: string): NotificationChannelId {
  const lower = message.toLowerCase();
  if (lower.includes("check") || lower.includes("ressenti")) return "checkin";
  if (lower.includes("objectif") || lower.includes("goal")) return "goals";
  if (lower.includes("planning") || lower.includes("créneau")) return "planning";
  if (lower.includes("digest") || lower.includes("résumé")) return "digest";
  return "coach";
}

export type NotificationDeliveryRequest = {
  readonly userId: string;
  readonly proactiveNotification: ProactiveNotification;
  readonly title?: string;
  readonly important?: boolean;
};

export class NotificationEngine {
  /**
   * Validates user prefs + quiet hours + daily cap before delivery.
   * Returns null if rules block delivery.
   */
  evaluate(request: NotificationDeliveryRequest): DeliveredNotification | null {
    const prefs = getNotificationPreferences(request.userId);

    if (prefs.level === "none") return null;

    const channelId = mapChannelFromMessage(request.proactiveNotification.message);
    if (!prefs.channels[channelId]) return null;

    if (isInQuietHours(prefs) && !request.important) return null;

    const inbox = readInbox(request.userId);
    if (todayCount(inbox) >= MAX_DAILY && !request.important) return null;

    const silent = prefs.level === "silent" || (prefs.level === "important" && !request.important);

    if (prefs.level === "important" && !request.important && channelId !== "coach") {
      return null;
    }

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channelId,
      title: request.title ?? "Aura",
      body: request.proactiveNotification.message,
      suggestionId: request.proactiveNotification.suggestionId,
      silent,
      read: false,
      deliveredAt: new Date().toISOString(),
      source: "proactive_engine",
    };
  }

  deliver(request: NotificationDeliveryRequest): DeliveredNotification | null {
    const notification = this.evaluate(request);
    if (!notification) return null;

    const inbox = readInbox(request.userId);
    writeInbox(request.userId, [notification, ...inbox]);
    trackInsightEvent(request.userId, "notification_sent", {
      channel: notification.channelId,
    });

    if (
      !notification.silent &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(notification.title, {
          body: notification.body,
          tag: notification.suggestionId,
          silent: notification.silent,
        });
      } catch {
        // Browser may block — in-app inbox still holds the notification.
      }
    }

    return notification;
  }

  getInbox(userId: string): DeliveredNotification[] {
    return readInbox(userId);
  }

  getUnreadCount(userId: string): number {
    return readInbox(userId).filter((item) => !item.read).length;
  }

  markRead(userId: string, notificationId: string): void {
    writeInbox(
      userId,
      readInbox(userId).map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );
  }

  markAllRead(userId: string): void {
    writeInbox(
      userId,
      readInbox(userId).map((item) => ({ ...item, read: true })),
    );
  }

  clearInbox(userId: string): void {
    writeInbox(userId, []);
  }
}

export const defaultNotificationEngine = new NotificationEngine();

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}
