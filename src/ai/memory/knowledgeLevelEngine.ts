import type {
  KnowledgeLevel,
  KnowledgeLevelId,
  LivingInsight,
} from "../../types/livingMemory";
import { KNOWLEDGE_LEVEL_LABELS } from "../../types/livingMemory";
import { clampConfidence } from "./livingMemoryUtils";

export type ResolveKnowledgeLevelInput = {
  dataPointCount: number;
  accountAgeDays: number;
  confirmedInsights: number;
  insights: LivingInsight[];
};

const LEVEL_THRESHOLDS: Array<{ id: KnowledgeLevelId; minScore: number }> = [
  { id: "starting", minScore: 0 },
  { id: "understanding", minScore: 35 },
  { id: "know_well", minScore: 65 },
  { id: "anticipating", minScore: 85 },
];

function resolveLevelId(score: number): KnowledgeLevelId {
  let current: KnowledgeLevelId = "starting";
  for (const level of LEVEL_THRESHOLDS) {
    if (score >= level.minScore) {
      current = level.id;
    }
  }
  return current;
}

function nextLevelLabel(id: KnowledgeLevelId): string | undefined {
  const index = LEVEL_THRESHOLDS.findIndex((level) => level.id === id);
  const next = LEVEL_THRESHOLDS[index + 1];
  return next ? KNOWLEDGE_LEVEL_LABELS[next.id] : undefined;
}

function progressWithinLevel(score: number, id: KnowledgeLevelId): number {
  const index = LEVEL_THRESHOLDS.findIndex((level) => level.id === id);
  const currentMin = LEVEL_THRESHOLDS[index]?.minScore ?? 0;
  const nextMin = LEVEL_THRESHOLDS[index + 1]?.minScore ?? 100;
  if (nextMin === currentMin) return 100;
  return clampConfidence(
    ((score - currentMin) / (nextMin - currentMin)) * 100,
  );
}

export function computeKnowledgeScore({
  dataPointCount,
  accountAgeDays,
  confirmedInsights,
  insights,
}: ResolveKnowledgeLevelInput): number {
  const dataScore = Math.min(35, dataPointCount * 1.5);
  const ageScore = Math.min(25, accountAgeDays * 0.4);
  const confirmationScore = Math.min(20, confirmedInsights * 5);
  const avgConfidence =
    insights.length > 0
      ? insights.reduce((sum, insight) => sum + insight.confidence, 0) /
        insights.length
      : 0;
  const confidenceScore = Math.min(20, avgConfidence * 0.2);

  return clampConfidence(dataScore + ageScore + confirmationScore + confidenceScore);
}

export function resolveKnowledgeLevel(
  input: ResolveKnowledgeLevelInput,
): KnowledgeLevel {
  const score = computeKnowledgeScore(input);
  const id = resolveLevelId(score);

  return {
    id,
    label: KNOWLEDGE_LEVEL_LABELS[id],
    score,
    nextLabel: nextLevelLabel(id),
    progressPercent: progressWithinLevel(score, id),
  };
}

export function resolveCoachPersonality(
  knowledgeLevel: KnowledgeLevel,
): string {
  switch (knowledgeLevel.id) {
    case "starting":
      return "Je découvre encore ton fonctionnement.";
    case "understanding":
      return "Je commence à bien comprendre ton rythme.";
    case "know_well":
      return "Je connais bien tes habitudes et je m'adapte progressivement.";
    case "anticipating":
      return "Je peux désormais anticiper certaines de tes décisions.";
    default:
      return "Je découvre encore ton fonctionnement.";
  }
}

export function computeGlobalConfidence(insights: LivingInsight[]): number {
  if (insights.length === 0) return 15;
  const active = insights.filter(
    (insight) => insight.status !== "rejected" && insight.status !== "deferred",
  );
  if (active.length === 0) return 15;
  return clampConfidence(
    active.reduce((sum, insight) => sum + insight.confidence, 0) / active.length,
  );
}
