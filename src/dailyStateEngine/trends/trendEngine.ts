/**
 * EPIC 6C — Trend Engine (no medical diagnosis).
 */

import type { DailyState, DailyStateMood, StateTrendPeriod, StateTrends } from "../types/dailyStateTypes";
import { MEDICAL_DISCLAIMER } from "../types/dailyStateTypes";

function periodDays(period: StateTrendPeriod): number {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "12m":
      return 365;
  }
}

function moodFatigueScore(mood: DailyStateMood): number {
  switch (mood) {
    case "excellent":
      return 1;
    case "good":
      return 2;
    case "average":
      return 4;
    case "tired":
      return 7;
    case "very_tired":
      return 9;
  }
}

function filterByPeriod(states: readonly DailyState[], period: StateTrendPeriod, untilDate: string): DailyState[] {
  const until = new Date(`${untilDate}T12:00:00.000Z`);
  const from = new Date(until);
  from.setUTCDate(from.getUTCDate() - periodDays(period));

  return states.filter((state) => {
    const date = new Date(`${state.date}T12:00:00.000Z`);
    return date >= from && date <= until;
  });
}

function evolutionFromSamples(samples: readonly DailyState[]): StateTrends["evolution"] {
  if (samples.length < 4) return "stable";
  const firstHalf = samples.slice(Math.floor(samples.length / 2));
  const secondHalf = samples.slice(0, Math.floor(samples.length / 2));
  const avgFirst =
    firstHalf.reduce((sum, state) => sum + state.energy, 0) / Math.max(1, firstHalf.length);
  const avgSecond =
    secondHalf.reduce((sum, state) => sum + state.energy, 0) / Math.max(1, secondHalf.length);

  if (avgFirst - avgSecond >= 1) return "improving";
  if (avgSecond - avgFirst >= 1) return "declining";
  return "stable";
}

export function computeTrends(input: {
  readonly states: readonly DailyState[];
  readonly period: StateTrendPeriod;
  readonly untilDate: string;
}): StateTrends {
  const samples = filterByPeriod(input.states, input.period, input.untilDate);

  if (samples.length === 0) {
    return {
      period: input.period,
      averageEnergy: 0,
      averageStress: 0,
      averageSleepQuality: 0,
      averageFatigue: 0,
      moodDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        tired: 0,
        very_tired: 0,
      },
      evolution: "stable",
      sampleCount: 0,
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const moodDistribution: Record<DailyStateMood, number> = {
    excellent: 0,
    good: 0,
    average: 0,
    tired: 0,
    very_tired: 0,
  };

  let energySum = 0;
  let stressSum = 0;
  let sleepSum = 0;
  let fatigueSum = 0;

  for (const state of samples) {
    energySum += state.energy;
    stressSum += state.stress;
    sleepSum += state.sleepQuality;
    fatigueSum += moodFatigueScore(state.mood);
    moodDistribution[state.mood] += 1;
  }

  const count = samples.length;

  return {
    period: input.period,
    averageEnergy: Math.round((energySum / count) * 10) / 10,
    averageStress: Math.round((stressSum / count) * 10) / 10,
    averageSleepQuality: Math.round((sleepSum / count) * 10) / 10,
    averageFatigue: Math.round((fatigueSum / count) * 10) / 10,
    moodDistribution,
    evolution: evolutionFromSamples([...samples].sort((a, b) => a.date.localeCompare(b.date))),
    sampleCount: count,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

export class TrendEngine {
  compute(input: Parameters<typeof computeTrends>[0]): StateTrends {
    return computeTrends(input);
  }
}

export const defaultTrendEngine = new TrendEngine();
