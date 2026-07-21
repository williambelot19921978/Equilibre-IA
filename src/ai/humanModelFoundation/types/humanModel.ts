/** EPIC 4B — Human Model output contract. */

import type { ProactiveBehaviorSummary } from "../rules/proactiveBehaviorRule";
import type { RuleOutput } from "./ruleTypes";

export type EnergyLevel =
  | "Très reposé"
  | "Reposé"
  | "Normal"
  | "Fatigué"
  | "Très fatigué";

export type StressLevel = "Stress faible" | "Stress moyen" | "Stress élevé";

export type MentalLoadLevel = "Charge légère" | "Charge normale" | "Charge forte";

export type AvailabilityLevel = "Faible" | "Moyenne" | "Bonne";

export type FocusLevel = "Concentration faible" | "Concentration moyenne" | "Concentration bonne";

export type MotivationLevel = "Motivation faible" | "Motivation moyenne" | "Motivation bonne";

export type SleepQualityLevel =
  | "Sommeil probablement bon"
  | "Sommeil probablement correct"
  | "Sommeil probablement insuffisant"
  | null;

export type FamilyPressureLevel = "Pression faible" | "Pression modérée" | "Pression élevée";

export type CurrentStateSummary = {
  readonly energy: EnergyLevel | null;
  readonly stress: StressLevel | null;
  readonly mentalLoad: MentalLoadLevel | null;
  readonly availability: AvailabilityLevel | null;
  readonly label: string;
};

export type DominantGoalSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly progressPercent: number;
};

export type InterpretedField<T> = {
  readonly value: T;
  readonly confidence: number;
  readonly explanation: string;
  readonly reasons: readonly string[];
};

export type HumanModelIdentity = {
  readonly userId: string;
  readonly firstName: string;
  readonly date: string;
};

export type HumanModel = {
  readonly identity: HumanModelIdentity;
  readonly currentState: InterpretedField<CurrentStateSummary | null>;
  readonly energy: InterpretedField<EnergyLevel | null>;
  readonly mentalLoad: InterpretedField<MentalLoadLevel | null>;
  readonly focus: InterpretedField<FocusLevel | null>;
  readonly sleep: InterpretedField<SleepQualityLevel>;
  readonly motivation: InterpretedField<MotivationLevel | null>;
  readonly availability: InterpretedField<AvailabilityLevel | null>;
  readonly familyPressure: InterpretedField<FamilyPressureLevel | null>;
  readonly stress: InterpretedField<StressLevel | null>;
  readonly dominantGoal: InterpretedField<DominantGoalSnapshot | null>;
  readonly dominantConcern: InterpretedField<string | null>;
  readonly proactiveBehavior: InterpretedField<ProactiveBehaviorSummary | null>;
  readonly confidence: number;
  readonly lastUpdated: string;
  readonly missingData: readonly string[];
};

export function toInterpretedField<T>(output: RuleOutput<T>): InterpretedField<T> {
  return {
    value: output.value,
    confidence: output.confidence,
    explanation: output.explanation,
    reasons: output.reasons,
  };
}

export function computeGlobalConfidence(
  fields: readonly InterpretedField<unknown>[],
): number {
  const scored = fields.filter(
    (field) => field.value !== null && field.value !== undefined && field.confidence > 0,
  );
  if (scored.length === 0) return 0.15;
  const total = scored.reduce((sum, field) => sum + field.confidence, 0);
  return Math.round((total / scored.length) * 100) / 100;
}
