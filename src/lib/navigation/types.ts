export type UserProgressState = {
  hasHousehold: boolean;
  hasChildren: boolean;
  hasBaseProfile: boolean;
  discoveryComplete: boolean;
  onboardingCompleted: boolean;
  householdId: string | null;
  childrenCount: number;
  welcomeSeen: boolean;
  introSeen: boolean;
  childrenStepDone: boolean;
  profileBasicsDone: boolean;
  checkinChoiceDone: boolean;
  goalsStepDone: boolean;
};

export const EMPTY_USER_PROGRESS: UserProgressState = {
  hasHousehold: false,
  hasChildren: false,
  hasBaseProfile: false,
  discoveryComplete: false,
  onboardingCompleted: false,
  householdId: null,
  childrenCount: 0,
  welcomeSeen: false,
  introSeen: false,
  childrenStepDone: false,
  profileBasicsDone: false,
  checkinChoiceDone: false,
  goalsStepDone: false,
};
