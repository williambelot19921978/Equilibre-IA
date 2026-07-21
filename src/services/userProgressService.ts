import { getChildrenByHousehold } from "./childrenService";
import { getHouseholdMembership } from "./householdService";
import { getProfileFacts } from "./profileFactsService";
import { getUserProfile } from "./profileService";
import {
  isBaseProfileComplete,
  isDiscoveryComplete,
} from "../lib/navigation/progressChecks";
import type { UserProgressState } from "../lib/navigation/types";
import { EMPTY_USER_PROGRESS } from "../lib/navigation/types";
import { getOnboardingUxProgress } from "../lib/onboarding/onboardingProgressStore";

export async function loadUserProgress(
  userId: string,
): Promise<UserProgressState> {
  const [membership, userProfile, facts] = await Promise.all([
    getHouseholdMembership(userId),
    getUserProfile(userId),
    getProfileFacts(userId),
  ]);

  let childrenCount = 0;

  if (membership) {
    const children = await getChildrenByHousehold(membership.household_id);
    childrenCount = children.length;
  }

  const hasHousehold = membership !== null;
  const hasChildren = childrenCount > 0;
  const hasBaseProfile = isBaseProfileComplete(facts);
  const discoveryComplete = isDiscoveryComplete(facts);
  const onboardingCompleted = userProfile?.onboarding_completed ?? false;
  const ux = getOnboardingUxProgress(userId);

  return {
    hasHousehold,
    hasChildren,
    hasBaseProfile,
    discoveryComplete,
    onboardingCompleted,
    householdId: membership?.household_id ?? null,
    childrenCount,
    welcomeSeen: ux.welcomeSeen || hasHousehold,
    introSeen: ux.introSeen || hasHousehold,
    childrenStepDone: ux.childrenStepDone || hasChildren,
    profileBasicsDone: ux.profileBasicsDone || facts.some((f) =>
      ["work_schedule", "sleep_schedule", "partner_name"].includes(f.fact_key),
    ),
    checkinChoiceDone: ux.checkinChoiceDone || onboardingCompleted,
    goalsStepDone: ux.goalsStepDone || onboardingCompleted,
  };
}

export async function loadUserProgressSafe(
  userId: string,
): Promise<UserProgressState> {
  try {
    return await loadUserProgress(userId);
  } catch {
    return { ...EMPTY_USER_PROGRESS };
  }
}
