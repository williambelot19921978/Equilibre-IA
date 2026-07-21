/**
 * EPIC3-C — Session-scoped collaboration drafts (never auto-applied).
 */

import type {
  HouseholdPlanningCollaborationDraft,
  HouseholdTaskCollaborationDraft,
} from "../../types/householdCollaboration";

const TASK_DRAFT_KEY = "epic3c-household-task-draft";
const PLANNING_DRAFT_KEY = "epic3c-household-planning-draft";

function readJson<T>(key: string): T | null {
  if (typeof sessionStorage === "undefined") return null;

  const raw = sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function saveHouseholdTaskCollaborationDraft(
  draft: HouseholdTaskCollaborationDraft,
): void {
  writeJson(TASK_DRAFT_KEY, draft);
}

export function readHouseholdTaskCollaborationDraft(): HouseholdTaskCollaborationDraft | null {
  return readJson<HouseholdTaskCollaborationDraft>(TASK_DRAFT_KEY);
}

export function clearHouseholdTaskCollaborationDraft(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(TASK_DRAFT_KEY);
}

export function saveHouseholdPlanningCollaborationDraft(
  draft: HouseholdPlanningCollaborationDraft,
): void {
  writeJson(PLANNING_DRAFT_KEY, draft);
}

export function readHouseholdPlanningCollaborationDraft(): HouseholdPlanningCollaborationDraft | null {
  return readJson<HouseholdPlanningCollaborationDraft>(PLANNING_DRAFT_KEY);
}

export function clearHouseholdPlanningCollaborationDraft(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PLANNING_DRAFT_KEY);
}

export function clearHouseholdCollaborationDrafts(): void {
  clearHouseholdTaskCollaborationDraft();
  clearHouseholdPlanningCollaborationDraft();
}
