/**
 * EPIC 6C — Human Model mapping from DailyState (priority source).
 */

import type { EnergyLevel, SleepQualityLevel, StressLevel } from "../../ai/humanModelFoundation/types/humanModel";
import type { DailyState, DailyStateMood } from "../types/dailyStateTypes";

export function dailyStateToHumanModelEnergy(state: DailyState): EnergyLevel {
  if (state.energy >= 9) return "Très reposé";
  if (state.energy >= 7) return "Reposé";
  if (state.energy >= 5) return "Normal";
  if (state.energy >= 3) return "Fatigué";
  return "Très fatigué";
}

export function dailyStateToHumanModelStress(state: DailyState): StressLevel {
  if (state.stress <= 3) return "Stress faible";
  if (state.stress <= 6) return "Stress moyen";
  return "Stress élevé";
}

export function dailyStateToHumanModelSleep(state: DailyState): NonNullable<SleepQualityLevel> {
  if (state.sleepQuality >= 4) return "Sommeil probablement bon";
  if (state.sleepQuality >= 3) return "Sommeil probablement correct";
  return "Sommeil probablement insuffisant";
}

export function moodLabel(mood: DailyStateMood): string {
  switch (mood) {
    case "excellent":
      return "excellent";
    case "good":
      return "bien";
    case "average":
      return "moyen";
    case "tired":
      return "fatigué";
    case "very_tired":
      return "très fatigué";
  }
}
