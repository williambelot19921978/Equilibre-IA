import type { DiscoveryQuestion } from "../../config/discoveryQuestions";
import type { ProfileFactRecord } from "../../types";

export type FactValue = string | number | string[] | null | undefined;

export function hasMeaningfulFactAnswer(value: FactValue): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return false;
}

export function buildFactsValueMap(
  facts: ProfileFactRecord[],
): Map<string, FactValue> {
  return new Map(
    facts.map((fact) => [fact.fact_key, fact.fact_value?.value as FactValue]),
  );
}

export function isDiscoveryQuestionApplicable(
  question: DiscoveryQuestion,
  factsMap: Map<string, FactValue>,
): boolean {
  if (!question.dependsOn) {
    return true;
  }

  const dependencyValue = factsMap.get(question.dependsOn.key);

  return (
    typeof dependencyValue === "string" &&
    question.dependsOn.acceptedValues.includes(dependencyValue)
  );
}

export function countApplicableDiscoveryQuestions(
  questions: DiscoveryQuestion[],
  factsMap: Map<string, FactValue>,
): number {
  return questions.filter((question) =>
    isDiscoveryQuestionApplicable(question, factsMap),
  ).length;
}

export function countAnsweredDiscoveryQuestions(
  questions: DiscoveryQuestion[],
  factsMap: Map<string, FactValue>,
): number {
  return questions.filter(
    (question) =>
      isDiscoveryQuestionApplicable(question, factsMap) &&
      hasMeaningfulFactAnswer(factsMap.get(question.key)),
  ).length;
}

export function filterAvailableQuestions(
  questions: DiscoveryQuestion[],
  factsMap: Map<string, FactValue>,
): DiscoveryQuestion[] {
  return questions.filter((question) => {
    if (hasMeaningfulFactAnswer(factsMap.get(question.key))) {
      return false;
    }

    return isDiscoveryQuestionApplicable(question, factsMap);
  });
}
