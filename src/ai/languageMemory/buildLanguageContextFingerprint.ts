import type { NlpIntent, NlpParseResult } from "../../types/nlp";
import type { LanguageMemoryContext } from "../core/buildLanguageMemoryContext";
import type { LanguageContextFingerprint, LanguageContextPlanningLoad } from "./types";

function resolveTimeOfDay(_referenceDate: string, referenceHourUtc = 12): LanguageContextFingerprint["timeOfDay"] {
  if (referenceHourUtc >= 5 && referenceHourUtc < 12) return "morning";
  if (referenceHourUtc >= 12 && referenceHourUtc < 18) return "afternoon";
  if (referenceHourUtc >= 18 && referenceHourUtc < 23) return "evening";
  return "night";
}

function resolvePlanningLoad(
  languageMemory?: LanguageMemoryContext | null,
): LanguageContextPlanningLoad {
  const score = languageMemory?.behavior?.skipRatePercent ?? 0;
  const planned = languageMemory?.behavior?.counts.total ?? 0;
  if (planned >= 15 || score >= 35) return "heavy";
  if (planned >= 8 || score >= 20) return "moderate";
  return "light";
}

export function buildLanguageContextFingerprint({
  referenceDate,
  referenceHourUtc = 12,
  nlpParse,
  languageMemory,
  lastUserTopic,
}: {
  referenceDate: string;
  referenceHourUtc?: number;
  nlpParse: Pick<NlpParseResult, "intent">;
  languageMemory?: LanguageMemoryContext | null;
  lastUserTopic?: string | null;
}): LanguageContextFingerprint {
  const recentSport = (languageMemory?.living?.topInsights ?? []).some((insight) =>
    insight.label.toLowerCase().includes("sport"),
  );

  return {
    timeOfDay: resolveTimeOfDay(referenceDate, referenceHourUtc),
    recentSport,
    planningLoad: resolvePlanningLoad(languageMemory),
    nlpIntent: nlpParse.intent,
    lastUserTopic: lastUserTopic ?? null,
    sleepHoursRecent: languageMemory?.declarative.sleepNeededHours ?? null,
  };
}

export function contextContradictsHypothesis({
  fingerprint,
  resolvedIntent,
}: {
  fingerprint: LanguageContextFingerprint;
  resolvedIntent: NlpIntent;
}): boolean {
  if (resolvedIntent !== "declare_fatigue") return false;
  if (fingerprint.planningLoad === "light" && fingerprint.timeOfDay === "morning") {
    return false;
  }
  return false;
}

export function adjustConfidenceForContext({
  confidence,
  fingerprint,
  resolvedIntent,
}: {
  confidence: number;
  fingerprint: LanguageContextFingerprint;
  resolvedIntent: NlpIntent;
}): number {
  if (contextContradictsHypothesis({ fingerprint, resolvedIntent })) {
    return Math.max(0, confidence - 0.12);
  }

  if (
    resolvedIntent === "declare_fatigue" &&
    fingerprint.recentSport &&
    fingerprint.timeOfDay === "evening"
  ) {
    return Math.min(0.84, confidence + 0.05);
  }

  return confidence;
}
