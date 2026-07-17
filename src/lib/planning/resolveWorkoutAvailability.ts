import type { DayTimelineEntry } from "./displayedDayTimeline";
import { isSportTimelineEntry } from "../workout/openWorkoutSessionForBlock";
import {
  addLocalDays,
  formatLocalDateLabel,
  getLocalDateFromIso,
} from "../time/localDateFromIso";

export type WorkoutAvailabilityStatus =
  | "available_now"
  | "future_workout"
  | "another_workout_today"
  | "already_completed_today"
  | "past_workout"
  | "invalid";

export type WorkoutAvailabilityInput = {
  entry: DayTimelineEntry;
  currentLocalDate: string;
  workoutCompletedToday: boolean;
  scheduledSportEntries?: DayTimelineEntry[];
};

export type WorkoutAvailabilityResult = {
  status: WorkoutAvailabilityStatus;
  message: string;
  canOpenPlayer: boolean;
  canComplete: boolean;
  canStart: boolean;
  todayWorkoutEntryId?: string;
  scheduledDate: string;
};

function isScheduledSportEntry(entry: DayTimelineEntry): boolean {
  return isSportTimelineEntry(entry) && !entry.completed && entry.blockKind !== "free_slot";
}

export function findPrimaryWorkoutForDate(
  entries: DayTimelineEntry[],
  date: string,
): DayTimelineEntry | null {
  const candidates = entries
    .filter(isScheduledSportEntry)
    .filter((entry) => getLocalDateFromIso(entry.startsAt) === date)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

  return candidates[0] ?? null;
}

export function resolveWorkoutAvailability({
  entry,
  currentLocalDate,
  workoutCompletedToday,
  scheduledSportEntries = [],
}: WorkoutAvailabilityInput): WorkoutAvailabilityResult {
  if (!isSportTimelineEntry(entry)) {
    return {
      status: "invalid",
      message: "Ce bloc n'est pas une activité sportive.",
      canOpenPlayer: false,
      canComplete: false,
      canStart: false,
      scheduledDate: getLocalDateFromIso(entry.startsAt),
    };
  }

  const scheduledDate = getLocalDateFromIso(entry.startsAt);
  const todayWorkout = findPrimaryWorkoutForDate(
    scheduledSportEntries,
    currentLocalDate,
  );

  if (workoutCompletedToday || entry.completed) {
    return {
      status: "already_completed_today",
      message:
        "Ta séance du jour est déjà effectuée. Une nouvelle séance automatique ne sera pas proposée aujourd'hui.",
      canOpenPlayer: false,
      canComplete: false,
      canStart: false,
      todayWorkoutEntryId: todayWorkout?.id,
      scheduledDate,
    };
  }

  if (scheduledDate > currentLocalDate) {
    const tomorrow = addLocalDays(currentLocalDate, 1);
    const futureMessage =
      scheduledDate === tomorrow
        ? "Cette séance est prévue demain. Tu ne peux pas encore la faire."
        : `Cette séance est prévue le ${formatLocalDateLabel(scheduledDate)}. Tu pourras la lancer ce jour-là.`;

    if (todayWorkout && todayWorkout.id !== entry.id) {
      return {
        status: "another_workout_today",
        message: "Tu as déjà une séance prévue aujourd'hui. Fais d'abord celle-ci.",
        canOpenPlayer: false,
        canComplete: false,
        canStart: false,
        todayWorkoutEntryId: todayWorkout.id,
        scheduledDate,
      };
    }

    return {
      status: "future_workout",
      message: futureMessage,
      canOpenPlayer: false,
      canComplete: false,
      canStart: false,
      todayWorkoutEntryId: todayWorkout?.id,
      scheduledDate,
    };
  }

  if (scheduledDate < currentLocalDate) {
    return {
      status: "past_workout",
      message: "Cette séance appartient à un jour passé.",
      canOpenPlayer: false,
      canComplete: false,
      canStart: false,
      scheduledDate,
    };
  }

  if (todayWorkout && todayWorkout.id !== entry.id) {
    return {
      status: "another_workout_today",
      message: "Tu as déjà une séance prévue aujourd'hui. Fais d'abord celle-ci.",
      canOpenPlayer: false,
      canComplete: false,
      canStart: false,
      todayWorkoutEntryId: todayWorkout.id,
      scheduledDate,
    };
  }

  return {
    status: "available_now",
    message: "",
    canOpenPlayer: true,
    canComplete: true,
    canStart: true,
    todayWorkoutEntryId: entry.id,
    scheduledDate,
  };
}

export const MOVE_FUTURE_WORKOUT_CONFIRM_MESSAGE =
  "Cette séance était prévue demain. Veux-tu la déplacer à aujourd'hui ?";
