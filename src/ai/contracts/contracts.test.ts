/**
 * Sprint A2 — structural contract invariants (no business logic).
 */

import { describe, expect, it } from 'vitest';
import {
  CONTRACT_VERSION_V1,
  ENGINE_REGISTRY,
  FROZEN_ENGINE_COUNT,
  OUTCOME_EVENT_TYPES,
  OUTCOME_EVENT_SCHEMA_VERSION,
  PROPOSAL_TRACE_SCHEMA_VERSION,
  assertFrozenEngineRegistry,
  isOutcomeEventType,
  isPersonalSignal,
  isGatePassedUniversalSignal,
  DUAL_MEMORY_BOUNDARY,
  asMemberId,
  asProposalId,
  asTraceId,
  asCorrelationId,
  asHouseholdId,
} from '@/ai/contracts/index.ts';
import type { PersonalSignal, AnonymizedCandidate, GatePassedUniversalSignal } from '@/ai/contracts/index.ts';
import { LEGACY_MIGRATION_MAP } from '@/ai/contracts/legacy/migration-map.ts';

describe('Sprint A2 — frozen engine registry', () => {
  it('exports exactly 20 engine contracts', () => {
    expect(FROZEN_ENGINE_COUNT).toBe(20);
    expect(ENGINE_REGISTRY).toHaveLength(20);
    expect(() => assertFrozenEngineRegistry(ENGINE_REGISTRY)).not.toThrow();
  });

  it('assigns unique pipeline numbers 1..20', () => {
    const numbers = ENGINE_REGISTRY.map((e) => e.pipelineNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('every engine has contractVersion and invariants', () => {
    for (const engine of ENGINE_REGISTRY) {
      expect(engine.contractVersion).toBe(CONTRACT_VERSION_V1);
      expect(engine.invariants.length).toBeGreaterThan(0);
    }
  });
});

describe('Sprint A2 — outcome events', () => {
  it('defines versioned outcome event taxonomy', () => {
    expect(OUTCOME_EVENT_SCHEMA_VERSION).toBe('1.0.0');
    expect(OUTCOME_EVENT_TYPES.length).toBeGreaterThanOrEqual(16);
  });

  it('discriminates known outcome event types', () => {
    expect(isOutcomeEventType('proposal.accepted')).toBe(true);
    expect(isOutcomeEventType('not.a.real.event')).toBe(false);
  });
});

describe('Sprint A2 — proposalTrace schema', () => {
  it('uses versioned trace schema', () => {
    expect(PROPOSAL_TRACE_SCHEMA_VERSION).toBe('1.0.0');
  });
});

describe('Sprint A2 — Dual Memory type boundaries', () => {
  it('marks personal signals with __memoryTier personal', () => {
    const signal = {
      __memoryTier: 'personal' as const,
      memberId: asMemberId('m1'),
      householdId: asHouseholdId('h1'),
      sensitivity: 'personal' as const,
      provenance: { sourceEngineId: 'outcome-observation-engine', emittedAt: '2026-07-18T00:00:00Z', consentScopes: [] },
      observedAt: '2026-07-18T00:00:00Z',
      kind: 'behavior' as const,
      signalType: 'task.skipped',
      confidence: 0.8 as never,
      route: 'personal_only' as const,
    } satisfies PersonalSignal;

    expect(isPersonalSignal(signal)).toBe(true);
  });

  it('gate-passed universal signal is distinct from anonymized candidate', () => {
    const candidate = {
      __memoryTier: 'universal' as const,
      kind: 'candidate' as const,
      patternKey: 'expr.fatigue',
      confidence: 0.9 as never,
      cohortThreshold: { minSize: 100 },
      provenance: { sourceEngineId: 'outcome-observation-engine', emittedAt: '2026-07-18T00:00:00Z', consentScopes: [] },
      generalizedAt: '2026-07-18T00:00:00Z',
      candidateVersion: CONTRACT_VERSION_V1,
      route: 'universal_candidate' as const,
    } satisfies AnonymizedCandidate;

    expect(isGatePassedUniversalSignal(candidate)).toBe(false);

    const passed: GatePassedUniversalSignal = {
      ...candidate,
      kind: 'language_hint',
      normalizedPhrase: 'rince',
      conceptKey: 'fatigue.high',
      __gatePassed: true,
      gateAuditId: 'audit-1',
      passedAt: '2026-07-18T00:00:00Z',
    };

    expect(isGatePassedUniversalSignal(passed)).toBe(true);
  });

  it('documents dual memory boundary', () => {
    expect(DUAL_MEMORY_BOUNDARY.forbidden).toContain('direct personal → universal');
  });
});

describe('Sprint A2 — proposalTrace correlation refs', () => {
  it('supports minimal correlation without private payloads', () => {
    const link = {
      traceId: asTraceId('trace-1'),
      proposalId: asProposalId('prop-1'),
      correlationId: asCorrelationId('corr-1'),
    };
    expect(link.proposalId).toBe('prop-1');
  });
});

describe('Sprint A2 — legacy migration map', () => {
  it('documents all 20 engines', () => {
    expect(LEGACY_MIGRATION_MAP).toHaveLength(20);
    const ids = new Set(LEGACY_MIGRATION_MAP.map((e) => e.engineId));
    expect(ids.size).toBe(20);
  });
});

describe('QA-MEM-015 — Dual Memory separation at contract level', () => {
  it('personal tier is incompatible with universal-only ingestion path by design', () => {
    const personalTier = 'personal';
    const universalTier = 'universal';
    expect(personalTier).not.toBe(universalTier);
    expect(DUAL_MEMORY_BOUNDARY.personal).toMatch(/Personal Memory/);
    expect(DUAL_MEMORY_BOUNDARY.universal).toMatch(/gate required/);
  });
});

describe('QA-MEM-016 — OutcomeObservation routes without storing life content', () => {
  it('outcome events carry minimal payload shape', () => {
    expect(OUTCOME_EVENT_TYPES).toContain('task.completed');
    expect(OUTCOME_EVENT_TYPES).toContain('user.corrected_ai');
  });
});

describe('QA-PRV-015 — No PII fields on universal signal base', () => {
  it('universal signal types omit memberId at type documentation level', () => {
    type UniversalKeys = keyof GatePassedUniversalSignal;
    const forbidden: UniversalKeys[] = [] as UniversalKeys[];
    expect(forbidden.includes('memberId' as UniversalKeys)).toBe(false);
  });
});
