import type { EngineContractMeta, Result } from '../common/primitives.ts';
import { CONTRACT_VERSION_V1 } from '../common/primitives.ts';
import type { ConsumedEventBinding, EmittedEventBinding } from '../events/engine-events.ts';
import type { EngineEvent } from '../events/engine-events.ts';
import type { HumanModelSnapshot } from './shared-domain.ts';
import type { NotificationItem } from './shared-domain.ts';

export const NOTIFICATION_ENGINE_META: EngineContractMeta = {
  id: 'notification-engine',
  pipelineNumber: 18,
  contractVersion: CONTRACT_VERSION_V1,
  invariants: [
    'Parallel channel — must not block conversation pipeline',
    'Max 3/day — never after bedtime',
  ],
};

export type NotificationOutput = {
  readonly sent: readonly NotificationItem[];
  readonly suppressed: readonly { reason: string }[];
};

export type INotificationEngine = {
  readonly meta: typeof NOTIFICATION_ENGINE_META;
  processEvents(events: readonly EngineEvent[], humanModel: HumanModelSnapshot): Result<NotificationOutput>;
};

export const NOTIFICATION_ENGINE_EVENTS = {
  emitted: [
    { type: 'notification.sent', description: 'Notification sent' },
    { type: 'notification.suppressed', description: 'Notification suppressed' },
  ] satisfies EmittedEventBinding[],
  consumed: [
    { type: 'reasoning.overload.detected', handler: 'async' },
    { type: 'goal.alert', handler: 'async' },
  ] satisfies ConsumedEventBinding[],
};
