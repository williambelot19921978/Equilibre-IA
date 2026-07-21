import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  asCorrelationId,
  asEventId,
  asHouseholdId,
  asMemberId,
  asOutcomeId,
  asProposalId,
  asTraceId,
} from "../../contracts/common/ids.ts";
import { OUTCOME_EVENT_SCHEMA_VERSION } from "../../contracts/events/outcome-events.ts";
import { isPersonalSignal } from "../../contracts/privacy/personal-signal.ts";
import { InMemoryProposalTraceStore } from "../../traces/inMemoryProposalTraceStore.ts";
import { InMemoryPersonalSignalSink } from "../../outcome/personalSignalSink.ts";
import { CorrelationRegistry } from "../../outcome/correlationRegistry.ts";
import {
  createContractOutcomeObservationEngine,
  type ContractOutcomeObservationEngine,
} from "./outcomeObservationEngine.ts";
import { OutcomeObservability } from "./outcomeObservability.ts";
import { getOutcomeSemantics } from "./outcomeSemantics.ts";

const MEMBER = asMemberId("member-1");
const HOUSEHOLD = asHouseholdId("household-1");
const PROPOSAL = asProposalId("proposal-1");
const TRACE = asTraceId("trace-1");
const CORRELATION = asCorrelationId("corr-1");

function buildEvent(
  type: Parameters<ContractOutcomeObservationEngine["recordOutcome"]>[0]["type"],
  overrides: Partial<{
    proposalId: string;
    traceId: string;
    correlationId: string;
    taskId: string;
    calendarItemId: string;
    memberId: string;
  }> = {},
) {
  const occurredAt = new Date().toISOString();
  return {
    schemaVersion: OUTCOME_EVENT_SCHEMA_VERSION,
    eventId: asEventId(`evt-${type}-${Math.random().toString(36).slice(2, 8)}`),
    type,
    occurredAt,
    provenance: {
      sourceEngineId: "test",
      emittedAt: occurredAt,
      memberId: asMemberId(overrides.memberId ?? String(MEMBER)),
      householdId: HOUSEHOLD,
      consentScopes: ["personal_memory"] as const,
    },
    payload: {
      proposalId: overrides.proposalId
        ? asProposalId(overrides.proposalId)
        : PROPOSAL,
      traceId: overrides.traceId ? asTraceId(overrides.traceId) : TRACE,
      correlationId: overrides.correlationId
        ? asCorrelationId(overrides.correlationId)
        : CORRELATION,
      memberId: asMemberId(overrides.memberId ?? String(MEMBER)),
      valence: "neutral" as const,
      metadata: {
        householdId: String(HOUSEHOLD),
        ...(overrides.taskId ? { taskId: overrides.taskId } : {}),
        ...(overrides.calendarItemId
          ? { calendarItemId: overrides.calendarItemId }
          : {}),
      },
    },
  };
}

