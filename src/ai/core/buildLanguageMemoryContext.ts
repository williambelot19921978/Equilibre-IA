import type { BaseProfileMemory, MemoryProfile } from "../memoryEngine";
import type { DiscoveryProgressSummary } from "../../lib/navigation/progressChecks";
import type { KnowledgeLevel, LivingInsight } from "../../types/livingMemory";

export type LanguageMemoryDeclarativeSnapshot = {
  workStart: string | null;
  workEnd: string | null;
  wakeTime: string | null;
  bedTime: string | null;
  mainPriority: string | null;
  sleepNeededHours: number | null;
  workDays: string[];
  onboardingCompleted: boolean;
};

export type LanguageMemoryLivingSnapshot = {
  knowledgeLevelLabel: string;
  knowledgeScore: number;
  globalConfidence: number;
  coachPersonality: string;
  topInsights: Array<Pick<LivingInsight, "id" | "label" | "detail" | "confidence">>;
  dailyMissionTitle: string | null;
  dailyMissionDescription: string | null;
};

export type LanguageMemoryDiscoverySnapshot = {
  progressPercent: number;
  remainingCount: number;
  isComplete: boolean;
};

export type BehaviorSignalCounts = {
  completed: number;
  skipped: number;
  cancelled: number;
  moved: number;
  planned: number;
  total: number;
};

export type LanguageMemoryBehaviorSnapshot = {
  windowDays: number;
  counts: BehaviorSignalCounts;
  skipRatePercent: number;
  completionRatePercent: number;
};

export type LanguageMemoryContext = {
  userId: string;
  referenceDate: string;
  declarative: LanguageMemoryDeclarativeSnapshot;
  living: LanguageMemoryLivingSnapshot | null;
  discovery: LanguageMemoryDiscoverySnapshot;
  behavior: LanguageMemoryBehaviorSnapshot | null;
  hasSufficientData: boolean;
};

export type LanguageMemoryHintType =
  | "discovery"
  | "living_insight"
  | "behavior"
  | "declarative"
  | "mission";

export type LanguageMemoryHint = {
  id: string;
  type: LanguageMemoryHintType;
  message: string;
  reason: string;
  priority: number;
};

export type BuildLanguageMemoryInput = {
  userId: string;
  referenceDate: string;
  baseProfile: BaseProfileMemory;
  profile: MemoryProfile;
  onboardingCompleted: boolean;
  discovery: DiscoveryProgressSummary;
  living?: {
    knowledgeLevel: KnowledgeLevel;
    globalConfidence: number;
    coachPersonality: string;
    insights: LivingInsight[];
    dailyMissionTitle: string | null;
    dailyMissionDescription: string | null;
  } | null;
  behavior?: LanguageMemoryBehaviorSnapshot | null;
};

export function buildDeclarativeSnapshot(
  baseProfile: BaseProfileMemory,
  profile: MemoryProfile,
  onboardingCompleted: boolean,
): LanguageMemoryDeclarativeSnapshot {
  return {
    workStart: baseProfile.workSchedule.start ?? null,
    workEnd: baseProfile.workSchedule.end ?? null,
    wakeTime: baseProfile.sleepSchedule.wakeTime ?? null,
    bedTime: baseProfile.sleepSchedule.bedTime ?? null,
    mainPriority: baseProfile.mainPriority ?? null,
    sleepNeededHours: profile.sleepNeededHours ?? null,
    workDays: profile.workDays ?? [],
    onboardingCompleted,
  };
}

export function buildLivingSnapshot(
  living: NonNullable<BuildLanguageMemoryInput["living"]>,
): LanguageMemoryLivingSnapshot {
  const topInsights = [...living.insights]
    .filter((insight) => insight.status !== "rejected")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((insight) => ({
      id: insight.id,
      label: insight.label,
      detail: insight.detail,
      confidence: insight.confidence,
    }));

  return {
    knowledgeLevelLabel: living.knowledgeLevel.label,
    knowledgeScore: living.knowledgeLevel.score,
    globalConfidence: living.globalConfidence,
    coachPersonality: living.coachPersonality,
    topInsights,
    dailyMissionTitle: living.dailyMissionTitle,
    dailyMissionDescription: living.dailyMissionDescription,
  };
}

export function buildLanguageMemoryContext(
  input: BuildLanguageMemoryInput,
): LanguageMemoryContext {
  const declarative = buildDeclarativeSnapshot(
    input.baseProfile,
    input.profile,
    input.onboardingCompleted,
  );

  const discovery: LanguageMemoryDiscoverySnapshot = {
    progressPercent: input.discovery.percentage,
    remainingCount: input.discovery.remainingCount,
    isComplete: input.discovery.isComplete,
  };

  const living = input.living ? buildLivingSnapshot(input.living) : null;

  const hasSufficientData =
    input.discovery.answeredCount > 0 ||
    living != null ||
    input.behavior != null;

  return {
    userId: input.userId,
    referenceDate: input.referenceDate,
    declarative,
    living,
    discovery,
    behavior: input.behavior ?? null,
    hasSufficientData,
  };
}
