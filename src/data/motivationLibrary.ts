import { pickSpiritualContent } from "./spiritualContentLibrary";

export type MotivationItem = {
  id: string;
  kind: "neutral" | "spiritual";
  title: string;
  text: string;
  reference?: string;
};

export const NEUTRAL_MOTIVATION_LIBRARY: MotivationItem[] = [
  {
    id: "mot-1",
    kind: "neutral",
    title: "Motivation",
    text: "Une journée à la fois. Tu n’as pas besoin de tout faire aujourd’hui.",
  },
  {
    id: "mot-2",
    kind: "neutral",
    title: "Motivation",
    text: "Protège ton énergie : un petit pas bien fait vaut mieux qu’un grand plan épuisant.",
  },
  {
    id: "mot-3",
    kind: "neutral",
    title: "Motivation",
    text: "Tu avances déjà en prenant soin de ton équilibre familial et personnel.",
  },
];

export function pickMotivationContent({
  faithImportance,
  spiritualPreferences = [],
  recentIds = [],
  useSpiritual,
}: {
  faithImportance?: string;
  spiritualPreferences?: string[];
  recentIds?: string[];
  useSpiritual?: boolean;
}): MotivationItem {
  const shouldUseSpiritual =
    useSpiritual &&
    faithImportance !== "disabled" &&
    (faithImportance === "important" ||
      faithImportance === "discreet" ||
      faithImportance === "when_needed");

  if (!shouldUseSpiritual) {
    const pool = NEUTRAL_MOTIVATION_LIBRARY.filter(
      (item) => !recentIds.includes(item.id),
    );
    return (
      pool[Math.floor(Math.random() * pool.length)] ??
      NEUTRAL_MOTIVATION_LIBRARY[0]
    );
  }

  const spiritual = pickSpiritualContent({
    preferences: spiritualPreferences,
    recentIds,
  });

  return {
    id: spiritual.id,
    kind: "spiritual",
    title: spiritual.type === "verse" ? "Verset du jour" : "Moment spirituel",
    text: spiritual.text,
    reference: spiritual.reference,
  };
}
