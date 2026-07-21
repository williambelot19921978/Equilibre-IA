/** EPIC 4C — Secure Action Engine public API. */

export { SecureActionEngine, secureActionEngine } from "./engine/actionEngine";
export type { PrepareActionsResult, ConfirmActionResult } from "./engine/actionEngine";

export type {
  SecureAction,
  SecureActionType,
  SecureActionStatus,
  SecureActionDraft,
  ActionPreview,
  ActionExplainability,
  ValidationResult,
  ValidationIssue,
  ActionExecutionReport,
  RiskLevel,
} from "./types/secureAction";
export {
  createActionId,
  finalizeSecureAction,
  isActionExpired,
  DEFAULT_ACTION_TTL_MS,
} from "./types/secureAction";

export type { ActionBuilder, ActionBuilderContext } from "./types/actionBuilder";
export {
  ACTION_BUILDERS,
  resolveActionBuilders,
  enrichDraftWithTaskIds,
  enrichDraftMetadata,
} from "./builders/actionBuilders";

export {
  validateActionDraft,
  validateActionForExecution,
  formatValidationErrors,
  validateActionBeforeExecution,
} from "./validation/validationEngine";

export { buildPreviewFromDraft, enrichPreviewConfidence } from "./preview/previewEngine";

export { ActionExecutionEngine } from "./execution/executionEngine";
export type { ActionEngineDependencies } from "./execution/actionEngineDependencies";
export { defaultActionEngineDependencies } from "./execution/actionEngineDependencies";

export {
  buildActionBuilderContext,
  mergeSecureActionsIntoResponse,
  secureActionToProposed,
  updateProposedActionStatus,
} from "./bridge/assistantActionBridge";

export {
  savePendingAction,
  getPendingAction,
  listPendingActions,
  removePendingAction,
  clearPendingActions,
} from "./store/pendingActionStore";

export {
  recordAuditEntry,
  recordCancelledAction,
  recordConfirmedAction,
  recordExpiredAction,
  recordPreparedAction,
  getAuditEntriesForAction,
  getAuditEntries,
  clearAuditEntries,
} from "./audit/auditLog";
export type { AuditEntry, AuditStatus } from "./audit/auditLog";

export type { UndoToken, UndoRequest, UndoResult, IUndoEngine } from "./undo/undoContract";
export { UNDO_NOT_IMPLEMENTED_MESSAGE } from "./undo/undoContract";

export type {
  CalendarScope,
  PlanningCalendarOperation,
  PlanningCalendarTarget,
  IPlanningCalendarGateway,
} from "./planning/planningCalendarContract";
export {
  PLANNING_CALENDAR_NOT_IMPLEMENTED,
  buildPlanningCalendarTarget,
  buildScopePreviewHint,
  resolvePlanningOperation,
  resolveDefaultCalendarScope,
} from "./planning/planningCalendarContract";
