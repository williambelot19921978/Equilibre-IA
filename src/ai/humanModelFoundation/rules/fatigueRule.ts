/**
 * FatigueRule — Estime le niveau d'énergie à partir du check-in, du planning et des tâches.
 *
 * Entrées : dailyCheckin (mood, fatigue_level, energy_level), blockCount, taskTodoCount
 * Calcul : score cumulatif → mapping vers EnergyLevel
 */

import type { EnergyLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

const MOOD_SCORE: Record<string, number> = {
  great: -2,
  good: -1,
  okay: 0,
  tired: 1,
  exhausted: 2,
  stressed: 1,
  sick: 2,
};

function parseLevelScore(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized.includes("high") || normalized.includes("élev") || normalized.includes("fort")) {
    return 2;
  }
  if (normalized.includes("medium") || normalized.includes("moyen") || normalized.includes("modér")) {
    return 1;
  }
  if (normalized.includes("low") || normalized.includes("faible") || normalized.includes("bas")) {
    return -1;
  }
  return null;
}

function scoreToEnergy(score: number): EnergyLevel {
  if (score <= -2) return "Très reposé";
  if (score === -1) return "Reposé";
  if (score === 0) return "Normal";
  if (score === 1) return "Fatigué";
  return "Très fatigué";
}

export const fatigueRule: HumanModelRule<EnergyLevel | null> = {
  id: "fatigue",
  label: "Énergie / fatigue",
  evaluate(input: HumanModelRuleInput) {
    if (input.dailyStateEnabled && input.dailyStateToday) {
      const state = input.dailyStateToday;
      const value = state.energy >= 9
        ? "Très reposé"
        : state.energy >= 7
          ? "Reposé"
          : state.energy >= 5
            ? "Normal"
            : state.energy >= 3
              ? "Fatigué"
              : "Très fatigué";
      return ruleOutput<EnergyLevel | null>(
        value,
        Math.min(0.98, 0.9 + state.confidence * 0.05),
        `Énergie déclarée au check-in : ${value}.`,
        [`Check-in du jour — énergie ${state.energy}/10.`],
      );
    }

    const reasons: string[] = [];
    let score = 0;
    let signals = 0;

    const checkin = input.dailyCheckin;
    if (checkin) {
      const moodScore = MOOD_SCORE[checkin.mood] ?? 0;
      score += moodScore;
      signals += 1;
      reasons.push(`Check-in du jour : humeur « ${checkin.mood} ».`);

      const fatigueScore = parseLevelScore(checkin.fatigue_level);
      if (fatigueScore !== null) {
        score += fatigueScore;
        signals += 1;
        reasons.push(`Niveau de fatigue déclaré : ${checkin.fatigue_level}.`);
      }

      const energyScore = parseLevelScore(checkin.energy_level);
      if (energyScore !== null) {
        score -= energyScore;
        signals += 1;
        reasons.push(`Niveau d'énergie déclaré : ${checkin.energy_level}.`);
      }
    }

    if (input.blockCount >= 8) {
      score += 1;
      signals += 1;
      reasons.push(`Journée chargée : ${input.blockCount} bloc(s) planifié(s).`);
    } else if (input.blockCount >= 5) {
      score += 0.5;
      signals += 1;
      reasons.push(`Planning modéré : ${input.blockCount} bloc(s).`);
    }

    if (input.taskTodoCount >= 10) {
      score += 1;
      signals += 1;
      reasons.push(`${input.taskTodoCount} tâche(s) restante(s).`);
    } else if (input.taskTodoCount >= 5) {
      score += 0.5;
      signals += 1;
      reasons.push(`${input.taskTodoCount} tâche(s) à faire.`);
    }

    if (signals === 0) {
      return ruleOutput<EnergyLevel | null>(
        null,
        0,
        "Impossible d'estimer la fatigue faute de check-in récent et de planning chargé.",
        [],
        ["Aucun check-in du jour.", "Planning ou tâches insuffisants pour estimer."],
      );
    }

    const roundedScore = Math.round(score);
    const value = scoreToEnergy(roundedScore);
    const confidence = Math.min(0.95, 0.35 + signals * 0.15);

    return ruleOutput<EnergyLevel | null>(
      value,
      confidence,
      `Énergie estimée : ${value}.`,
      reasons,
    );
  },
};
