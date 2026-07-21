/**
 * EPIC 6A — Preference proposal store (localStorage).
 */

import type { PreferenceProposal, PreferenceValidationState } from "../types/adaptiveTypes";

const STORAGE_PREFIX = "adaptive-preferences-";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): PreferenceProposal[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as PreferenceProposal[];
  } catch {
    return [];
  }
}

function write(userId: string, proposals: PreferenceProposal[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(proposals.slice(0, 100)));
}

export function getAllPreferences(userId: string): PreferenceProposal[] {
  return read(userId);
}

export function getValidatedPreferences(userId: string): PreferenceProposal[] {
  return read(userId).filter((pref) => pref.status === "accepted");
}

export function getPendingProposals(userId: string): PreferenceProposal[] {
  return read(userId).filter((pref) => pref.status === "pending");
}

export function upsertProposal(userId: string, proposal: PreferenceProposal): void {
  const list = read(userId);
  const index = list.findIndex((item) => item.id === proposal.id);
  if (index >= 0) {
    list[index] = proposal;
  } else {
    list.unshift(proposal);
  }
  write(userId, list);
}

export function updateProposalStatus(
  userId: string,
  proposalId: string,
  status: PreferenceValidationState,
): PreferenceProposal | null {
  const list = read(userId);
  const index = list.findIndex((item) => item.id === proposalId);
  if (index < 0) return null;

  const updated: PreferenceProposal = {
    ...list[index]!,
    status,
    updatedAt: new Date().toISOString(),
    validatedAt: status === "accepted" || status === "rejected" ? new Date().toISOString() : undefined,
  };
  list[index] = updated;
  write(userId, list);
  return updated;
}

export function acceptPreference(userId: string, proposalId: string): PreferenceProposal | null {
  return updateProposalStatus(userId, proposalId, "accepted");
}

export function rejectPreference(userId: string, proposalId: string): PreferenceProposal | null {
  return updateProposalStatus(userId, proposalId, "rejected");
}

export function clearPreferences(userId: string): void {
  write(userId, []);
}
