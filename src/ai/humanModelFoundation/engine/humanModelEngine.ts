/**
 * EPIC 4B — Rule Engine orchestrator.
 * Exécute toutes les règles et agrège missingData + confiance.
 */

import type { AssistantConversationContext } from "../../conversationFoundation/types/assistantContext";
import {
  computeGlobalConfidence,
  toInterpretedField,
  type HumanModel,
} from "../types/humanModel";
import { toHumanModelRuleInput } from "../types/ruleTypes";
import {
  availabilityRule,
  concernRule,
  currentStateRule,
  familyPressureRule,
  fatigueRule,
  focusRule,
  goalRule,
  mentalLoadRule,
  motivationRule,
  sleepRule,
  stressRule,
  proactiveBehaviorRule,
} from "../rules";

function collectMissingData(
  context: AssistantConversationContext,
  ruleMissing: readonly (readonly string[])[],
): readonly string[] {
  const combined = [
    ...context.gaps,
    ...ruleMissing.flat(),
  ];
  return combined.filter((item, index) => combined.indexOf(item) === index);
}

export function buildHumanModel(context: AssistantConversationContext): HumanModel {
  const input = toHumanModelRuleInput(context);
  const builtAt = new Date().toISOString();

  const energyOut = fatigueRule.evaluate(input);
  const stressOut = stressRule.evaluate(input);
  const mentalLoadOut = mentalLoadRule.evaluate(input);
  const availabilityOut = availabilityRule.evaluate(input);
  const focusOut = focusRule.evaluate(input);
  const sleepOut = sleepRule.evaluate(input);
  const motivationOut = motivationRule.evaluate(input);
  const familyOut = familyPressureRule.evaluate(input);
  const goalOut = goalRule.evaluate(input);
  const concernOut = concernRule.evaluate(input);
  const proactiveOut = proactiveBehaviorRule.evaluate(input);
  const currentStateOut = currentStateRule.evaluate(input);

  const interpretedFields = [
    toInterpretedField(currentStateOut),
    toInterpretedField(energyOut),
    toInterpretedField(mentalLoadOut),
    toInterpretedField(focusOut),
    toInterpretedField(sleepOut),
    toInterpretedField(motivationOut),
    toInterpretedField(availabilityOut),
    toInterpretedField(familyOut),
    toInterpretedField(stressOut),
    toInterpretedField(goalOut),
    toInterpretedField(concernOut),
    toInterpretedField(proactiveOut),
  ];

  const missingData = collectMissingData(context, [
    energyOut.missingData,
    stressOut.missingData,
    mentalLoadOut.missingData,
    availabilityOut.missingData,
    focusOut.missingData,
    sleepOut.missingData,
    motivationOut.missingData,
    familyOut.missingData,
    goalOut.missingData,
    concernOut.missingData,
    proactiveOut.missingData,
    currentStateOut.missingData,
  ]);

  return {
    identity: {
      userId: context.user.userId,
      firstName: context.user.firstName,
      date: context.date,
    },
    currentState: toInterpretedField(currentStateOut),
    energy: toInterpretedField(energyOut),
    mentalLoad: toInterpretedField(mentalLoadOut),
    focus: toInterpretedField(focusOut),
    sleep: toInterpretedField(sleepOut),
    motivation: toInterpretedField(motivationOut),
    availability: toInterpretedField(availabilityOut),
    familyPressure: toInterpretedField(familyOut),
    stress: toInterpretedField(stressOut),
    dominantGoal: toInterpretedField(goalOut),
    dominantConcern: toInterpretedField(concernOut),
    proactiveBehavior: toInterpretedField(proactiveOut),
    confidence: computeGlobalConfidence(interpretedFields),
    lastUpdated: builtAt,
    missingData,
  };
}

export class HumanModelEngine {
  buildFromContext(context: AssistantConversationContext): HumanModel {
    return buildHumanModel(context);
  }
}

export const humanModelEngine = new HumanModelEngine();
