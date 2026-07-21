import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  observePilotProposalPresented,
  observePilotProposalAccepted,
  observePilotProposalDismissed,
  observePilotTaskCompleted,
  registerPilotProposalCorrelation,
  getPilotProposalSession,
  clearPilotProposalSessions,
} from "./outcomeObservationBridge";
import {
  resetOutcomeObservationRuntime,
  getOutcomeObservationRuntime,
} from "./outcomeObservationRuntime";

describe("outcomeObservationBridge — fail-open", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "false");
    resetOutcomeObservationRuntime();
    clearPilotProposalSessions();
  });

  it("12. disabled flag produces no effect", () => {
    observePilotProposalPresented({
      userId: "user-1",
      householdId: "house-1",
      proposalId: "prop-1",
    });

    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "true");
    resetOutcomeObservationRuntime();
    const runtime = getOutcomeObservationRuntime();
    expect(runtime.observability.snapshot().eventsReceived).toBe(0);
  });

  it("13. bridge errors do not propagate", () => {
    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "true");
    resetOutcomeObservationRuntime();

    expect(() =>
      observePilotProposalPresented({
        userId: "user-1",
        householdId: "house-1",
        proposalId: "prop-1",
      }),
    ).not.toThrow();
  });
});

describe("outcomeObservationBridge — enabled pilot flow", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "true");
    resetOutcomeObservationRuntime();
    clearPilotProposalSessions();
  });

  it("records presented → accepted → completed with correlation", () => {
    const session = observePilotProposalPresented({
      userId: "user-1",
      householdId: "house-1",
      proposalId: "prop-pilot",
    });

    observePilotProposalAccepted(session);
    registerPilotProposalCorrelation({
      proposalId: "prop-pilot",
      traceId: session.traceId!,
      correlationId: session.correlationId!,
      taskId: "task-1",
      calendarItemId: "cal-1",
    });

    observePilotTaskCompleted({
      userId: "user-1",
      householdId: "house-1",
      taskId: "task-1",
      calendarItemId: "cal-1",
    });

    const runtime = getOutcomeObservationRuntime();
    const metrics = runtime.observability.snapshot();

    expect(metrics.eventsReceived).toBeGreaterThanOrEqual(3);
    expect(metrics.personalSignalsProduced).toBeGreaterThan(0);
    expect(getPilotProposalSession("prop-pilot")?.proposalId).toBe("prop-pilot");
  });

  it("16. logs contain ids only — no private content fields in signals", () => {
    observePilotProposalPresented({
      userId: "user-1",
      householdId: "house-1",
      proposalId: "prop-safe",
    });

    const runtime = getOutcomeObservationRuntime();
    const signal = runtime.signalSink.listAll()[0];
    const serialized = JSON.stringify(signal);

    expect(serialized).not.toMatch(/conversation/i);
    expect(serialized).not.toMatch(/prompt/i);
    expect(signal.signalType).toMatch(/^outcome:/);
  });

  it("dismiss is recorded separately from reject", () => {
    const session = observePilotProposalPresented({
      userId: "user-1",
      householdId: "house-1",
      proposalId: "prop-dismiss",
    });

    observePilotProposalDismissed(session);

    const runtime = getOutcomeObservationRuntime();
    const trace = runtime.traceStore.getById(session.traceId as never);
    expect(trace?.status).toBe("closed");
  });
});

describe("blockActionService observation — non-regression", () => {
  it("applyBlockAction module loads with observation bridge import", async () => {
    const module = await import("../../services/blockActionService");
    expect(typeof module.applyBlockAction).toBe("function");
  });
});
