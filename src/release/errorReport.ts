/**
 * EPIC 9 — Stash error context for Trust Center feedback.
 */

const STORAGE_KEY = "aura-pending-error-report";

export type PendingErrorReport = {
  message: string;
  stack?: string;
  context?: string;
  reportedAt: string;
};

export function stashErrorReport(error: Error | null, context = "app-error"): void {
  if (typeof sessionStorage === "undefined") return;
  const payload: PendingErrorReport = {
    message: error?.message ?? "Erreur inconnue",
    stack: error?.stack,
    context,
    reportedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function consumeErrorReport(): PendingErrorReport | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw) as PendingErrorReport;
  } catch {
    return null;
  }
}

export function peekErrorReport(): PendingErrorReport | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingErrorReport;
  } catch {
    return null;
  }
}
