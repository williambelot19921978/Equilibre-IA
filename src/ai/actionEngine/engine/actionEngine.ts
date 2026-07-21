/**
 * EPIC 4C — Secure Action Engine orchestrator.
 *
 * Cycle : Compréhension → Préparation → Prévisualisation → Confirmation → Exécution → Compte-rendu
 */

import { enrichDraftWithTaskIds, resolveActionBuilders, enrichDraftMetadata } from "../builders/actionBuilders";
import { ActionExecutionEngine } from "../execution/executionEngine";
import type { ActionEngineDependencies } from "../execution/actionEngineDependencies";
import { defaultActionEngineDependencies } from "../execution/actionEngineDependencies";
import { enrichPreviewConfidence } from "../preview/previewEngine";
import {
  clearPendingActions,
  getPendingAction,
  listPendingActions,
  removePendingAction,
  savePendingAction,
  updatePendingAction,
} from "../store/pendingActionStore";
import type { ActionBuilderContext } from "../types/actionBuilder";
import type {
  SecureAction,
  ActionExecutionReport,
} from "../types/secureAction";
import { finalizeSecureAction, isActionExpired } from "../types/secureAction";
import {
  formatValidationErrors,
  validateActionDraft,
  validateActionBeforeExecution,
} from "../validation/validationEngine";
import {
  recordAuditEntry,
  recordCancelledAction,
  recordConfirmedAction,
  recordExpiredAction,
  recordPreparedAction,
} from "../audit/auditLog";

export type PrepareActionsResult = {
  readonly actions: readonly SecureAction[];
  readonly errors: readonly string[];
};

export type ConfirmActionResult = {
  readonly action: SecureAction;
  readonly report: ActionExecutionReport;
};

export class SecureActionEngine {
  private readonly deps: ActionEngineDependencies;
  private readonly executor: ActionExecutionEngine;
  private readonly confirmingKeys = new Set<string>();

  constructor(deps: ActionEngineDependencies = defaultActionEngineDependencies) {
    this.deps = deps;
    this.executor = new ActionExecutionEngine(deps);
  }

  isEnabled(): boolean {
    return this.deps.isSecureActionEngineEnabled();
  }

  async prepareActions(ctx: ActionBuilderContext): Promise<PrepareActionsResult> {
    if (!this.isEnabled()) {
      return { actions: [], errors: ["Action Engine désactivé."] };
    }

    const builders = resolveActionBuilders(ctx);
    if (builders.length === 0) {
      return { actions: [], errors: [] };
    }

    const actions: SecureAction[] = [];
    const errors: string[] = [];

    for (const builder of builders.slice(0, 2)) {
      try {
        let draft = builder.build(ctx);
        draft = enrichDraftMetadata(draft);
        draft = await enrichDraftWithTaskIds(draft, ctx, this.deps.getUserTasks);
        const validation = await validateActionDraft(draft, this.deps);
        const preview = enrichPreviewConfidence(draft.preview, validation.valid);
        draft = { ...draft, preview };

        const action = finalizeSecureAction(draft, validation);
        if (!validation.valid) {
          errors.push(formatValidationErrors(validation));
        } else {
          savePendingAction(ctx.userId, action);
          recordPreparedAction(ctx.userId, action);
        }
        actions.push(action);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Erreur de préparation.");
      }
    }

    return { actions, errors };
  }

  async confirmAction(userId: string, actionId: string): Promise<ConfirmActionResult> {
    if (!this.isEnabled()) {
      throw new Error("Action Engine désactivé.");
    }

    const lockKey = `${userId}:${actionId}`;
    if (this.confirmingKeys.has(lockKey)) {
      throw new Error("Confirmation déjà en cours — une seule exécution autorisée.");
    }

    this.confirmingKeys.add(lockKey);

    try {
      const pending = getPendingAction(userId, actionId);
      if (!pending) {
        throw new Error("Action introuvable ou expirée.");
      }

      if (pending.status !== "pending_confirmation") {
        throw new Error("Action déjà traitée — confirmation impossible.");
      }

      if (isActionExpired(pending)) {
        removePendingAction(userId, actionId);
        const expired: SecureAction = { ...pending, status: "expired" };
        recordExpiredAction(userId, expired);
        throw new Error("Action expirée — veuillez en demander une nouvelle.");
      }

      const executing: SecureAction = { ...pending, status: "executing" };
      updatePendingAction(userId, executing);
      recordConfirmedAction(userId, executing);

      const finalValidation = await validateActionBeforeExecution(
        executing,
        userId,
        this.deps,
      );
      if (!finalValidation.valid) {
        const failed: SecureAction = { ...executing, status: "failed" };
        updatePendingAction(userId, failed);
        const report: ActionExecutionReport = {
          actionId,
          success: false,
          message: formatValidationErrors(finalValidation),
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: 0,
          error: "final_validation_failed",
        };
        recordAuditEntry({ userId, action: failed, report, status: "failed" });
        removePendingAction(userId, actionId);
        throw new Error(formatValidationErrors(finalValidation));
      }

      const report = await this.executor.executeConfirmedAction(executing, userId);

      const finalAction: SecureAction = {
        ...executing,
        status: report.success ? "executed" : "failed",
      };
      updatePendingAction(userId, finalAction);

      recordAuditEntry({
        userId,
        action: finalAction,
        report,
        status: report.success ? "executed" : "failed",
      });

      removePendingAction(userId, actionId);

      return { action: finalAction, report };
    } finally {
      this.confirmingKeys.delete(lockKey);
    }
  }

  cancelAction(userId: string, actionId: string): SecureAction {
    const pending = getPendingAction(userId, actionId);
    if (!pending) {
      throw new Error("Action introuvable.");
    }

    if (pending.status === "executing") {
      throw new Error("Action en cours d'exécution — annulation impossible.");
    }

    const cancelled: SecureAction = { ...pending, status: "cancelled" };
    updatePendingAction(userId, cancelled);
    recordCancelledAction(userId, cancelled);
    removePendingAction(userId, actionId);
    return cancelled;
  }

  getPendingActions(userId: string): readonly SecureAction[] {
    return listPendingActions(userId);
  }

  clearUserActions(userId: string): void {
    clearPendingActions(userId);
  }
}

export const secureActionEngine = new SecureActionEngine();
