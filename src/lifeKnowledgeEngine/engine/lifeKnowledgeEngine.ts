/**
 * EPIC 6E — Life Knowledge Engine orchestrator.
 * Read-only consumer — never modifies upstream engines silently.
 */

import type { LifeKnowledgeInput, LifeKnowledgeSnapshot } from "../types/lifeKnowledgeTypes";
import { mergeKnowledgeFromSources } from "../merge/knowledgeMergeEngine";
import { generateConfirmationProposals } from "../confirmation/confirmationEngine";
import { buildTimelineFromInput } from "../timeline/lifeTimelineEngine";
import { filterVisibleKnowledge } from "../forget/forgetEngine";
import { buildKnowledgePhrasingHints } from "../phrasing/knowledgePhrasing";
import { getConfirmedKnowledge } from "../guards/knowledgeGuards";
import { getStoredConfirmations } from "../store/knowledgeStore";

export class LifeKnowledgeEngine {
  analyze(input: LifeKnowledgeInput): LifeKnowledgeSnapshot {
    const now = input.now ?? new Date().toISOString();
    const merged = mergeKnowledgeFromSources(input);
    const visibleItems = filterVisibleKnowledge(input.userId, merged);
    const pendingConfirmations = generateConfirmationProposals(input.userId, visibleItems);
    const timeline = buildTimelineFromInput(input);
    const confirmed = getConfirmedKnowledge(visibleItems);
    const phrasingHints = buildKnowledgePhrasingHints(visibleItems);

    const acceptedConfirmations = getStoredConfirmations(input.userId).filter(
      (item) => item.status === "accepted",
    );

    const itemsWithConfirmations = visibleItems.map((item) => {
      const accepted = acceptedConfirmations.some((proposal) => proposal.knowledgeId === item.id);
      if (accepted && item.status === "pending_confirmation") {
        return {
          ...item,
          status: "confirmed" as const,
          source: "user_confirmed" as const,
          lastVerifiedAt: now,
        };
      }
      return item;
    });

    return {
      enabled: true,
      date: input.date,
      items: itemsWithConfirmations,
      visibleItems: itemsWithConfirmations,
      pendingConfirmations,
      timeline,
      phrasingHints,
      knowledgeCount: itemsWithConfirmations.length,
      confirmedCount: confirmed.length,
      generatedAt: now,
    };
  }
}

export const defaultLifeKnowledgeEngine = new LifeKnowledgeEngine();

export function createEmptyLifeKnowledgeSnapshot(date: string): LifeKnowledgeSnapshot {
  return {
    enabled: false,
    date,
    items: [],
    visibleItems: [],
    pendingConfirmations: [],
    timeline: [],
    phrasingHints: [],
    knowledgeCount: 0,
    confirmedCount: 0,
    generatedAt: new Date().toISOString(),
  };
}
