/**
 * Fail-open Outcome Observation bridge — Sprint A4 pilot (free-time suggestions).
 */

import { isOutcomeObservationEnabled } from '../../config/featureFlags';
import {
  asCorrelationId,
  asEventId,
  asHouseholdId,
  asMemberId,
  asProposalId,
  asTraceId,
} from '../contracts/common/ids.ts';
import type { OutcomeEventType } from '../contracts/events/outcome-events.ts';
import { OUTCOME_EVENT_SCHEMA_VERSION } from '../contracts/events/outcome-events.ts';
import type { OutcomeValence } from '../contracts/events/outcome-events.ts';
import { getOutcomeObservationRuntime } from './outcomeObservationRuntime.ts';
import { getOutcomeSemantics, isA4SupportedEventType } from '../engines/outcome/outcomeSemantics.ts';

export type PilotProposalContext = {
  readonly userId: string;
  readonly householdId: string;
  readonly proposalId: string;
  readonly traceId?: string;
  readonly correlationId?: string;
};

export type PilotTaskContext = {
  readonly userId: string;
  readonly householdId: string;
  readonly taskId?: string;
  readonly calendarItemId?: string;
  readonly proposalId?: string;
  readonly traceId?: string;
};

function emitSafely(
  type: OutcomeEventType,
  params: {
    userId: string;
    householdId: string;
    proposalId?: string;
    traceId?: string;
    correlationId?: string;
    taskId?: string;
    calendarItemId?: string;
    valence?: OutcomeValence;
  },
): void {
  if (!isOutcomeObservationEnabled()) {
    return;
  }

  try {
    const runtime = getOutcomeObservationRuntime();
    const occurredAt = new Date().toISOString();
    const memberId = asMemberId(params.userId);

    const valence =
      params.valence ??
      (isA4SupportedEventType(type)
        ? getOutcomeSemantics(type).defaultValence
        : 'neutral');

    runtime.engine.recordOutcome({
      schemaVersion: OUTCOME_EVENT_SCHEMA_VERSION,
      eventId: asEventId(crypto.randomUUID()),
      type,
      occurredAt,
      provenance: {
        sourceEngineId: 'ui',
        emittedAt: occurredAt,
        correlationId: params.correlationId,
        memberId,
        householdId: asHouseholdId(params.householdId),
        consentScopes: ['personal_memory'],
      },
      payload: {
        proposalId: params.proposalId
          ? asProposalId(params.proposalId)
          : undefined,
        traceId: params.traceId ? asTraceId(params.traceId) : undefined,
        correlationId: params.correlationId
          ? asCorrelationId(params.correlationId)
          : undefined,
        memberId,
        valence,
        metadata: {
          householdId: params.householdId,
          ...(params.taskId ? { taskId: params.taskId } : {}),
          ...(params.calendarItemId
            ? { calendarItemId: params.calendarItemId }
            : {}),
        },
      },
    });
  } catch (error) {
    try {
      getOutcomeObservationRuntime().observability.recordInternalError();
    } catch {
      // fail-open — never propagate
    }

    if (import.meta.env.DEV) {
      console.warn('[OutcomeObservation bridge]', type, 'internal error');
      if (error instanceof Error && error.message) {
        console.warn('[OutcomeObservation bridge]', error.message);
      }
    }
  }
}

export function observePilotProposalPresented(
  context: PilotProposalContext,
): PilotProposalContext {
  const traceId = context.traceId ?? crypto.randomUUID();
  const correlationId = context.correlationId ?? crypto.randomUUID();

  emitSafely('proposal.presented', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId,
    correlationId,
  });

  const session = { ...context, traceId, correlationId };
  rememberPilotProposalSession(session);

  return session;
}

export function observePilotProposalAccepted(context: PilotProposalContext): void {
  emitSafely('proposal.accepted', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    correlationId: context.correlationId,
  });
}

export function observePilotProposalRejected(context: PilotProposalContext): void {
  emitSafely('proposal.rejected', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    correlationId: context.correlationId,
  });
}

export function observePilotProposalDismissed(context: PilotProposalContext): void {
  emitSafely('proposal.dismissed', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    correlationId: context.correlationId,
  });
}

export function observePilotTaskCompleted(context: PilotTaskContext): void {
  emitSafely('task.completed', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    taskId: context.taskId,
    calendarItemId: context.calendarItemId,
  });
}

export function observePilotTaskSkipped(context: PilotTaskContext): void {
  emitSafely('task.skipped', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    taskId: context.taskId,
    calendarItemId: context.calendarItemId,
  });
}

export function observePilotTaskRescheduled(context: PilotTaskContext): void {
  emitSafely('task.rescheduled', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    taskId: context.taskId,
    calendarItemId: context.calendarItemId,
  });
}

export function observePilotUserReportedHelpful(context: PilotProposalContext): void {
  emitSafely('user.reported_helpful', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    valence: 'positive_signal',
  });
}

export function observePilotUserReportedUnhelpful(context: PilotProposalContext): void {
  emitSafely('user.reported_unhelpful', {
    userId: context.userId,
    householdId: context.householdId,
    proposalId: context.proposalId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    valence: 'negative_signal',
  });
}

export function registerPilotProposalCorrelation(params: {
  proposalId: string;
  traceId: string;
  correlationId: string;
  taskId?: string;
  calendarItemId?: string;
}): void {
  if (!isOutcomeObservationEnabled()) return;

  try {
    const runtime = getOutcomeObservationRuntime();
    runtime.correlationRegistry.register({
      proposalId: asProposalId(params.proposalId),
      traceId: asTraceId(params.traceId),
      correlationId: asCorrelationId(params.correlationId),
      taskId: params.taskId,
      calendarItemId: params.calendarItemId,
    });
  } catch {
    // fail-open
  }
}

/** In-memory map for pilot modal session — proposal presentation context */
const pilotSessionByProposalId = new Map<string, PilotProposalContext>();

export function rememberPilotProposalSession(context: PilotProposalContext): void {
  pilotSessionByProposalId.set(context.proposalId, context);
}

export function getPilotProposalSession(
  proposalId: string,
): PilotProposalContext | undefined {
  return pilotSessionByProposalId.get(proposalId);
}

export function clearPilotProposalSessions(): void {
  pilotSessionByProposalId.clear();
}

export function resolvePilotContextForEntry(params: {
  userId: string;
  householdId: string;
  taskId?: string;
  calendarItemId?: string;
}): PilotTaskContext {
  if (!isOutcomeObservationEnabled()) {
    return params;
  }

  try {
    const runtime = getOutcomeObservationRuntime();
    const byCalendar = params.calendarItemId
      ? runtime.correlationRegistry.resolveByCalendarItemId(params.calendarItemId)
      : null;
    const byTask = params.taskId
      ? runtime.correlationRegistry.resolveByTaskId(params.taskId)
      : null;
    const entity = byCalendar ?? byTask;

    if (!entity) return params;

    return {
      ...params,
      proposalId: String(entity.proposalId),
      traceId: String(entity.traceId),
    };
  } catch {
    return params;
  }
}
