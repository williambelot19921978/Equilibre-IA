import {
  buildBaseProfileMemory,
  buildHouseholdEveningSettings,
  buildMemoryProfile,
} from "../ai/memoryEngine";
import { getProfileFacts, upsertProfileFacts } from "./profileFactsService";
import type { DailyRoutineData, DailyRoutineInput } from "../types/dailyRoutine";

function emptyRoutine(): DailyRoutineData {
  return {
    wakeTime: "",
    bedTime: "",
    workDays: [],
    workStart: "",
    workEnd: "",
    commuteMinutes: null,
    afterWorkEnergy: "",
    childrenDepartureTime: "",
    morningChildrenDuration: null,
    personalPrepMinutes: null,
    eveningRoutine: [],
    eveningRoutineStart: "",
    eveningRoutineManager: "",
    averageEveningRoutineMinutes: null,
    preferredFocusMinutes: null,
    mainPriority: "",
  };
}

export async function loadDailyRoutine(
  userId: string,
): Promise<DailyRoutineData> {
  const facts = await getProfileFacts(userId);
  const baseProfile = buildBaseProfileMemory(facts);
  const profile = buildMemoryProfile(facts);
  const evening = buildHouseholdEveningSettings(facts);

  return {
    wakeTime: baseProfile.sleepSchedule.wakeTime ?? "",
    bedTime: baseProfile.sleepSchedule.bedTime ?? "",
    workDays: profile.workDays,
    workStart: baseProfile.workSchedule.start ?? "",
    workEnd: baseProfile.workSchedule.end ?? "",
    commuteMinutes: profile.commuteMinutes ?? null,
    afterWorkEnergy: profile.afterWorkEnergy ?? "",
    childrenDepartureTime: profile.childrenDepartureTime ?? "",
    morningChildrenDuration: profile.morningDurationMinutes ?? null,
    personalPrepMinutes: profile.personalPrepMinutes ?? null,
    eveningRoutine: profile.eveningRoutine,
    eveningRoutineStart: evening.eveningRoutineStart ?? "",
    eveningRoutineManager: evening.eveningRoutineManager ?? "",
    averageEveningRoutineMinutes: evening.averageEveningRoutineMinutes,
    preferredFocusMinutes: profile.preferredFocusMinutes ?? null,
    mainPriority: baseProfile.mainPriority ?? "",
  };
}

export async function saveDailyRoutine({
  userId,
  routine,
}: {
  userId: string;
  routine: DailyRoutineInput;
}): Promise<void> {
  await upsertProfileFacts({
    userId,
    source: "daily_routine",
    facts: [
      {
        fact_key: "sleep_schedule",
        fact_value: {
          wake_time: routine.wakeTime || null,
          bed_time: routine.bedTime || null,
        },
      },
      {
        fact_key: "work_schedule",
        fact_value: {
          start: routine.workStart || null,
          end: routine.workEnd || null,
        },
      },
      {
        fact_key: "work_days",
        fact_value: { value: routine.workDays },
      },
      {
        fact_key: "commute_duration",
        fact_value: { value: routine.commuteMinutes },
      },
      {
        fact_key: "after_work_energy",
        fact_value: { value: routine.afterWorkEnergy || null },
      },
      {
        fact_key: "children_departure_time",
        fact_value: { value: routine.childrenDepartureTime || null },
      },
      {
        fact_key: "morning_children_duration",
        fact_value: { value: routine.morningChildrenDuration },
      },
      {
        fact_key: "personal_prep_duration",
        fact_value: { value: routine.personalPrepMinutes },
      },
      {
        fact_key: "children_evening_routine",
        fact_value: { value: routine.eveningRoutine },
      },
      {
        fact_key: "evening_routine_start",
        fact_value: { value: routine.eveningRoutineStart || null },
      },
      {
        fact_key: "evening_routine_manager",
        fact_value: { value: routine.eveningRoutineManager || null },
      },
      {
        fact_key: "average_evening_routine_minutes",
        fact_value: { value: routine.averageEveningRoutineMinutes },
      },
      {
        fact_key: "preferred_focus_duration",
        fact_value: { value: routine.preferredFocusMinutes },
      },
      {
        fact_key: "main_priority",
        fact_value: { value: routine.mainPriority || null },
      },
    ],
  });
}

export { emptyRoutine };
