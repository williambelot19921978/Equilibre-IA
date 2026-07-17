export type UserProgressState = {
  hasHousehold: boolean;
  hasChildren: boolean;
  hasBaseProfile: boolean;
  discoveryComplete: boolean;
  onboardingCompleted: boolean;
  householdId: string | null;
  childrenCount: number;
};

export const EMPTY_USER_PROGRESS: UserProgressState = {
  hasHousehold: false,
  hasChildren: false,
  hasBaseProfile: false,
  discoveryComplete: false,
  onboardingCompleted: false,
  householdId: null,
  childrenCount: 0,
};
