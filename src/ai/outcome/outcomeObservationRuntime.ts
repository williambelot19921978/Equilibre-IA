/**
 * Outcome observation runtime — Sprint A4 singleton (in-memory, reversible).
 */

import { isOutcomeObservationEnabled } from '../../config/featureFlags';
import { InMemoryProposalTraceStore } from '../traces/inMemoryProposalTraceStore.ts';
import { InMemoryPersonalSignalSink } from './personalSignalSink.ts';
import { CorrelationRegistry } from './correlationRegistry.ts';
import {
  createContractOutcomeObservationEngine,
  type ContractOutcomeObservationEngine,
} from '../engines/outcome/outcomeObservationEngine.ts';
import { OutcomeObservability } from '../engines/outcome/outcomeObservability.ts';

export type OutcomeObservationRuntime = {
  readonly engine: ContractOutcomeObservationEngine;
  readonly traceStore: InMemoryProposalTraceStore;
  readonly signalSink: InMemoryPersonalSignalSink;
  readonly correlationRegistry: CorrelationRegistry;
  readonly observability: OutcomeObservability;
};

let runtime: OutcomeObservationRuntime | null = null;

export function createOutcomeObservationRuntime(): OutcomeObservationRuntime {
  const traceStore = new InMemoryProposalTraceStore();
  const signalSink = new InMemoryPersonalSignalSink();
  const correlationRegistry = new CorrelationRegistry();
  const observability = new OutcomeObservability();
  const engine = createContractOutcomeObservationEngine({
    traceStore,
    signalSink,
    correlationRegistry,
    observability,
  });

  return {
    engine,
    traceStore,
    signalSink,
    correlationRegistry,
    observability,
  };
}

export function getOutcomeObservationRuntime(): OutcomeObservationRuntime {
  if (!runtime) {
    runtime = createOutcomeObservationRuntime();
  }
  return runtime;
}

export function resetOutcomeObservationRuntime(): void {
  runtime = null;
}

export function isOutcomeObservationActive(): boolean {
  return isOutcomeObservationEnabled();
}
