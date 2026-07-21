/**
 * EPIC 6E — Confirmation Engine — never auto-validates.
 */

import type { ConfirmationProposal, LifeKnowledgeItem } from "../types/lifeKnowledgeTypes";
import { CONFIRMATION_THRESHOLD } from "../types/lifeKnowledgeTypes";
import {
  getNeverConfirmIds,
  getStoredConfirmations,
  saveConfirmationProposal,
} from "../store/knowledgeStore";

export function buildConfirmationMessage(item: LifeKnowledgeItem): string {
  return `J'ai remarqué que ${item.label.toLowerCase()} : « ${item.value} ». Souhaites-tu que je retienne cette préférence ?`;
}

export function shouldProposeConfirmation(item: LifeKnowledgeItem, neverIds: readonly string[]): boolean {
  if (neverIds.includes(item.id)) return false;
  if (item.status === "confirmed" || item.status === "forgotten" || item.status === "rejected") {
    return false;
  }
  return item.source === "observed" && item.confidence >= CONFIRMATION_THRESHOLD;
}

export function generateConfirmationProposals(
  userId: string,
  items: readonly LifeKnowledgeItem[],
): ConfirmationProposal[] {
  const neverIds = getNeverConfirmIds(userId);
  const existing = getStoredConfirmations(userId);
  const pendingIds = new Set(
    existing.filter((item) => item.status === "pending" || item.status === "deferred").map((i) => i.knowledgeId),
  );

  const proposals: ConfirmationProposal[] = [];

  for (const item of items) {
    if (!shouldProposeConfirmation(item, neverIds)) continue;
    if (pendingIds.has(item.id)) {
      const stored = existing.find((entry) => entry.knowledgeId === item.id);
      if (stored) proposals.push(stored);
      continue;
    }

    const proposal: ConfirmationProposal = {
      id: `confirm-${item.id}`,
      knowledgeId: item.id,
      message: buildConfirmationMessage(item),
      observation: item.value,
      confidence: item.confidence,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    saveConfirmationProposal(userId, proposal);
    proposals.push(proposal);
  }

  return proposals.slice(0, 5);
}

export function acceptConfirmation(userId: string, proposalId: string): void {
  const proposals = getStoredConfirmations(userId);
  const proposal = proposals.find((item) => item.id === proposalId);
  if (!proposal) return;
  saveConfirmationProposal(userId, { ...proposal, status: "accepted" });
}
