/** EPIC 4C — Action audit journal. */

import type { SecureAction, ActionExecutionReport } from "../types/secureAction";

export type AuditStatus =
  | "prepared"
  | "confirmed"
  | "cancelled"
  | "executed"
  | "failed"
  | "expired";

export type AuditEntry = {
  readonly id: string;
  readonly userId: string;
  readonly actionId: string;
  readonly actionType: SecureAction["type"];
  readonly origin: SecureAction["origin"];
  readonly sourceIntent: SecureAction["sourceIntent"];
  readonly why: readonly string[];
  readonly status: AuditStatus;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly error?: string;
  readonly resultSummary: string;
};

const STORAGE_PREFIX = "action-engine-audit:";

function readEntries(userId: string): AuditEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

function writeEntries(userId: string, entries: AuditEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(entries.slice(-50)));
}

function appendEntry(userId: string, entry: AuditEntry): AuditEntry {
  const existing = readEntries(userId);
  writeEntries(userId, [...existing, entry]);
  return entry;
}

export function recordPreparedAction(userId: string, action: SecureAction): AuditEntry {
  const now = new Date().toISOString();
  return appendEntry(userId, {
    id: `audit-${Date.now()}`,
    userId,
    actionId: action.id,
    actionType: action.type,
    origin: action.origin,
    sourceIntent: action.sourceIntent,
    why: action.explainability.whyAction,
    status: "prepared",
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    resultSummary: "Action préparée — en attente de confirmation.",
  });
}

export function recordConfirmedAction(userId: string, action: SecureAction): AuditEntry {
  const now = new Date().toISOString();
  return appendEntry(userId, {
    id: `audit-${Date.now()}`,
    userId,
    actionId: action.id,
    actionType: action.type,
    origin: action.origin,
    sourceIntent: action.sourceIntent,
    why: action.explainability.whyAction,
    status: "confirmed",
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    resultSummary: "Confirmation utilisateur reçue.",
  });
}

export function recordAuditEntry(input: {
  userId: string;
  action: SecureAction;
  report: ActionExecutionReport;
  status: Extract<AuditStatus, "executed" | "failed">;
}): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}`,
    userId: input.userId,
    actionId: input.action.id,
    actionType: input.action.type,
    origin: input.action.origin,
    sourceIntent: input.action.sourceIntent,
    why: input.action.explainability.whyAction,
    status: input.status,
    startedAt: input.report.startedAt,
    finishedAt: input.report.finishedAt,
    durationMs: input.report.durationMs,
    error: input.report.error,
    resultSummary: input.report.message,
  };

  return appendEntry(input.userId, entry);
}

export function recordCancelledAction(userId: string, action: SecureAction): AuditEntry {
  const now = new Date().toISOString();
  return appendEntry(userId, {
    id: `audit-${Date.now()}`,
    userId,
    actionId: action.id,
    actionType: action.type,
    origin: action.origin,
    sourceIntent: action.sourceIntent,
    why: action.explainability.whyAction,
    status: "cancelled",
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    resultSummary: "Action annulée par l'utilisateur.",
  });
}

export function recordExpiredAction(userId: string, action: SecureAction): AuditEntry {
  const now = new Date().toISOString();
  return appendEntry(userId, {
    id: `audit-${Date.now()}`,
    userId,
    actionId: action.id,
    actionType: action.type,
    origin: action.origin,
    sourceIntent: action.sourceIntent,
    why: action.explainability.whyAction,
    status: "expired",
    startedAt: now,
    finishedAt: now,
    durationMs: 0,
    resultSummary: "Action expirée avant confirmation.",
  });
}

export function getAuditEntries(userId: string): readonly AuditEntry[] {
  return readEntries(userId);
}

export function getAuditEntriesForAction(
  userId: string,
  actionId: string,
): readonly AuditEntry[] {
  return readEntries(userId).filter((entry) => entry.actionId === actionId);
}

export function clearAuditEntries(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
}
