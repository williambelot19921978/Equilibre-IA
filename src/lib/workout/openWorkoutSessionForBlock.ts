import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { WorkoutSession } from "../../types/workoutSession";
import {
  resolveWorkoutAvailability,
  type WorkoutAvailabilityResult,
} from "../planning/resolveWorkoutAvailability";

export type WorkoutOpenContext = {
  currentLocalDate: string;
  workoutCompletedToday?: boolean;
  scheduledSportEntries?: DayTimelineEntry[];
};

export type OpenWorkoutSessionOutcome =
  | { status: "opened"; session: WorkoutSession; isProposal: boolean }
  | { status: "needs_session"; entry: DayTimelineEntry }
  | { status: "invalid_session"; entry: DayTimelineEntry; message: string }
  | { status: "not_sport"; message: string }
  | {
      status: "blocked";
      availability: WorkoutAvailabilityResult;
      entry: DayTimelineEntry;
    };

export function isSportTimelineEntry(entry: DayTimelineEntry): boolean {
  if (entry.visualType === "sport" || entry.activityType === "sport") {
    return true;
  }
  if (entry.sportClassification?.isSport === true) {
    return true;
  }
  if (isSportProposalEntry(entry)) {
    return true;
  }
  return false;
}

/** Proposition sur créneau libre — pas une séance déjà persistée en base. */
export function isSportProposalEntry(entry: DayTimelineEntry): boolean {
  if (!entry.proposedWorkoutSession) return false;
  if (entry.workoutSession) return false;
  if (entry.blockKind === "free_slot") return true;
  if (entry.origin === "computed") return true;
  if (entry.calendarItemId && entry.origin === "persisted") return false;
  return true;
}

export function isValidWorkoutSession(
  session: unknown,
): session is WorkoutSession {
  if (!session || typeof session !== "object") return false;
  const candidate = session as WorkoutSession;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.level === "string" &&
    typeof candidate.type === "string" &&
    Array.isArray(candidate.warmup) &&
    Array.isArray(candidate.blocks) &&
    Array.isArray(candidate.cooldown)
  );
}

export function resolveWorkoutSessionForEntry(
  entry: DayTimelineEntry,
  persistedSession?: WorkoutSession | null,
): WorkoutSession | null {
  if (persistedSession && isValidWorkoutSession(persistedSession)) {
    return persistedSession;
  }
  if (entry.workoutSession && isValidWorkoutSession(entry.workoutSession)) {
    return entry.workoutSession;
  }
  if (isSportProposalEntry(entry) && entry.proposedWorkoutSession) {
    return isValidWorkoutSession(entry.proposedWorkoutSession)
      ? entry.proposedWorkoutSession
      : null;
  }
  return null;
}

export function openWorkoutSessionForBlock(
  entry: DayTimelineEntry,
  persistedSession?: WorkoutSession | null,
  context?: WorkoutOpenContext,
): OpenWorkoutSessionOutcome {
  if (!isSportTimelineEntry(entry)) {
    return {
      status: "not_sport",
      message: "Ce bloc n'est pas une activité sportive.",
    };
  }

  if (context) {
    const availability = resolveWorkoutAvailability({
      entry,
      currentLocalDate: context.currentLocalDate,
      workoutCompletedToday: context.workoutCompletedToday ?? false,
      scheduledSportEntries: context.scheduledSportEntries ?? [],
    });

    if (!availability.canOpenPlayer) {
      return {
        status: "blocked",
        availability,
        entry,
      };
    }
  }

  const session = resolveWorkoutSessionForEntry(entry, persistedSession);

  if (!session) {
    return { status: "needs_session", entry };
  }

  if (!isValidWorkoutSession(session)) {
    return {
      status: "invalid_session",
      entry,
      message: "La séance enregistrée est incomplète ou illisible.",
    };
  }

  return {
    status: "opened",
    session,
    isProposal: isSportProposalEntry(entry),
  };
}
