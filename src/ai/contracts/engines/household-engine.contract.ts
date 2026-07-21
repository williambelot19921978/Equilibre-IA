import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { HouseholdId, MemberId } from '../common/ids.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { HouseholdContext } from './shared-domain.ts';

export const HOUSEHOLD_ENGINE_META: EngineContractMeta = {
  id: 'household-engine',
  pipelineNumber: 5,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Household is central entity — partner is member not text',
    'Must not share private memory without consent',
  ],
};

export type FamilyContextForDate = {
  readonly date: string;
  readonly periods: readonly string[];
};

export type MemberAvailabilityHint = {
  readonly memberId: MemberId;
  readonly hint: string;
};

export type IHouseholdEngine = {
  readonly meta: typeof HOUSEHOLD_ENGINE_META;
  getContext(householdId: HouseholdId): Result<HouseholdContext>;
  getFamilyContextForDate(householdId: HouseholdId, date: string): FamilyContextForDate;
  getMemberAvailabilityHints(householdId: HouseholdId, date: string): readonly MemberAvailabilityHint[];
};

export const HOUSEHOLD_ENGINE_EVENTS = {
  emitted: [{ type: 'household.context.updated', description: 'Household context changed' }] satisfies EmittedEventBinding[],
  consumed: [{ type: 'lifeEvent.declared', handler: 'sync' }] satisfies ConsumedEventBinding[],
};
