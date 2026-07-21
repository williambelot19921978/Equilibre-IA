/**
 * EPIC 9 — Launch checklist (centralized beta readiness).
 */

export type ChecklistStatus = "pending" | "in_progress" | "done" | "blocked";
export type ChecklistPriority = "critical" | "high" | "medium" | "low";

export type LaunchChecklistItem = {
  readonly id: string;
  readonly label: string;
  readonly priority: ChecklistPriority;
  status: ChecklistStatus;
  owner: string;
  dueDate: string | null;
  comment: string;
};

const STORAGE_KEY = "aura-launch-checklist-v1";

export const DEFAULT_LAUNCH_CHECKLIST: LaunchChecklistItem[] = [
  { id: "build", label: "Build OK", priority: "critical", status: "pending", owner: "Tech", dueDate: null, comment: "" },
  { id: "tests", label: "Tests OK", priority: "critical", status: "pending", owner: "Tech", dueDate: null, comment: "" },
  { id: "pwa", label: "PWA OK", priority: "high", status: "pending", owner: "Mobile", dueDate: null, comment: "" },
  { id: "android", label: "Android OK", priority: "high", status: "pending", owner: "Mobile", dueDate: null, comment: "" },
  { id: "ios", label: "iOS OK", priority: "high", status: "pending", owner: "Mobile", dueDate: null, comment: "" },
  { id: "notifications", label: "Notifications OK", priority: "high", status: "pending", owner: "Product", dueDate: null, comment: "" },
  { id: "trust", label: "Trust Center validé", priority: "critical", status: "pending", owner: "Product", dueDate: null, comment: "" },
  { id: "analytics", label: "Analytics validés", priority: "high", status: "pending", owner: "Product", dueDate: null, comment: "" },
  { id: "backup", label: "Sauvegarde testée", priority: "medium", status: "pending", owner: "Tech", dueDate: null, comment: "" },
  { id: "rls", label: "RLS validées", priority: "critical", status: "pending", owner: "Tech", dueDate: null, comment: "" },
  { id: "performance", label: "Performance validée", priority: "high", status: "pending", owner: "Tech", dueDate: null, comment: "" },
  { id: "a11y", label: "Accessibilité validée", priority: "medium", status: "pending", owner: "Design", dueDate: null, comment: "" },
];

function readChecklist(): LaunchChecklistItem[] {
  if (typeof localStorage === "undefined") return DEFAULT_LAUNCH_CHECKLIST.map((item) => ({ ...item }));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAUNCH_CHECKLIST.map((item) => ({ ...item }));
    const stored = JSON.parse(raw) as LaunchChecklistItem[];
    const byId = new Map(stored.map((item) => [item.id, item]));
    return DEFAULT_LAUNCH_CHECKLIST.map((defaults) => ({
      ...defaults,
      ...byId.get(defaults.id),
    }));
  } catch {
    return DEFAULT_LAUNCH_CHECKLIST.map((item) => ({ ...item }));
  }
}

function writeChecklist(items: LaunchChecklistItem[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getLaunchChecklist(): LaunchChecklistItem[] {
  return readChecklist();
}

export function updateLaunchChecklistItem(
  id: string,
  patch: Partial<Pick<LaunchChecklistItem, "status" | "owner" | "dueDate" | "comment">>,
): LaunchChecklistItem[] {
  const next = readChecklist().map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
  writeChecklist(next);
  return next;
}

export function resetLaunchChecklist(): LaunchChecklistItem[] {
  writeChecklist(DEFAULT_LAUNCH_CHECKLIST.map((item) => ({ ...item })));
  return getLaunchChecklist();
}

export function getChecklistProgress(items: LaunchChecklistItem[] = getLaunchChecklist()): {
  done: number;
  total: number;
  percent: number;
} {
  const done = items.filter((item) => item.status === "done").length;
  const total = items.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}
