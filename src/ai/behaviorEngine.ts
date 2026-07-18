/**
 * Sprint ai-core-language-memory-v1 — agrégation signaux comportementaux.
 * v1 : lecture pure depuis task_activity_events (pas de table behavioral_signals).
 */
export { aggregateBehaviorSignals } from "./core/aggregateBehaviorSignals";
export {
  buildLanguageMemoryContext,
  type BehaviorSignalCounts,
  type LanguageMemoryBehaviorSnapshot,
} from "./core/buildLanguageMemoryContext";
