export {
  createOutcomeObservationRuntime,
  getOutcomeObservationRuntime,
  resetOutcomeObservationRuntime,
  isOutcomeObservationActive,
} from './outcomeObservationRuntime.ts';

export {
  observePilotProposalPresented,
  observePilotProposalAccepted,
  observePilotProposalRejected,
  observePilotProposalDismissed,
  observePilotTaskCompleted,
  observePilotTaskSkipped,
  observePilotTaskRescheduled,
  observePilotUserReportedHelpful,
  observePilotUserReportedUnhelpful,
  registerPilotProposalCorrelation,
  rememberPilotProposalSession,
  getPilotProposalSession,
  clearPilotProposalSessions,
  resolvePilotContextForEntry,
} from './outcomeObservationBridge.ts';

export type {
  PilotProposalContext,
  PilotTaskContext,
} from './outcomeObservationBridge.ts';

export { InMemoryPersonalSignalSink, type IPersonalSignalSink } from './personalSignalSink.ts';
export { CorrelationRegistry } from './correlationRegistry.ts';
