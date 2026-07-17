import type { LifeProposalCategory } from "./lifeContext";

export type DecisionFactor = {
  id: string;
  label: string;
  positive: boolean;
};

export type LifeDecisionAlternative = {
  title: string;
  category: LifeProposalCategory | string;
  reason: string;
};

export type LifeDecisionExplanation = {
  why: string;
  whyNow: string;
  whyNotOther: string;
  fullText: string;
};

export type LifeDecision = {
  proposalId: string;
  category: LifeProposalCategory;
  reason: string;
  priority: "high" | "medium" | "low";
  confidence: number;
  factors: DecisionFactor[];
  alternatives: LifeDecisionAlternative[];
  explanation: LifeDecisionExplanation;
};
