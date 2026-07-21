/** EPIC 4B — Human Model Foundation public API. */

export {
  HumanModelEngine,
  humanModelEngine,
  buildHumanModel,
} from "./engine/humanModelEngine";

export { HUMAN_MODEL_RULES } from "./rules";
export {
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
} from "./rules";

export type {
  HumanModel,
  HumanModelIdentity,
  InterpretedField,
  EnergyLevel,
  StressLevel,
  MentalLoadLevel,
  AvailabilityLevel,
  FocusLevel,
  MotivationLevel,
  SleepQualityLevel,
  FamilyPressureLevel,
  CurrentStateSummary,
  DominantGoalSnapshot,
} from "./types/humanModel";

export {
  computeGlobalConfidence,
  toInterpretedField,
} from "./types/humanModel";

export type {
  HumanModelRule,
  HumanModelRuleInput,
  RuleOutput,
} from "./types/ruleTypes";

export { toHumanModelRuleInput, ruleOutput } from "./types/ruleTypes";
