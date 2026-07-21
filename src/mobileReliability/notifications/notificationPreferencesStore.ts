/**
 * EPIC 7B — Notification preferences (localStorage).
 */

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationChannelId,
  type NotificationLevel,
  type NotificationPreferences,
} from "../types/mobileTypes";

const PREFIX = "notification-prefs-";

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function getNotificationPreferences(userId: string): NotificationPreferences {
  if (typeof localStorage === "undefined") return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(JSON.parse(raw) as Partial<NotificationPreferences>) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function setNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  const next = { ...getNotificationPreferences(userId), ...patch };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key(userId), JSON.stringify(next));
  }
  return next;
}

export function setNotificationLevel(
  userId: string,
  level: NotificationLevel,
): NotificationPreferences {
  return setNotificationPreferences(userId, { level });
}

export function setChannelEnabled(
  userId: string,
  channelId: NotificationChannelId,
  enabled: boolean,
): NotificationPreferences {
  const prefs = getNotificationPreferences(userId);
  return setNotificationPreferences(userId, {
    channels: { ...prefs.channels, [channelId]: enabled },
  });
}

export function isInQuietHours(prefs: NotificationPreferences, now = new Date()): boolean {
  const [startH, startM] = prefs.quietStart.split(":").map(Number);
  const [endH, endM] = prefs.quietEnd.split(":").map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start <= end) {
    return minutes >= start && minutes < end;
  }
  return minutes >= start || minutes < end;
}
