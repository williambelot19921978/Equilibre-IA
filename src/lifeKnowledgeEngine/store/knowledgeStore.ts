/**
 * EPIC 6E — Life Knowledge store (localStorage).
 * User control: forget, modify, confirm, timeline.
 */

import type {
  ConfirmationChoice,
  ConfirmationProposal,
  LifeKnowledgeItem,
  LifeTimelineEvent,
} from "../types/lifeKnowledgeTypes";

const FORGOTTEN_PREFIX = "life-knowledge-forgotten-";
const OVERRIDE_PREFIX = "life-knowledge-override-";
const CONFIRMATION_PREFIX = "life-knowledge-confirmations-";
const TIMELINE_PREFIX = "life-knowledge-timeline-";
const NEVER_PREFIX = "life-knowledge-never-";

function forgottenKey(userId: string): string {
  return `${FORGOTTEN_PREFIX}${userId}`;
}

function overrideKey(userId: string): string {
  return `${OVERRIDE_PREFIX}${userId}`;
}

function confirmationKey(userId: string): string {
  return `${CONFIRMATION_PREFIX}${userId}`;
}

function timelineKey(userId: string): string {
  return `${TIMELINE_PREFIX}${userId}`;
}

function neverKey(userId: string): string {
  return `${NEVER_PREFIX}${userId}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getForgottenIds(userId: string): string[] {
  return readJson(forgottenKey(userId), []);
}

export function forgetKnowledge(userId: string, knowledgeId: string): void {
  const forgotten = new Set(getForgottenIds(userId));
  forgotten.add(knowledgeId);
  writeJson(forgottenKey(userId), [...forgotten].slice(0, 500));
}

export function restoreKnowledge(userId: string, knowledgeId: string): void {
  writeJson(
    forgottenKey(userId),
    getForgottenIds(userId).filter((id) => id !== knowledgeId),
  );
}

export function getKnowledgeOverrides(userId: string): Record<string, Partial<LifeKnowledgeItem>> {
  return readJson(overrideKey(userId), {});
}

export function modifyKnowledge(
  userId: string,
  knowledgeId: string,
  patch: Partial<Pick<LifeKnowledgeItem, "label" | "value">>,
): void {
  const overrides = getKnowledgeOverrides(userId);
  overrides[knowledgeId] = {
    ...overrides[knowledgeId],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJson(overrideKey(userId), overrides);
}

export function resetKnowledge(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(forgottenKey(userId));
  localStorage.removeItem(overrideKey(userId));
  localStorage.removeItem(confirmationKey(userId));
  localStorage.removeItem(timelineKey(userId));
  localStorage.removeItem(neverKey(userId));
}

export function getNeverConfirmIds(userId: string): string[] {
  return readJson(neverKey(userId), []);
}

export function recordNeverConfirm(userId: string, knowledgeId: string): void {
  const never = new Set(getNeverConfirmIds(userId));
  never.add(knowledgeId);
  writeJson(neverKey(userId), [...never].slice(0, 200));
}

export function getStoredConfirmations(userId: string): ConfirmationProposal[] {
  return readJson(confirmationKey(userId), []);
}

export function saveConfirmationProposal(userId: string, proposal: ConfirmationProposal): void {
  const existing = getStoredConfirmations(userId).filter((item) => item.id !== proposal.id);
  writeJson(confirmationKey(userId), [proposal, ...existing].slice(0, 50));
}

export function updateConfirmationStatus(
  userId: string,
  proposalId: string,
  status: ConfirmationProposal["status"],
): void {
  const updated = getStoredConfirmations(userId).map((item) =>
    item.id === proposalId ? { ...item, status } : item,
  );
  writeJson(confirmationKey(userId), updated);
}

export function getTimelineEvents(userId: string): LifeTimelineEvent[] {
  return readJson<LifeTimelineEvent[]>(timelineKey(userId), []).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function addTimelineEvent(userId: string, event: LifeTimelineEvent): void {
  const events = getTimelineEvents(userId).filter((item) => item.id !== event.id);
  writeJson(timelineKey(userId), [event, ...events].slice(0, 100));
}

export function clearKnowledgeStore(userId: string): void {
  resetKnowledge(userId);
}

export function applyUserControls(
  userId: string,
  items: readonly LifeKnowledgeItem[],
): LifeKnowledgeItem[] {
  const forgotten = new Set(getForgottenIds(userId));
  const overrides = getKnowledgeOverrides(userId);

  return items
    .filter((item) => !forgotten.has(item.id))
    .map((item) => {
      const override = overrides[item.id];
      if (!override) return item;
      return {
        ...item,
        label: override.label ?? item.label,
        value: override.value ?? item.value,
        updatedAt: override.updatedAt ?? item.updatedAt,
      };
    });
}

export function recordConfirmationChoice(
  userId: string,
  proposalId: string,
  choice: ConfirmationChoice,
): ConfirmationProposal | null {
  const proposal = getStoredConfirmations(userId).find((item) => item.id === proposalId);
  if (!proposal) return null;

  const statusMap: Record<ConfirmationChoice, ConfirmationProposal["status"]> = {
    yes: "accepted",
    no: "rejected",
    later: "deferred",
    never: "never",
  };

  const status = statusMap[choice];
  updateConfirmationStatus(userId, proposalId, status);

  if (choice === "never") {
    recordNeverConfirm(userId, proposal.knowledgeId);
  }

  return { ...proposal, status };
}
