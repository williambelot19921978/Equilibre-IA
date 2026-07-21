/**
 * EPIC 6A — Memory Consolidation Engine (architecture only).
 */

import type { BehaviorObservation, PreferenceProposal } from "../types/adaptiveTypes";

export type ConsolidationConfig = {
  readonly enabled: boolean;
  readonly intervalHours: number;
  readonly minConfidenceThreshold: number;
  readonly archiveAfterDays: number;
};

export const DEFAULT_CONSOLIDATION_CONFIG: ConsolidationConfig = {
  enabled: false,
  intervalHours: 24,
  minConfidenceThreshold: 0.25,
  archiveAfterDays: 90,
};

export type ConsolidationResult = {
  readonly mergedCount: number;
  readonly removedWeakObservations: number;
  readonly decayedPreferences: number;
  readonly archivedCount: number;
  readonly architectureOnly: true;
};

export class MemoryConsolidationEngine {
  private config: ConsolidationConfig = DEFAULT_CONSOLIDATION_CONFIG;

  configure(config: Partial<ConsolidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ConsolidationConfig {
    return this.config;
  }

  /** Architecture — no automatic execution in EPIC 6A. */
  planConsolidation(input: {
    observations: readonly BehaviorObservation[];
    preferences: readonly PreferenceProposal[];
  }): ConsolidationResult {
    const weakObs = input.observations.filter((obs) => obs.confidence < this.config.minConfidenceThreshold);
    const obsoletePrefs = input.preferences.filter((pref) => pref.status === "obsolete");

    return {
      mergedCount: 0,
      removedWeakObservations: weakObs.length,
      decayedPreferences: input.preferences.filter((pref) => pref.status === "pending").length,
      archivedCount: obsoletePrefs.length,
      architectureOnly: true,
    };
  }
}

export const defaultMemoryConsolidationEngine = new MemoryConsolidationEngine();
