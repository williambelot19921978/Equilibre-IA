/**
 * Versioned engine event envelope — all brain events share this shape.
 */

import type { ContractVersion, EngineId } from '../common/primitives.ts';
import type { CorrelationId, EventId } from '../common/ids.ts';

export type EngineEvent<TType extends string = string, TPayload = unknown> = {
  readonly schemaVersion: ContractVersion;
  readonly eventId: EventId;
  readonly type: TType;
  readonly engineId: EngineId;
  readonly emittedAt: string;
  readonly correlationId?: CorrelationId;
  readonly payload: TPayload;
};

export type ConsumedEventBinding = {
  readonly type: string;
  readonly handler: 'sync' | 'async';
};

export type EmittedEventBinding = {
  readonly type: string;
  readonly description: string;
};
