import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { WorkoutSession } from "../../types/workoutSession";

const STORAGE_KEY = "equilibre-active-workout-player";

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return sessionStorage;
}

export type PersistedWorkoutPlayerState = {
  userId: string;
  selectedDate: string;
  entry: DayTimelineEntry;
  session: WorkoutSession;
  startedAt: string;
  isOpen: boolean;
};

export function loadPersistedWorkoutPlayer(
  userId: string,
): PersistedWorkoutPlayerState | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedWorkoutPlayerState;
    if (parsed.userId !== userId || !parsed.isOpen) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedWorkoutPlayer(
  state: PersistedWorkoutPlayerState,
): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function clearPersistedWorkoutPlayer(): void {
  getSessionStorage()?.removeItem(STORAGE_KEY);
}
