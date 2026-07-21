/**
 * EPIC 6C — Bridge DailyState ↔ legacy DailyCheckinRecord.
 */

import type { DailyCheckinMood, DailyCheckinInput, DailyCheckinRecord } from "../../types/dailyCheckin";
import type { DailyState, DailyStateInput, DailyStateMood } from "../types/dailyStateTypes";
import { getDailyState } from "../store/dailyStateStore";

const MOOD_TO_LEGACY: Record<DailyStateMood, DailyCheckinMood> = {
  excellent: "great",
  good: "good",
  average: "okay",
  tired: "tired",
  very_tired: "exhausted",
};

const LEGACY_TO_MOOD: Partial<Record<DailyCheckinMood, DailyStateMood>> = {
  great: "excellent",
  good: "good",
  okay: "average",
  tired: "tired",
  exhausted: "very_tired",
  stressed: "average",
  sick: "very_tired",
};

function energyToLevel(energy: number): string {
  if (energy >= 8) return "high";
  if (energy >= 5) return "medium";
  return "low";
}

function stressToLevel(stress: number): string {
  if (stress >= 8) return "high";
  if (stress >= 5) return "medium";
  return "low";
}

function fatigueFromMood(mood: DailyStateMood): string {
  if (mood === "very_tired" || mood === "tired") return "high";
  if (mood === "average") return "medium";
  return "low";
}

export function dailyStateToCheckinInput(state: DailyState): DailyCheckinInput {
  return {
    mood: MOOD_TO_LEGACY[state.mood],
    intensity: Math.max(1, Math.min(5, Math.round(state.energy / 2))),
    note: state.notes ?? buildStateNote(state),
  };
}

function buildStateNote(state: DailyState): string | null {
  const parts = [
    `energy:${state.energy}`,
    `stress:${state.stress}`,
    `sleep:${state.sleepQuality}`,
    `day:${state.specialDay}`,
  ];
  if (state.adaptiveAnswer !== undefined) {
    parts.push(`adaptive_sleep:${state.adaptiveAnswer ? "yes" : "no"}`);
  }
  return parts.join("|");
}

export function parseStateFromCheckin(record: DailyCheckinRecord): DailyState | null {
  const mood = LEGACY_TO_MOOD[record.mood];
  if (!mood) return null;

  const parsed = parseNoteFields(record.note);
  const energy = parsed.energy ?? moodToDefaultEnergy(mood);
  const stress = parsed.stress ?? 5;
  const sleepQuality = parsed.sleep ?? 3;

  return {
    date: record.checkin_date,
    mood,
    energy,
    stress,
    sleepQuality,
    specialDay: parsed.specialDay ?? "normal",
    notes: parsed.userNote,
    confidence: 0.85,
    source: "imported",
    adaptiveAnswer: parsed.adaptiveSleep,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function moodToDefaultEnergy(mood: DailyStateMood): number {
  switch (mood) {
    case "excellent":
      return 9;
    case "good":
      return 7;
    case "average":
      return 5;
    case "tired":
      return 4;
    case "very_tired":
      return 2;
  }
}

function parseNoteFields(note: string | null): {
  energy?: number;
  stress?: number;
  sleep?: number;
  specialDay?: DailyState["specialDay"];
  adaptiveSleep?: boolean;
  userNote?: string;
} {
  if (!note) return {};
  if (!note.includes("energy:")) {
    return { userNote: note };
  }

  const parts = note.split("|");
  const result: ReturnType<typeof parseNoteFields> = {};

  for (const part of parts) {
    const [key, value] = part.split(":");
    if (!key || value === undefined) continue;
    switch (key) {
      case "energy":
        result.energy = Number(value);
        break;
      case "stress":
        result.stress = Number(value);
        break;
      case "sleep":
        result.sleep = Number(value);
        break;
      case "day":
        result.specialDay = value as DailyState["specialDay"];
        break;
      case "adaptive_sleep":
        result.adaptiveSleep = value === "yes";
        break;
      default:
        break;
    }
  }

  return result;
}

export function buildDailyStateFromInput(input: DailyStateInput): DailyState {
  const now = new Date().toISOString();
  const existing = getExistingTimestamp(input.userId, input.date);

  return {
    date: input.date,
    mood: input.mood,
    energy: clamp(input.energy, 1, 10),
    stress: clamp(input.stress, 1, 10),
    sleepQuality: clamp(input.sleepQuality ?? 3, 1, 5),
    specialDay: input.specialDay ?? "normal",
    notes: input.notes,
    confidence: computeConfidence(input),
    source: input.source ?? "checkin",
    adaptiveAnswer: input.adaptiveAnswer,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function getExistingTimestamp(userId: string, date: string): DailyState | null {
  return getDailyState(userId, date);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeConfidence(input: DailyStateInput): number {
  let score = 0.7;
  if (input.sleepQuality !== undefined) score += 0.1;
  if (input.specialDay) score += 0.05;
  if (input.notes) score += 0.05;
  return Math.min(0.98, score);
}

export function enrichCheckinRecordFromState(
  record: DailyCheckinRecord,
  state: DailyState,
): DailyCheckinRecord {
  return {
    ...record,
    energy_level: energyToLevel(state.energy),
    fatigue_level: fatigueFromMood(state.mood),
    stress_level: stressToLevel(state.stress),
    note: buildStateNote(state),
  };
}
