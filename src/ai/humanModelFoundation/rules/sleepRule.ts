/**
 * SleepRule — Qualité de sommeil probable (check-in + profil sommeil).
 */

import type { SleepQualityLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export const sleepRule: HumanModelRule<SleepQualityLevel> = {
  id: "sleep",
  label: "Sommeil",
  evaluate(input: HumanModelRuleInput) {
    if (input.dailyStateEnabled && input.dailyStateToday) {
      const state = input.dailyStateToday;
      const value =
        state.sleepQuality >= 4
          ? "Sommeil probablement bon"
          : state.sleepQuality >= 3
            ? "Sommeil probablement correct"
            : "Sommeil probablement insuffisant";
      return ruleOutput(
        value,
        Math.min(0.95, 0.85 + state.confidence * 0.05),
        `Sommeil déclaré au check-in : ${value}.`,
        [`Check-in du jour — sommeil ${state.sleepQuality}/5 étoiles.`],
      );
    }

    const reasons: string[] = [];
    let score = 1;

    const checkin = input.dailyCheckin;
    if (checkin) {
      if (checkin.mood === "great" || checkin.mood === "good") {
        score += 1;
        reasons.push("Check-in du jour : humeur positive (proxy sommeil).");
      } else if (checkin.mood === "tired" || checkin.mood === "exhausted") {
        score -= 1;
        reasons.push("Check-in : fatigue visible — sommeil probablement insuffisant.");
      }

      const fatigue = checkin.fatigue_level?.toLowerCase() ?? "";
      if (fatigue.includes("high") || fatigue.includes("élev")) {
        score -= 1;
        reasons.push("Fatigue élevée déclarée ce matin.");
      }
    }

    const sleepProblems = input.profile?.sleepProblems ?? [];
    if (sleepProblems.length > 0) {
      score -= 0.5;
      reasons.push(`Profil : problèmes de sommeil signalés (${sleepProblems.length}).`);
    }

    const sleepNeeded = input.profile?.sleepNeededHours;
    if (sleepNeeded) {
      reasons.push(`Profil : ${sleepNeeded} h de sommeil visées.`);
    }

    if (reasons.length === 0) {
      return ruleOutput(
        null,
        0,
        "Impossible d'estimer le sommeil — aucune donnée récente.",
        [],
        ["Aucun check-in du jour.", "Profil sommeil non renseigné."],
      );
    }

    let value: NonNullable<SleepQualityLevel>;
    if (score >= 2) value = "Sommeil probablement bon";
    else if (score === 1) value = "Sommeil probablement correct";
    else value = "Sommeil probablement insuffisant";

    const confidence = checkin ? 0.55 : 0.35;

    return ruleOutput(value, confidence, `Sommeil : ${value}.`, reasons);
  },
};