describe("ContractOutcomeObservationEngine — Sprint A4", () => {
  let engine: ContractOutcomeObservationEngine;
  let traceStore: InMemoryProposalTraceStore;
  let signalSink: InMemoryPersonalSignalSink;
  let correlationRegistry: CorrelationRegistry;
  let observability: OutcomeObservability;

  beforeEach(() => {
    traceStore = new InMemoryProposalTraceStore();
    signalSink = new InMemoryPersonalSignalSink();
    correlationRegistry = new CorrelationRegistry();
    observability = new OutcomeObservability();
    engine = createContractOutcomeObservationEngine({
      traceStore,
      signalSink,
      correlationRegistry,
      observability,
    });
  });

  it("1. proposal.presented creates or enriches a trace", () => {
    const result = engine.recordOutcome(
      buildEvent("proposal.presented", { proposalId: "prop-new", traceId: "trace-new", correlationId: "corr-new" }),
    );

    expect(result.ok).toBe(true);
    const summaries = traceStore.listTraceSummaries();
    expect(summaries.some((item) => item.proposalId === "prop-new")).toBe(true);
    expect(observability.snapshot().personalSignalsProduced).toBeGreaterThan(0);
  });

  it("2. proposal.accepted is correlated", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    const accepted = engine.recordOutcome(buildEvent("proposal.accepted"));

    expect(accepted.ok).toBe(true);
    const trace = traceStore.getById(TRACE);
    expect(trace?.status).toBe("accepted");
    expect(observability.snapshot().correlationsSucceeded).toBeGreaterThan(0);
  });

  it("3. proposal.rejected is correlated", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    engine.recordOutcome(buildEvent("proposal.rejected"));

    const trace = traceStore.getById(TRACE);
    expect(trace?.status).toBe("rejected");
  });

  it("4. proposal.dismissed remains distinct from rejection", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    engine.recordOutcome(buildEvent("proposal.dismissed"));

    const trace = traceStore.getById(TRACE);
    expect(trace?.status).toBe("closed");
    expect(trace?.status).not.toBe("rejected");

    const dismissSemantics = getOutcomeSemantics("proposal.dismissed");
    expect(dismissSemantics.notMeaning).toContain("Rejet explicite");
  });

  it("5. task.completed does not claim causality", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    engine.recordOutcome(buildEvent("task.completed", { taskId: "task-1" }));

    const semantics = getOutcomeSemantics("task.completed");
    expect(semantics.notMeaning.some((line) => line.includes("efficace"))).toBe(
      true,
    );

    const correlate = engine.correlate(PROPOSAL, {
      outcomeId: asOutcomeId("out-1"),
      observedAt: new Date().toISOString(),
      valence: "neutral",
    });
    expect(correlate.ok).toBe(true);
    if (correlate.ok) {
      expect(correlate.value.causalClaim).toBe(false);
    }
  });

  it("6. task.skipped is not interpreted as failure", () => {
    const semantics = getOutcomeSemantics("task.skipped");
    expect(semantics.interpretationLimits).toContain("skip_not_failure");
  });

  it("7. task.rescheduled is interpreted without judgment", () => {
    const semantics = getOutcomeSemantics("task.rescheduled");
    expect(semantics.interpretationLimits).toContain("reschedule_not_failure");
  });

  it("8. user.reported_helpful produces explicit positive signal", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    engine.recordOutcome(buildEvent("user.reported_helpful"));

    const signals = signalSink.listForMember(MEMBER);
    expect(
      signals.some((signal) =>
        signal.signalType.includes("user.reported_helpful"),
      ),
    ).toBe(true);
  });

  it("9. user.reported_unhelpful produces explicit negative signal", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    engine.recordOutcome(buildEvent("user.reported_unhelpful"));

    const signals = signalSink.listForMember(MEMBER);
    expect(
      signals.some((signal) =>
        signal.signalType.includes("user.reported_unhelpful"),
      ),
    ).toBe(true);
  });

  it("10. event without trace produces controlled missing correlation", () => {
    const result = engine.recordOutcome(
      buildEvent("task.completed", {
        proposalId: "missing-prop",
        traceId: "missing-trace",
        taskId: "orphan-task",
      }),
    );

    expect(result.ok).toBe(true);
    expect(observability.snapshot().correlationsMissing).toBeGreaterThan(0);
  });

  it("11. invalid event is rejected", () => {
    const invalid = buildEvent("proposal.presented");
    const result = engine.recordOutcome({
      ...invalid,
      schemaVersion: "9.9.9" as typeof OUTCOME_EVENT_SCHEMA_VERSION,
    });

    expect(result.ok).toBe(false);
    expect(observability.snapshot().eventsRejected).toBe(1);
  });

  it("14. no UniversalSignal can be produced", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    engine.recordOutcome(buildEvent("proposal.accepted"));

    const candidates = engine.emitAnonymizedCandidates({
      batchId: "batch-1",
      from: "2026-01-01",
      to: "2026-12-31",
    });

    expect(candidates).toEqual([]);
  });

  it("17. PersonalSignal respects Dual Memory typing", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    const signal = signalSink.listForMember(MEMBER)[0];
    expect(isPersonalSignal(signal)).toBe(true);
    expect(signal.route).toBe("personal_only");
    expect(signal.__memoryTier).toBe("personal");
  });

  it("18. retention and consent are propagated on trace", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    const trace = traceStore.getById(TRACE);
    expect(trace?.retention.ttlDays).toBeGreaterThan(0);
    expect(trace?.consentScopes).toContain("personal_memory");
  });

  it("classifyRoute returns personal_only", () => {
    expect(engine.classifyRoute(buildEvent("proposal.presented"))).toBe(
      "personal_only",
    );
  });

  it("repository supports deletion by traceId and memberId", () => {
    engine.recordOutcome(buildEvent("proposal.presented"));
    expect(traceStore.deleteByTraceId(TRACE)).toBe(true);
    expect(traceStore.getById(TRACE)).toBeNull();

    engine.recordOutcome(
      buildEvent("proposal.presented", {
        proposalId: "prop-2",
        traceId: "trace-2",
        correlationId: "corr-2",
      }),
    );
    expect(traceStore.deleteByMemberId(MEMBER)).toBe(1);
  });
});

describe("OutcomeObservationEngine — invariants", () => {
  it("does not import UniversalLearningEngine or planning execution", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(process.cwd(), "src/ai/engines/outcome");
    const forbidden =
      /from\s+['"].*\/(universal-learning|planningEngine|nlpActionService)/;

    function walk(dir: string): string[] {
      return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return walk(full);
        if (entry.endsWith(".ts")) return [full];
        return [];
      });
    }

    const violations = walk(root).filter((file) =>
      forbidden.test(readFileSync(file, "utf8")),
    );
    expect(violations).toEqual([]);
  });
});
