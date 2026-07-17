import {
  CALENDAR_ITEM_SOURCES,
  MANUAL_CONSTRAINT_SOURCE,
} from "../../config/calendarSources";
import { MANUAL_CALENDAR_ITEM_TYPE } from "../../config/calendarItemTypes";
import type { ManualConstraintType } from "../../config/dailyRoutineOptions";
import type { WorkoutSession } from "../../types/workoutSession";

export function buildConstraintTimestamps(
  date: string,
  startTime: string,
  endTime: string,
): { startsAt: string; endsAt: string } {
  const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
  const endsAt = new Date(`${date}T${endTime}:00`).toISOString();

  if (Number.isNaN(new Date(startsAt).getTime())) {
    throw new Error("Heure de début invalide.");
  }

  if (Number.isNaN(new Date(endsAt).getTime())) {
    throw new Error("Heure de fin invalide.");
  }

  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error("L’heure de fin doit être après l’heure de début.");
  }

  return { startsAt, endsAt };
}

export function buildSportManualDetails({
  constraintType,
  workoutSession,
  sportType = "renforcement",
  withSession,
}: {
  constraintType: ManualConstraintType;
  workoutSession?: WorkoutSession | null;
  sportType?: string;
  withSession?: boolean;
}) {
  const isSport = constraintType === "sport";

  return {
    constraintType,
    status: "accepted" as const,
    explanation: isSport
      ? withSession && workoutSession
        ? workoutSession.generatedReason
        : "Activité sport ajoutée manuellement."
      : "Contrainte ajoutée manuellement.",
    origin: "calendar_ui" as const,
    ...(isSport
      ? {
          businessType: "sport",
          activityType: "workout",
          visualType: "sport",
          category: "sport",
          sportType,
          ...(workoutSession ? { workoutSession } : {}),
        }
      : {}),
  };
}

export function buildManualConstraintInsert({
  householdId,
  userId,
  title,
  constraintType,
  startsAt,
  endsAt,
  workoutSession,
  withSession = false,
  sportType,
}: {
  householdId: string;
  userId: string;
  title: string;
  constraintType: ManualConstraintType;
  startsAt: string;
  endsAt: string;
  workoutSession?: WorkoutSession | null;
  withSession?: boolean;
  sportType?: string;
}) {
  if (!CALENDAR_ITEM_SOURCES.includes(MANUAL_CONSTRAINT_SOURCE)) {
    throw new Error(
      `Source manuelle incompatible avec le schéma: ${MANUAL_CONSTRAINT_SOURCE}`,
    );
  }

  const isSport = constraintType === "sport";

  return {
    household_id: householdId,
    user_id: userId,
    task_id: null,
    title: title.trim(),
    item_type: isSport ? "task" : MANUAL_CALENDAR_ITEM_TYPE,
    starts_at: startsAt,
    ends_at: endsAt,
    locked: true,
    source: MANUAL_CONSTRAINT_SOURCE,
    details: buildSportManualDetails({
      constraintType,
      workoutSession,
      sportType,
      withSession,
    }),
    updated_at: new Date().toISOString(),
  };
}
