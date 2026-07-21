/**
 * Outcome observation metrics — Sprint A4 (IDs and counts only).
 */

export type OutcomeObservabilitySnapshot = {
  readonly eventsReceived: number;
  readonly eventsValid: number;
  readonly eventsRejected: number;
  readonly correlationsSucceeded: number;
  readonly correlationsMissing: number;
  readonly tracesNotFound: number;
  readonly personalSignalsProduced: number;
  readonly internalErrors: number;
};

export class OutcomeObservability {
  private eventsReceived = 0;
  private eventsValid = 0;
  private eventsRejected = 0;
  private correlationsSucceeded = 0;
  private correlationsMissing = 0;
  private tracesNotFound = 0;
  private personalSignalsProduced = 0;
  private internalErrors = 0;

  recordReceived(): void {
    this.eventsReceived += 1;
  }

  recordValid(): void {
    this.eventsValid += 1;
  }

  recordRejected(): void {
    this.eventsRejected += 1;
  }

  recordCorrelationSucceeded(): void {
    this.correlationsSucceeded += 1;
  }

  recordCorrelationMissing(): void {
    this.correlationsMissing += 1;
  }

  recordTraceNotFound(): void {
    this.tracesNotFound += 1;
  }

  recordPersonalSignal(): void {
    this.personalSignalsProduced += 1;
  }

  recordInternalError(): void {
    this.internalErrors += 1;
  }

  snapshot(): OutcomeObservabilitySnapshot {
    return {
      eventsReceived: this.eventsReceived,
      eventsValid: this.eventsValid,
      eventsRejected: this.eventsRejected,
      correlationsSucceeded: this.correlationsSucceeded,
      correlationsMissing: this.correlationsMissing,
      tracesNotFound: this.tracesNotFound,
      personalSignalsProduced: this.personalSignalsProduced,
      internalErrors: this.internalErrors,
    };
  }

  reset(): void {
    this.eventsReceived = 0;
    this.eventsValid = 0;
    this.eventsRejected = 0;
    this.correlationsSucceeded = 0;
    this.correlationsMissing = 0;
    this.tracesNotFound = 0;
    this.personalSignalsProduced = 0;
    this.internalErrors = 0;
  }
}
