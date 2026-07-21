/**
 * FocusRule — Capacité de concentration selon profil et densité du planning.
 */

import type { FocusLevel } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";

export const focusRule: HumanModelRule<FocusLevel | null> = {
  id: "focus",
  label: "Concentration",
  evaluate(input: HumanModelRuleInput) {
    const reasons: string[] = [];
    let score = 1;

    const checkin = input.dailyCheckin;
    if (checkin?.mood === "great" || checkin?.mood === "good") {
      score += 1;
      reasons.push("Humeur favorable au focus (check-in).");
    } else if (
      checkin?.mood === "tired" ||
      checkin?.mood === "exhausted" ||
      checkin?.mood === "stressed"
    ) {
      score -= 1;
      reasons.push("Humeur du check-in réduit la capacité de focus.");
    }

    const preferredMinutes = input.profile?.preferredFocusMinutes;
    if (preferredMinutes && preferredMinutes >= 45) {
      score += 0.5;
      reasons.push(`Profil : sessions de focus préférées ~${preferredMinutes} min.`);
    } else if (preferredMinutes && preferredMinutes <= 25) {
      reasons.push(`Profil : focus préféré en courtes sessions (~${preferredMinutes} min).`);
    }

    if (input.blockCount >= 7) {
      score -= 1;
      reasons.push("Planning dense — moins de créneaux longs disponibles.");
    } else if (input.blockCount <= 3 && input.hasLoadedPlan) {
      score += 0.5;
      reasons.push("Planning léger — plus de marge pour se concentrer.");
    }

    if (reasons.length === 0) {
      return ruleOutput<FocusLevel | null>(
        null,
        0,
        "Impossible d'estimer la concentration sans check-in ni profil focus.",
        [],
        ["Aucun check-in récent.", "Profil focus non renseigné."],
      );
    }

    let value: FocusLevel;
    if (score <= 0) value = "Concentration faible";
    else if (score === 1) value = "Concentration moyenne";
    else value = "Concentration bonne";

    const confidence = Math.min(0.82, 0.35 + reasons.length * 0.15);

    return ruleOutput<FocusLevel | null>(value, confidence, `Focus estimé : ${value}.`, reasons);
  },
};
