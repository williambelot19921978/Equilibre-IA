/**
 * EPIC 7A — Onboarding UX progress (localStorage, no hidden data).
 */

const PREFIX = "onboarding-progress-";

export type OnboardingUxProgress = {
  welcomeSeen: boolean;
  introSeen: boolean;
  childrenStepDone: boolean;
  profileBasicsDone: boolean;
  checkinChoiceDone: boolean;
  goalsStepDone: boolean;
};

const DEFAULT: OnboardingUxProgress = {
  welcomeSeen: false,
  introSeen: false,
  childrenStepDone: false,
  profileBasicsDone: false,
  checkinChoiceDone: false,
  goalsStepDone: false,
};

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function getOnboardingUxProgress(userId: string): OnboardingUxProgress {
  if (typeof localStorage === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<OnboardingUxProgress>) };
  } catch {
    return { ...DEFAULT };
  }
}

export function patchOnboardingUxProgress(
  userId: string,
  patch: Partial<OnboardingUxProgress>,
): OnboardingUxProgress {
  const next = { ...getOnboardingUxProgress(userId), ...patch };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key(userId), JSON.stringify(next));
  }
  return next;
}

export function resetOnboardingUxProgress(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key(userId));
}

/** Total onboarding steps for progress stepper (excluding welcome/intro which are pre-steps). */
export const ONBOARDING_FLOW_STEPS = [
  "Foyer",
  "Enfants",
  "Profil",
  "Check-in",
  "Priorité",
  "Objectifs",
  "Découverte",
] as const;

export function resolveOnboardingStepIndex(resolvedRoute: string): number {
  const map: Record<string, number> = {
    "/onboarding/household": 1,
    "/onboarding/children": 2,
    "/onboarding/profile": 3,
    "/onboarding/check-in": 4,
    "/onboarding/priority": 5,
    "/onboarding/goals": 6,
    "/discovery": 7,
  };
  return map[resolvedRoute] ?? 0;
}
