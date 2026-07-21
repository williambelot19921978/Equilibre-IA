export { fatigueRule } from "./fatigueRule";
export { stressRule } from "./stressRule";
export { mentalLoadRule } from "./mentalLoadRule";
export { availabilityRule } from "./availabilityRule";
export { focusRule } from "./focusRule";
export { sleepRule } from "./sleepRule";
export { motivationRule } from "./motivationRule";
export { familyPressureRule } from "./familyPressureRule";
export { goalRule } from "./goalRule";
export { concernRule } from "./concernRule";
export { currentStateRule } from "./currentStateRule";
export { proactiveBehaviorRule } from "./proactiveBehaviorRule";
export type { ProactiveBehaviorSummary } from "./proactiveBehaviorRule";

import { availabilityRule } from "./availabilityRule";
import { concernRule } from "./concernRule";
import { currentStateRule } from "./currentStateRule";
import { familyPressureRule } from "./familyPressureRule";
import { fatigueRule } from "./fatigueRule";
import { focusRule } from "./focusRule";
import { goalRule } from "./goalRule";
import { mentalLoadRule } from "./mentalLoadRule";
import { motivationRule } from "./motivationRule";
import { sleepRule } from "./sleepRule";
import { stressRule } from "./stressRule";
import { proactiveBehaviorRule } from "./proactiveBehaviorRule";
import type { HumanModelRule } from "../types/ruleTypes";

export const HUMAN_MODEL_RULES: readonly HumanModelRule<unknown>[] = [
  fatigueRule,
  stressRule,
  mentalLoadRule,
  availabilityRule,
  focusRule,
  sleepRule,
  motivationRule,
  familyPressureRule,
  goalRule,
  concernRule,
  currentStateRule,
  proactiveBehaviorRule,
];
