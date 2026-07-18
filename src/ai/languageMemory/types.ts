import type { NlpIntent } from "../../types/nlp";

export type LanguageExpressionStatus =
  | "candidate"
  | "learning"
  | "confirmed"
  | "rejected"
  | "archived";

export type LanguageContextTimeOfDay =
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

export type LanguageContextPlanningLoad = "light" | "moderate" | "heavy";

export type LanguageContextFingerprint = {
  timeOfDay: LanguageContextTimeOfDay;
  recentSport: boolean;
  planningLoad: LanguageContextPlanningLoad;
  nlpIntent: NlpIntent;
  lastUserTopic?: string | null;
  sleepHoursRecent?: number | null;
};

export type LanguageExpressionMemory = {
  id: string;
  userId: string;
  normalizedExpression: string;
  originalExamples: string[];
  resolvedIntent: NlpIntent;
  resolvedMeaning: string;
  confidence: number;
  confirmationCount: number;
  rejectionCount: number;
  usageCount: number;
  contexts: LanguageContextFingerprint[];
  status: LanguageExpressionStatus;
  createdAt: string;
  lastUsedAt: string | null;
  lastConfirmedAt: string | null;
  updatedAt: string;
};

export type LanguageHypothesis = {
  id: string;
  normalizedExpression: string;
  originalText: string;
  resolvedIntent: NlpIntent;
  resolvedMeaning: string;
  confidence: number;
  source: "personal_memory" | "bootstrap_pattern" | "context_inference";
  expressionMemoryId?: string | null;
};

export type LanguageResolutionMode =
  | "direct"
  | "needs_confirmation"
  | "neutral_question"
  | "no_match";

export type LanguageResolution = {
  mode: LanguageResolutionMode;
  normalizedExpression: string;
  originalText: string;
  hypothesis: LanguageHypothesis | null;
  hypotheses: LanguageHypothesis[];
  matchedMemory: LanguageExpressionMemory | null;
  contextFingerprint: LanguageContextFingerprint;
  confidence: number;
  explanation: string;
};

export type LanguageConfirmationRequest = {
  hypothesis: LanguageHypothesis;
  prompt: string;
  expiresAt: string;
  normalizedExpression: string;
  originalText: string;
};

export type LanguageLearningEventType =
  | "hypothesis"
  | "confirm"
  | "reject"
  | "usage"
  | "decay"
  | "archive"
  | "reactivate";

export type LanguageLearningEvent = {
  id: string;
  userId: string;
  expressionId: string | null;
  eventType: LanguageLearningEventType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PersonalLanguageLearningInput = {
  userId: string;
  originalText: string;
  normalizedExpression: string;
  resolvedIntent: NlpIntent;
  resolvedMeaning: string;
  context: LanguageContextFingerprint;
  existing?: LanguageExpressionMemory | null;
};
