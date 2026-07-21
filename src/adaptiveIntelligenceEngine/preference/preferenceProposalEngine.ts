/**
 * EPIC 6A — Preference Proposal Engine.
 * Transforme observations/habitudes en propositions — toujours pending jusqu'à validation.
 */

import type {
  BehaviorObservation,
  DetectedHabit,
  PreferenceProposal,
} from "../types/adaptiveTypes";
import { computeConfidence, periodDaysFromObservations } from "../confidence/confidenceEngine";
import { getAllPreferences, upsertProposal } from "./preferenceStore";

function formatProposalValue(habit: DetectedHabit): string {
  if (habit.preferredTime) {
    return habit.preferredTime;
  }
  return habit.label;
}

function proposalLabel(habit: DetectedHabit): string {
  switch (habit.kind) {
    case "sport":
      return `Sport préféré : ${formatProposalValue(habit)}`;
    case "sleep":
      return `Sommeil habituel : ${formatProposalValue(habit)}`;
    case "work":
      return `Travail habituel : ${formatProposalValue(habit)}`;
    case "study":
      return `Études préférées : ${formatProposalValue(habit)}`;
    default:
      return `${habit.label} : ${formatProposalValue(habit)}`;
  }
}

export function buildPreferenceProposals(input: {
  habits: readonly DetectedHabit[];
  observations: readonly BehaviorObservation[];
  existing: readonly PreferenceProposal[];
}): PreferenceProposal[] {
  const proposals: PreferenceProposal[] = [...input.existing];
  const periodDays = periodDaysFromObservations(input.observations);

  for (const habit of input.habits) {
    if (habit.score < 50 || habit.evolution === "abandoned") continue;

    const matchingObs = observationsForHabit(input.observations, habit);
    const { confidence, explainability } = computeConfidence({
      matchingObservations: matchingObs,
      totalObservations: input.observations.length,
      periodDays,
      why: `${habit.frequency} observation(s) sur ${periodDays} jour(s) — stabilité ${Math.round(habit.stability * 100)}%.`,
      label: habit.label,
    });

    const existingPending = proposals.find(
      (prop) => prop.habitId === habit.id && prop.status === "pending",
    );
    if (existingPending) continue;

    const existingAccepted = proposals.find(
      (prop) => prop.habitId === habit.id && prop.status === "accepted",
    );
    if (existingAccepted && existingAccepted.proposedValue === formatProposalValue(habit)) {
      continue;
    }

    const now = new Date().toISOString();
    proposals.unshift({
      id: `pref-${habit.id}-${Date.now()}`,
      kind: habit.kind,
      label: proposalLabel(habit),
      proposedValue: formatProposalValue(habit),
      status: "pending",
      confidence,
      explainability: {
        ...explainability,
        why: `${habit.frequency} occurrences sur ${Math.max(habit.frequency, periodDays)} périodes analysées.`,
        observationCount: matchingObs.length,
      },
      habitId: habit.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  return proposals;
}

function observationsForHabit(
  observations: readonly BehaviorObservation[],
  habit: DetectedHabit,
): BehaviorObservation[] {
  if (habit.observationIds.length > 0) {
    const idSet = new Set(habit.observationIds);
    return observations.filter((obs) => idSet.has(obs.id));
  }
  return observations.filter((obs) =>
    habit.kind === "sport"
      ? /sport/i.test(obs.label)
      : obs.label.toLowerCase().includes(habit.kind.replace("_", " ")),
  );
}

export function persistNewProposals(userId: string, proposals: readonly PreferenceProposal[]): void {
  const existing = getAllPreferences(userId);
  const existingIds = new Set(existing.map((prop) => prop.id));

  for (const proposal of proposals) {
    if (!existingIds.has(proposal.id) && proposal.status === "pending") {
      upsertProposal(userId, proposal);
    }
  }
}

export class PreferenceProposalEngine {
  propose(input: {
    userId: string;
    habits: readonly DetectedHabit[];
    observations: readonly BehaviorObservation[];
  }): PreferenceProposal[] {
    const existing = getAllPreferences(input.userId);
    const proposals = buildPreferenceProposals({
      habits: input.habits,
      observations: input.observations,
      existing,
    });
    persistNewProposals(input.userId, proposals);
    return proposals;
  }
}

export const defaultPreferenceProposalEngine = new PreferenceProposalEngine();
