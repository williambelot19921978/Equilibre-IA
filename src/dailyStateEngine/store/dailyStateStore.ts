/**
 * EPIC 6C — Daily State store (localStorage).
 */

import type { CheckinMode, CheckinSkipRecord, DailyState } from "../types/dailyStateTypes";
import { DEFAULT_CHECKIN_MODE } from "../types/dailyStateTypes";

const STATE_PREFIX = "daily-state-";
const SKIP_PREFIX = "daily-state-skips-";
const SETTINGS_PREFIX = "daily-state-settings-";

function stateKey(userId: string): string {
  return `${STATE_PREFIX}${userId}`;
}

function skipKey(userId: string): string {
  return `${SKIP_PREFIX}${userId}`;
}

function settingsKey(userId: string): string {
  return `${SETTINGS_PREFIX}${userId}`;
}

function readStates(userId: string): DailyState[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(stateKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as DailyState[];
  } catch {
    return [];
  }
}

function writeStates(userId: string, states: DailyState[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(stateKey(userId), JSON.stringify(states.slice(0, 400)));
}

export function getDailyState(userId: string, date: string): DailyState | null {
  return readStates(userId).find((state) => state.date === date) ?? null;
}

export function getStateHistory(userId: string): DailyState[] {
  return readStates(userId).sort((left, right) => right.date.localeCompare(left.date));
}

export function saveDailyState(userId: string, state: DailyState): DailyState {
  const history = readStates(userId);
  const index = history.findIndex((item) => item.date === state.date);
  if (index >= 0) {
    history[index] = state;
  } else {
    history.unshift(state);
  }
  writeStates(userId, history);
  return state;
}

export function deleteDailyState(userId: string, date: string): void {
  writeStates(
    userId,
    readStates(userId).filter((state) => state.date !== date),
  );
}

export function clearDailyStates(userId: string): void {
  writeStates(userId, []);
}

export function getCheckinMode(userId: string): CheckinMode {
  if (typeof localStorage === "undefined") return DEFAULT_CHECKIN_MODE;
  try {
    const raw = localStorage.getItem(settingsKey(userId));
    if (!raw) return DEFAULT_CHECKIN_MODE;
    const parsed = JSON.parse(raw) as { mode?: CheckinMode };
    return parsed.mode ?? DEFAULT_CHECKIN_MODE;
  } catch {
    return DEFAULT_CHECKIN_MODE;
  }
}

export function setCheckinMode(userId: string, mode: CheckinMode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(settingsKey(userId), JSON.stringify({ mode }));
}

function readSkips(userId: string): CheckinSkipRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(skipKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as CheckinSkipRecord[];
  } catch {
    return [];
  }
}

function writeSkips(userId: string, skips: CheckinSkipRecord[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(skipKey(userId), JSON.stringify(skips.slice(0, 100)));
}

export function recordSkip(userId: string, date: string): void {
  const skips = readSkips(userId).filter((skip) => skip.date !== date);
  skips.unshift({ date, skippedAt: new Date().toISOString() });
  writeSkips(userId, skips);
}

export function getSkipRecords(userId: string): CheckinSkipRecord[] {
  return readSkips(userId);
}

export function consecutiveSkipDays(userId: string, untilDate: string): number {
  const skips = new Set(getSkipRecords(userId).map((skip) => skip.date));
  const states = new Set(readStates(userId).map((state) => state.date));
  let count = 0;
  const cursor = new Date(`${untilDate}T12:00:00.000Z`);

  for (let index = 0; index < 14; index += 1) {
    const iso = cursor.toISOString().slice(0, 10);
    if (states.has(iso)) break;
    if (skips.has(iso) || index === 0) {
      count += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return count;
}

export function clearSkipRecords(userId: string): void {
  writeSkips(userId, []);
}
