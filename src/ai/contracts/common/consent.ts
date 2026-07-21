/**
 * Consent, sensitivity, provenance — Dual Memory boundaries.
 */

import type { MemberId, HouseholdId } from './ids.ts';

export type ConsentScope =
  | 'personal_memory'
  | 'universal_learning_contribution'
  | 'notification'
  | 'health_data'
  | 'spirituality_module';

export type ConsentRecord = {
  readonly scope: ConsentScope;
  readonly granted: boolean;
  readonly grantedAt?: string;
  readonly revokedAt?: string;
  readonly memberId: MemberId;
};

export type SensitivityLevel = 'public' | 'internal' | 'personal' | 'sensitive' | 'restricted';

export type SignalProvenance = {
  readonly sourceEngineId: string;
  readonly emittedAt: string;
  readonly correlationId?: string;
  readonly memberId?: MemberId;
  readonly householdId?: HouseholdId;
  readonly consentScopes: readonly ConsentScope[];
};

export type MemoryRoute = 'personal_only' | 'universal_candidate' | 'discard';

export type CohortThreshold = {
  readonly minSize: number;
  readonly rarityMax?: number;
};
