export type ChildRoutineRecord = {
  id: string;
  child_id: string;
  household_id: string;
  bedtime_weekday: string | null;
  bedtime_weekend: string | null;
  evening_routine_minutes: number | null;
  wake_time: string | null;
  school_days: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ChildRoutineInput = {
  childId: string;
  bedtimeWeekday?: string | null;
  bedtimeWeekend?: string | null;
  eveningRoutineMinutes?: number | null;
  wakeTime?: string | null;
  schoolDays?: string[] | null;
};

export type HouseholdEveningSettings = {
  eveningRoutineStart: string | null;
  eveningRoutineManager: string | null;
  averageEveningRoutineMinutes: number | null;
};

export type EveningRoutineWindow = {
  startTime: string | null;
  endTime: string | null;
  incomplete: boolean;
  message?: string;
  childDetails: Array<{
    childId: string;
    firstName: string;
    bedtime: string | null;
  }>;
};
