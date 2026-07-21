/**
 * AnonymizationGate — infrastructure (NOT engine #21).
 * Single path from observation to Universal Learning.
 */

import type { ContractVersion, Result } from '../common/primitives.ts';
import type { ConsentScope, CohortThreshold } from '../common/consent.ts';
import type { AnonymizedCandidate, GatePassedUniversalSignal } from './universal-signal.ts';
import type { PersonalSignal } from './personal-signal.ts';

export const ANONYMIZATION_GATE_CONTRACT_VERSION = '1.0.0' as ContractVersion;

export type PiiDetectionResult = {
  readonly detected: boolean;
  readonly categories: readonly string[];
  readonly rejectedFields: readonly string[];
};

export type GateAuditRecord = {
  readonly auditId: string;
  readonly processedAt: string;
  readonly candidateCount: number;
  readonly passedCount: number;
  readonly rejectedCount: number;
  readonly consentScopes: readonly ConsentScope[];
};

export type AnonymizationGateConfig = {
  readonly minCohortSize: CohortThreshold;
  readonly defaultReject: true;
  readonly retentionDays: number;
};

export type GateRejectionReason =
  | 'pii_detected'
  | 'cohort_too_small'
  | 'rarity_threshold'
  | 'consent_missing'
  | 'not_generalizable'
  | 'sensitive_category';

export type GateResult = Result<GatePassedUniversalSignal, { reason: GateRejectionReason; audit: GateAuditRecord }>;

/**
 * Infrastructure interface — not a brain engine.
 * No moteur may bypass this gate to write Universal Learning.
 */
export type IAnonymizationGate = {
  readonly contractVersion: ContractVersion;

  /** Reject by default — explicit pass only */
  processCandidate(candidate: AnonymizedCandidate): GateResult;

  /** Structural rejection — PersonalSignal must NOT compile as input (use separate param types) */
  rejectPersonalSignal(signal: PersonalSignal): { rejected: true; reason: GateRejectionReason };

  detectPii(payload: unknown): PiiDetectionResult;

  auditTrail(since: string): readonly GateAuditRecord[];
};

/** Type-level: block accidental Personal → Gate → ULE without candidate transformation */
export type GateInput = AnonymizedCandidate;
export type GateOutput = GatePassedUniversalSignal;
