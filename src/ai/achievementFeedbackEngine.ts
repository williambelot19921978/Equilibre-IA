import type {
  AchievementFeedback,
  AchievementFeedbackInput,
  CelebrationLevel,
} from "../types/achievementFeedback";
import { resolveCompletionStatusLabel } from "../lib/planning/resolveCompletionStatusLabel";

type FeedbackVariant = Omit<AchievementFeedback, "statusLabel"> & { id: string };

function pickVariant(
  variants: FeedbackVariant[],
  recentFeedbackIds: string[] = [],
): FeedbackVariant {
  const filtered = variants.filter(
    (variant) => !recentFeedbackIds.slice(-3).includes(variant.id),
  );
  const pool = filtered.length > 0 ? filtered : variants;
  const index = Math.abs(hashString(pool.map((v) => v.id).join("|"))) % pool.length;
  return pool[index]!;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const CELEBRATION_RANK: Record<CelebrationLevel, number> = {
  discrete: 0,
  normal: 1,
  important: 2,
};

function maxCelebrationLevel(
  a: CelebrationLevel,
  b: CelebrationLevel,
): CelebrationLevel {
  return CELEBRATION_RANK[a] >= CELEBRATION_RANK[b] ? a : b;
}

function resolveCelebrationLevel(input: AchievementFeedbackInput): CelebrationLevel {
  if (input.isPartialWorkout) return "discrete";
  if ((input.skipCount ?? 0) >= 3) return "important";
  if (input.completionTiming === "early" && Math.abs(input.deltaMinutes ?? 0) >= 10) {
    return "important";
  }
  if (input.isWorkout && !input.isPartialWorkout) return "normal";
  if (input.priority === "high" || input.priority === "urgent") return "important";
  if ((input.durationMinutes ?? 0) <= 10) return "discrete";
  return "normal";
}

function sportVariants(input: AchievementFeedbackInput): FeedbackVariant[] {
  if (input.isPartialWorkout) {
    return [
      {
        id: "sport-partial-1",
        title: "Séance partielle",
        message: "Tu as avancé malgré tout — c'est déjà une bonne chose.",
        tone: "reflective",
        icon: "◐",
        celebrationLevel: "discrete",
      },
    ];
  }

  if (input.completionTiming === "early") {
    return [
      {
        id: "sport-early-1",
        title: "Séance effectuée",
        message: "Séance effectuée en avance — bien joué !",
        tone: "celebratory",
        icon: "✓",
        celebrationLevel: "important",
        followUpSuggestion: input.deltaMinutes
          ? `Tu viens de libérer ${Math.abs(input.deltaMinutes)} minutes pour la suite.`
          : undefined,
      },
      {
        id: "sport-early-2",
        title: "Séance effectuée",
        message: "Bravo, séance terminée plus tôt que prévu.",
        tone: "encouraging",
        icon: "✓",
        celebrationLevel: "important",
      },
      {
        id: "sport-early-3",
        title: "Séance effectuée",
        message: "Très bien — tu viens de libérer du temps pour la suite.",
        tone: "calm",
        icon: "✓",
        celebrationLevel: "normal",
      },
    ];
  }

  return [
    {
      id: "sport-done-1",
      title: "Séance effectuée",
      message: "Séance effectuée. Bien joué !",
      tone: "encouraging",
      icon: "✓",
      celebrationLevel: "normal",
    },
    {
      id: "sport-done-2",
      title: "Séance effectuée",
      message: "C'est fait — belle régularité aujourd'hui.",
      tone: "calm",
      icon: "✓",
      celebrationLevel: "normal",
    },
    {
      id: "sport-done-3",
      title: "Séance effectuée",
      message: "Bravo, séance terminée.",
      tone: "encouraging",
      icon: "✓",
      celebrationLevel: "normal",
    },
  ];
}

function taskVariants(input: AchievementFeedbackInput): FeedbackVariant[] {
  if ((input.skipCount ?? 0) >= 3) {
    return [
      {
        id: "task-recovery-1",
        title: "Belle reprise",
        message:
          "Tu l'avais repoussée plusieurs fois et tu viens de la terminer. Belle reprise.",
        tone: "reflective",
        icon: "↺",
        celebrationLevel: "important",
      },
      {
        id: "task-recovery-2",
        title: "Objectif repris",
        message:
          "Tu l'avais repoussée plusieurs fois — c'est fait, bravo pour cette reprise.",
        tone: "encouraging",
        icon: "↺",
        celebrationLevel: "important",
      },
    ];
  }

  if (input.completionTiming === "early") {
    return [
      {
        id: "task-early-1",
        title: "En avance",
        message: "Objectif réalisé en avance — excellent travail.",
        tone: "celebratory",
        icon: "✓",
        celebrationLevel: "important",
      },
      {
        id: "task-early-2",
        title: "En avance",
        message: "Tu as terminé plus tôt que prévu. Bien joué !",
        tone: "encouraging",
        icon: "✓",
        celebrationLevel: "normal",
      },
      {
        id: "task-early-3",
        title: "Mission accomplie",
        message: "Mission accomplie avec de l'avance.",
        tone: "calm",
        icon: "✓",
        celebrationLevel: "normal",
      },
    ];
  }

  if (
    input.energyLevel === "tired" ||
    input.energyLevel === "exhausted" ||
    input.energyLevel === "sick"
  ) {
    return [
      {
        id: "task-fatigue-1",
        title: "Réussite malgré tout",
        message:
          "Malgré une journée difficile, tu as avancé. C'est une vraie réussite.",
        tone: "reflective",
        icon: "✓",
        celebrationLevel: "normal",
      },
    ];
  }

  return [
    {
      id: "task-done-1",
      title: "Terminé",
      message: "C'est fait — une chose de moins sur ta liste.",
      tone: "calm",
      icon: "✓",
      celebrationLevel: "discrete",
    },
    {
      id: "task-done-2",
      title: "Terminé",
      message: "Objectif coché. Continue comme ça.",
      tone: "encouraging",
      icon: "✓",
      celebrationLevel: "normal",
    },
    {
      id: "task-done-3",
      title: "Terminé",
      message: "Bien joué, c'est terminé.",
      tone: "encouraging",
      icon: "✓",
      celebrationLevel: "normal",
    },
  ];
}

export function resolveAchievementFeedback(
  input: AchievementFeedbackInput,
): AchievementFeedback {
  const celebrationLevel = resolveCelebrationLevel(input);
  const statusLabel = resolveCompletionStatusLabel({
    activityCategory: input.activityCategory,
    isWorkout: input.isWorkout,
    title: input.title,
  });

  const variants =
    input.isWorkout || input.activityCategory === "sport"
      ? sportVariants(input)
      : taskVariants(input);

  const picked = pickVariant(variants, input.recentFeedbackIds);
  const level = maxCelebrationLevel(
    picked.celebrationLevel ?? "normal",
    celebrationLevel,
  );

  return {
    ...picked,
    celebrationLevel: level,
    statusLabel,
  };
}

export function resolveRecentFeedbackIdsFromStorage(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem("equilibre_recent_feedback_ids");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function rememberFeedbackId(feedbackId: string): void {
  if (typeof sessionStorage === "undefined") return;
  const recent = resolveRecentFeedbackIdsFromStorage();
  const next = [...recent, feedbackId].slice(-8);
  sessionStorage.setItem("equilibre_recent_feedback_ids", JSON.stringify(next));
}
