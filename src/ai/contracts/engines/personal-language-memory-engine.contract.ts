import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { Confidence } from '../common/primitives.ts';
import type { ExpressionId, MemberId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { HumanModelSnapshot, LanguageHint } from './shared-domain.ts';

export const PLM_ENGINE_META: EngineContractMeta = {
  id: 'personal-language-memory-engine',
  pipelineNumber: 3,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Personal Memory only — never writes Universal Learning',
    'User confirmation required before freezing expression',
    'Isolated per member',
  ],
};

export type LanguageResolution = {
  readonly matched: boolean;
  readonly intent?: string;
  readonly meaning?: string;
  readonly confidence: Confidence;
};

export type LearningProposal = {
  readonly expression: string;
  readonly proposedIntent: string;
  readonly requiresConfirmation: true;
};

export type ConfirmOutcome = 'confirmed' | 'rejected' | 'corrected';

export type IPLMEngine = {
  readonly meta: typeof PLM_ENGINE_META;
  resolve(expression: string, memberId: MemberId, snapshot?: HumanModelSnapshot): Result<LanguageResolution>;
  proposeLearning(expression: string, memberId: MemberId): LearningProposal;
  confirm(expressionId: ExpressionId, outcome: ConfirmOutcome): Result<void>;
  getHints(memberId: MemberId): readonly LanguageHint[];
};

export const PLM_ENGINE_EVENTS = {
  emitted: [
    { type: 'language.expression.matched', description: 'Personal expression matched' },
    { type: 'language.expression.proposed', description: 'Learning proposed' },
    { type: 'language.expression.confirmed', description: 'User confirmed' },
    { type: 'language.expression.rejected', description: 'User rejected' },
  ] satisfies EmittedEventBinding[],
  consumed: [{ type: 'outcome.behaviorSignal.emitted', handler: 'async' }] satisfies ConsumedEventBinding[],
};
