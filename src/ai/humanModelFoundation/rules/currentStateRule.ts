/**
 * CurrentStateRule — Synthèse de l'état courant à partir des autres dimensions.
 */

import type { CurrentStateSummary } from "../types/humanModel";
import type { HumanModelRule, HumanModelRuleInput } from "../types/ruleTypes";
import { ruleOutput } from "../types/ruleTypes";
import { availabilityRule } from "./availabilityRule";
import { fatigueRule } from "./fatigueRule";
import { mentalLoadRule } from "./mentalLoadRule";
import { stressRule } from "./stressRule";

function buildLabel(state: CurrentStateSummary): string {
  const parts: string[] = [];
  if (state.energy) parts.push(state.energy);
  if (state.stress) parts.push(state.stress);
  if (state.mentalLoad) parts.push(state.mentalLoad);
  if (state.availability) parts.push(`Disponibilité ${state.availability.toLowerCase()}`);
  return parts.length > 0 ? parts.join(" · ") : "État non déterminé";
}

export const currentStateRule: HumanModelRule<CurrentStateSummary> = {
  id: "currentState",
  label: "État actuel",
  evaluate(input: HumanModelRuleInput) {
    const energy = fatigueRule.evaluate(input);
    const stress = stressRule.evaluate(input);
    const mentalLoad = mentalLoadRule.evaluate(input);
    const availability = availabilityRule.evaluate(input);

    const summary: CurrentStateSummary = {
      energy: energy.value,
      stress: stress.value,
      mentalLoad: mentalLoad.value,
      availability: availability.value,
      label: buildLabel({
        energy: energy.value,
        stress: stress.value,
        mentalLoad: mentalLoad.value,
        availability: availability.value,
        label: "",
      }),
    };

    const reasons = [
      ...energy.reasons,
      ...stress.reasons,
      ...mentalLoad.reasons,
    ];

    const confidences = [energy, stress, mentalLoad, availability]
      .map((result) => result.confidence)
      .filter((value) => value > 0);

    const confidence =
      confidences.length === 0
        ? 0.2
        : confidences.reduce((sum, value) => sum + value, 0) / confidences.length;

    const missingData = [
      ...energy.missingData,
      ...stress.missingData,
    ].filter((item, index, array) => array.indexOf(item) === index);

    return ruleOutput(
      summary,
      Math.round(confidence * 100) / 100,
      `État global : ${summary.label}.`,
      reasons,
      missingData,
    );
  },
};
