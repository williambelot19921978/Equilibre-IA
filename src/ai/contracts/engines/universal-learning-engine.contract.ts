import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { GatePassedUniversalSignal, UniversalHint, UniversalIntentPattern, UniversalLearningInput, UniversalStrategy } from '../privacy/universal-signal.ts';
import type { RejectPersonalForUniversal } from '../privacy/personal-signal.ts';

export const UNIVERSAL_LEARNING_ENGINE_META: EngineContractMeta = {
  id: 'universal-learning-engine',
  pipelineNumber: 19,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Never reads Personal Memory engines directly',
    'Only accepts GatePassedUniversalSignal for writes',
    'No memberId in any store or lookup result',
  ],
};

export type GeneralPlanningContext = {
  readonly dayType: string;
  readonly constraintProfile: string;
};

export type ValidationResult = {
  readonly accepted: boolean;
  readonly reason?: string;
};

export type IUniversalLearningEngine = {
  readonly meta: typeof UNIVERSAL_LEARNING_ENGINE_META;
  lookupLanguageHints(normalizedPhrase: string): readonly UniversalHint[];
  lookupPlanningStrategies(context: GeneralPlanningContext): readonly UniversalStrategy[];
  lookupIntentPatterns(intentKey: string): readonly UniversalIntentPattern[];
  /** Only gate-passed signals — PersonalSignal is a type error at call site */
  submitAnonymizedSignal(signal: UniversalLearningInput): Result<ValidationResult>;
  validateCandidate(candidate: RejectPersonalForUniversal<GatePassedUniversalSignal>): ValidationResult;
};

export const UNIVERSAL_LEARNING_ENGINE_EVENTS = {
  emitted: [
    { type: 'universal.knowledge.validated', description: 'Candidate accepted' },
    { type: 'universal.knowledge.rejected', description: 'Candidate rejected' },
    { type: 'universal.hint.served', description: 'Hint lookup' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'anonymization.gate.passed', handler: 'async' }] satisfies ConsumedEventBinding[],
};
