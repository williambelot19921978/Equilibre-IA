import type { NlpIntent } from "../../types/nlp";

export type ColloquialPatternEntry = {
  id: string;
  /** Pattern testé sur le noyau normalisé de l'expression */
  pattern: RegExp;
  resolvedIntent: NlpIntent;
  resolvedMeaning: string;
  bootstrapConfidence: number;
};

/**
 * Registre bootstrap — données linguistiques génériques, pas des mémoires utilisateur.
 * Le moteur itère ce registre ; aucune expression n'est codée dans resolvePersonalExpression.
 */
export const COLLOQUIAL_PATTERN_REGISTRY: ColloquialPatternEntry[] = [
  {
    id: "colloquial-sec",
    pattern: /^je suis sec$/,
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "fatigue",
    bootstrapConfidence: 0.55,
  },
  {
    id: "colloquial-rince",
    pattern: /^je suis rince$/,
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "fatigue",
    bootstrapConfidence: 0.58,
  },
  {
    id: "colloquial-ko",
    pattern: /^je suis ko$/,
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "fatigue",
    bootstrapConfidence: 0.62,
  },
  {
    id: "colloquial-explose",
    pattern: /^je suis explose$/,
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "surcharge ou fatigue",
    bootstrapConfidence: 0.56,
  },
  {
    id: "colloquial-plat",
    pattern: /^je suis a plat$/,
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "épuisement",
    bootstrapConfidence: 0.6,
  },
  {
    id: "colloquial-mort",
    pattern: /^je suis mort$/,
    resolvedIntent: "declare_fatigue",
    resolvedMeaning: "fatigue (expression familière)",
    bootstrapConfidence: 0.52,
  },
];

export function findColloquialPatternMatches(coreExpression: string): ColloquialPatternEntry[] {
  return COLLOQUIAL_PATTERN_REGISTRY.filter((entry) => entry.pattern.test(coreExpression));
}
