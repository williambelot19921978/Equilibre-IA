import { getWeekdayKey } from "../time/daySchedule";
import type { ChildRecord } from "../../types";
import type {
  ChildRoutineRecord,
  EveningRoutineWindow,
  HouseholdEveningSettings,
} from "../../types/childRoutine";

function isWeekend(date: string): boolean {
  const key = getWeekdayKey(date);
  return key === "saturday" || key === "sunday";
}

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(totalMinutes: number): string {
  const normalized =
    ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function computeEveningRoutineWindow({
  date,
  children,
  childRoutines,
  householdSettings,
}: {
  date: string;
  children: ChildRecord[];
  childRoutines: ChildRoutineRecord[];
  householdSettings: HouseholdEveningSettings;
}): EveningRoutineWindow {
  const weekend = isWeekend(date);
  const childDetails: EveningRoutineWindow["childDetails"] = [];
  const bedtimes: number[] = [];
  const routineMinutes: number[] = [];

  for (const child of children) {
    const routine = childRoutines.find((item) => item.child_id === child.id);
    const bedtimeRaw = weekend
      ? routine?.bedtime_weekend ?? routine?.bedtime_weekday
      : routine?.bedtime_weekday ?? routine?.bedtime_weekend;

    childDetails.push({
      childId: child.id,
      firstName: child.first_name,
      bedtime: bedtimeRaw ?? null,
    });

    if (bedtimeRaw) {
      const minutes = timeToMinutes(bedtimeRaw);

      if (minutes !== null) {
        bedtimes.push(minutes);
      }
    }

    if (routine?.evening_routine_minutes) {
      routineMinutes.push(routine.evening_routine_minutes);
    }
  }

  if (bedtimes.length === 0) {
    return {
      startTime: null,
      endTime: null,
      incomplete: true,
      message:
        "Heures de coucher des enfants manquantes — complète « Mon quotidien ».",
      childDetails,
    };
  }

  const averageRoutine =
    routineMinutes.length > 0
      ? Math.round(
          routineMinutes.reduce((sum, value) => sum + value, 0) /
            routineMinutes.length,
        )
      : householdSettings.averageEveningRoutineMinutes;

  if (!averageRoutine) {
    return {
      startTime: null,
      endTime: null,
      incomplete: true,
      message:
        "Durée moyenne de routine du soir inconnue — complète « Mon quotidien ».",
      childDetails,
    };
  }

  const earliestBedtime = Math.min(...bedtimes);
  const latestBedtime = Math.max(...bedtimes);
  const startMinutes = earliestBedtime - averageRoutine;

  const explicitStart = householdSettings.eveningRoutineStart
    ? timeToMinutes(householdSettings.eveningRoutineStart)
    : null;

  const resolvedStart =
    explicitStart !== null
      ? Math.min(explicitStart, startMinutes)
      : startMinutes;

  return {
    startTime: minutesToTime(resolvedStart),
    endTime: minutesToTime(latestBedtime),
    incomplete: false,
    message: `Routine du soir calculée : ${minutesToTime(resolvedStart)} → ${minutesToTime(latestBedtime)} (durée moyenne ${averageRoutine} min).`,
    childDetails,
  };
}
