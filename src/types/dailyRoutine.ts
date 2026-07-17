export type DailyRoutineData = {
  wakeTime: string;
  bedTime: string;
  workDays: string[];
  workStart: string;
  workEnd: string;
  commuteMinutes: number | null;
  afterWorkEnergy: string;
  childrenDepartureTime: string;
  morningChildrenDuration: number | null;
  personalPrepMinutes: number | null;
  eveningRoutine: string[];
  eveningRoutineStart: string;
  eveningRoutineManager: string;
  averageEveningRoutineMinutes: number | null;
  preferredFocusMinutes: number | null;
  mainPriority: string;
};

export type DailyRoutineInput = DailyRoutineData;
