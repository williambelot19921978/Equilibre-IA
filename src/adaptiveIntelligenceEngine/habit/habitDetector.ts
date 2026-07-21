/**
 * EPIC 6A — Habit Detector.
 */

import type { BehaviorObservation, DetectedHabit, HabitKind } from "../types/adaptiveTypes";
import { computeConfidence, periodDaysFromObservations } from "../confidence/confidenceEngine";

type HabitPattern = {
  readonly kind: HabitKind;
  readonly label: string;
  readonly matcher: (obs: BehaviorObservation) => boolean;
  readonly timeExtractor?: (obs: BehaviorObservation) => string | undefined;
};

const PATTERNS: readonly HabitPattern[] = [
  {
    kind: "sport",
    label: "Heure habituelle de sport",
    matcher: (obs) =>
      obs.metadata.kind === "sport" ||
      /sport/i.test(obs.label) ||
      obs.metadata.category === "sport",
    timeExtractor: (obs) => String(obs.metadata.hour ?? ""),
  },
  {
    kind: "sleep",
    label: "Heure habituelle de sommeil",
    matcher: (obs) => /sommeil|sleep|repos/i.test(obs.label),
  },
  {
    kind: "work",
    label: "Heure de travail",
    matcher: (obs) =>
      obs.metadata.category === "travail" || /travail|work|réunion|sprint/i.test(obs.label),
    timeExtractor: (obs) => String(obs.metadata.hour ?? ""),
  },
  {
    kind: "study",
    label: "Créneau d'études",
    matcher: (obs) =>
      obs.metadata.category === "etudes" || /étude|révision|cours|study/i.test(obs.label),
    timeExtractor: (obs) => String(obs.metadata.hour ?? ""),
  },
  {
    kind: "reading",
    label: "Lecture",
    matcher: (obs) => /lecture|reading/i.test(obs.label),
  },
  {
    kind: "meditation",
    label: "Méditation",
    matcher: (obs) => /méditation|meditation|prière/i.test(obs.label),
  },
  {
    kind: "personal_time",
    label: "Temps personnel",
    matcher: (obs) =>
      obs.metadata.category === "personnel" || /perso|personal|pause/i.test(obs.label),
  },
  {
    kind: "preferred_slot",
    label: "Créneau préféré",
    matcher: (obs) => obs.type === "repeated" && Boolean(obs.metadata.hour),
    timeExtractor: (obs) => String(obs.metadata.hour ?? ""),
  },
];

function dominantHour(observations: readonly BehaviorObservation[]): string | undefined {
  const counts = new Map<string, number>();
  for (const obs of observations) {
    const hour = obs.metadata.hour ? String(obs.metadata.hour) : undefined;
    if (!hour) continue;
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [hour, count] of counts) {
    if (count > bestCount) {
      best = hour;
      bestCount = count;
    }
  }
  return best;
}

function evolutionFromFrequency(frequency: number, periodDays: number): DetectedHabit["evolution"] {
  if (frequency === 0) return "abandoned";
  if (periodDays < 7 && frequency >= 2) return "emerging";
  if (frequency >= 8) return "stable";
  if (frequency <= 2 && periodDays > 14) return "declining";
  return "stable";
}

export function detectHabits(observations: readonly BehaviorObservation[]): DetectedHabit[] {
  const habits: DetectedHabit[] = [];
  const periodDays = periodDaysFromObservations(observations);

  for (const pattern of PATTERNS) {
    const matching = observations.filter(pattern.matcher);
    if (matching.length < 2) continue;

    const { confidence } = computeConfidence({
      matchingObservations: matching,
      totalObservations: observations.length,
      periodDays,
      why: `Répétition détectée pour ${pattern.label}.`,
      label: pattern.label,
    });

    const preferredTime = dominantHour(matching) ?? pattern.timeExtractor?.(matching[0]!);
    const frequency = matching.length;
    const stability = Math.min(1, frequency / Math.max(periodDays, 1));

    habits.push({
      id: `habit-${pattern.kind}-${preferredTime ?? "general"}`,
      kind: pattern.kind,
      label: pattern.label,
      score: Math.round(confidence * 100),
      frequency,
      stability,
      antiquityDays: periodDays,
      evolution: evolutionFromFrequency(frequency, periodDays),
      preferredTime: preferredTime || undefined,
      observationIds: matching.map((obs) => obs.id),
    });
  }

  return habits.sort((left, right) => right.score - left.score);
}

export class HabitDetector {
  detect(observations: readonly BehaviorObservation[]): DetectedHabit[] {
    return detectHabits(observations);
  }
}

export const defaultHabitDetector = new HabitDetector();
