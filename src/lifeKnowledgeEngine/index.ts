/** EPIC 6E — Life Knowledge Engine public API */

export type {
  LifeKnowledgeCategory,
  LifeKnowledgeSource,
  LifeKnowledgeStatus,
  ConfirmationChoice,
  LifeKnowledgeItem,
  ConfirmationProposal,
  LifeTimelineEvent,
  LifeKnowledgeInput,
  LifeKnowledgeSnapshot,
} from "./types/lifeKnowledgeTypes";

export {
  CATEGORY_LABELS,
  CONFIRMATION_THRESHOLD,
  COACH_KNOWLEDGE_THRESHOLD,
  HIGH_CONFIDENCE_THRESHOLD,
} from "./types/lifeKnowledgeTypes";

export {
  getForgottenIds,
  forgetKnowledge,
  restoreKnowledge,
  modifyKnowledge,
  resetKnowledge,
  getKnowledgeOverrides,
  getNeverConfirmIds,
  recordNeverConfirm,
  getStoredConfirmations,
  saveConfirmationProposal,
  updateConfirmationStatus,
  recordConfirmationChoice,
  getTimelineEvents,
  addTimelineEvent,
  clearKnowledgeStore,
  applyUserControls,
} from "./store/knowledgeStore";

export { mergeKnowledgeFromSources } from "./merge/knowledgeMergeEngine";
export {
  normalizeConfidence,
  isHighConfidence,
  confidenceLabel,
  rankByConfidence,
  averageConfidence,
} from "./confidence/knowledgeConfidenceEngine";
export {
  buildConfirmationMessage,
  shouldProposeConfirmation,
  generateConfirmationProposals,
  acceptConfirmation,
} from "./confirmation/confirmationEngine";
export { buildTimelineFromInput, recordLifeChange } from "./timeline/lifeTimelineEngine";
export {
  filterVisibleKnowledge,
  forgetItem,
  editItem,
  resetAllKnowledge,
  isForgotten,
  unforgetItem,
} from "./forget/forgetEngine";
export {
  isConfirmedKnowledge,
  isUsableForCoach,
  isUsableForConversation,
  getConfirmedKnowledge,
  getCoachKnowledge,
  getKnowledgeLabelsForCoach,
} from "./guards/knowledgeGuards";
export { buildKnowledgePhrasingHints } from "./phrasing/knowledgePhrasing";

export {
  LifeKnowledgeEngine,
  defaultLifeKnowledgeEngine,
  createEmptyLifeKnowledgeSnapshot,
} from "./engine/lifeKnowledgeEngine";

export { buildLifeKnowledgeDiagnostics } from "./diagnostics/buildLifeKnowledgeDiagnostics";
export type { LifeKnowledgeDiagnostics } from "./diagnostics/buildLifeKnowledgeDiagnostics";
