import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuditEntries,
  getAuditEntries,
  recordCancelledAction,
  recordConfirmedAction,
  recordExpiredAction,
  recordPreparedAction,
  recordAuditEntry,
} from "./auditLog";
import { enrichDraftMetadata } from "../builders/actionBuilders";
import { finalizeSecureAction } from "../types/secureAction";

function buildAction() {
  return finalizeSecureAction(
    enrichDraftMetadata({
      type: "createTask",
      description: "Créer",
      summary: "Créer tâche audit",
      target: "tasks",
      payload: { userId: "user-1", title: "Audit" },
      riskLevel: "low",
      requiresConfirmation: true,
      estimatedImpact: "Ajout",
      sourceIntent: "organization",
      origin: "assistant",
      preview: {
        title: "Créer",
        before: [],
        after: [],
        impact: "i",
        affectedItems: [],
        confidence: 0.8,
        risk: "low",
        why: [],
      },
      explainability: {
        summary: "Organisation",
        whyAction: ["Intent organisation"],
        whyTarget: [],
        whyTiming: [],
      },
    }),
    { valid: true, issues: [] },
  );
}

describe("EPIC4C AuditLog", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
      key: () => null,
      length: 0,
    });
    clearAuditEntries("user-1");
  });

  it("enregistre prepared, confirmed, cancelled, executed, failed, expired", () => {
    const action = buildAction();

    recordPreparedAction("user-1", action);
    recordConfirmedAction("user-1", action);
    recordCancelledAction("user-1", { ...action, status: "cancelled" });
    recordExpiredAction("user-1", { ...action, status: "expired" });

    recordAuditEntry({
      userId: "user-1",
      action: { ...action, status: "executed" },
      report: {
        actionId: action.id,
        success: true,
        message: "OK",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 12,
      },
      status: "executed",
    });

    recordAuditEntry({
      userId: "user-1",
      action: { ...action, status: "failed" },
      report: {
        actionId: action.id,
        success: false,
        message: "Erreur",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 5,
        error: "failed",
      },
      status: "failed",
    });

    const entries = getAuditEntries("user-1");
    expect(entries.map((entry) => entry.status)).toEqual([
      "prepared",
      "confirmed",
      "cancelled",
      "expired",
      "executed",
      "failed",
    ]);

    for (const entry of entries) {
      expect(entry.actionId).toBe(action.id);
      expect(entry.userId).toBe("user-1");
      expect(entry.actionType).toBe("createTask");
      expect(entry.origin).toBe("assistant");
      expect(entry.sourceIntent).toBe("organization");
      expect(entry.startedAt).toBeTruthy();
      expect(entry.finishedAt).toBeTruthy();
      expect(entry.resultSummary).toBeTruthy();
    }
  });
});
