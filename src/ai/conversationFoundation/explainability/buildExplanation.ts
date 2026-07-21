/**
 * EPIC 4A/4B — Explainability layer for assistant responses.
 */

import type { HumanModel } from "../../humanModelFoundation";
import type { AssistantConversationContext } from "../types/assistantContext";
import type { AssistantExplanation } from "../types/responseContract";
import type { IntentClassification } from "../types/intents";

export function buildAssistantExplanation({
  context,
  humanModel,
  classification,
  usedSourceIds,
  missingData,
}: {
  context: AssistantConversationContext;
  humanModel: HumanModel;
  classification: IntentClassification;
  usedSourceIds: readonly string[];
  missingData?: readonly string[];
}): AssistantExplanation {
  const sources = context.sources.filter((source) =>
    usedSourceIds.includes(source.id),
  );

  const humanModelMissing = humanModel.missingData.slice(0, 5);
  const gaps = [
    ...(missingData ?? []),
    ...humanModelMissing,
    ...context.gaps.filter((gap) =>
      (missingData ?? humanModelMissing).some((item) => gap.includes(item)),
    ),
  ].filter((item, index, array) => array.indexOf(item) === index);

  const humanModelSummary = humanModel.currentState.value
    ? ` Human Model : ${humanModel.currentState.value.label} (${Math.round(humanModel.confidence * 100)} %).`
    : "";

  return {
    summary: `Réponse basée sur l'intention « ${classification.intent} » (${Math.round(classification.confidence * 100)} % de confiance).${humanModelSummary}`,
    reasoning: classification.reason,
    sources,
    missingData: gaps.length > 0 ? gaps : context.gaps.slice(0, 3),
    humanModelReasons: {
      energy: humanModel.energy.reasons,
      mentalLoad: humanModel.mentalLoad.reasons,
      motivation: humanModel.motivation.reasons,
      availability: humanModel.availability.reasons,
    },
  };
}
