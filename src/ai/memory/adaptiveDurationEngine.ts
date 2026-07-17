import type {
  AdaptiveSuggestion,
  EvolvingGoalSuggestion,
  LivingHabitProfile,
} from "../../types/livingMemory";
import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";
import { clampConfidence } from "./livingMemoryUtils";

export function buildAdaptiveSuggestions(
  habitProfile: LivingHabitProfile,
): AdaptiveSuggestion[] {
  const suggestions: AdaptiveSuggestion[] = [];

  if (habitProfile.preferredWorkoutDuration) {
    const duration = habitProfile.preferredWorkoutDuration.value;
    suggestions.push({
      id: "adapt-sport-duration",
      domain: "sport",
      message: `Je remarque que tu fais souvent tes séances en ${duration} minutes. Je vais désormais te proposer plutôt des séances de ${duration} minutes.`,
      previousValue: "25 min (par défaut)",
      suggestedValue: `${duration} min`,
      confidence: habitProfile.preferredWorkoutDuration.confidence,
      evidence: [
        `${habitProfile.preferredWorkoutDuration.sampleSize} séances analysées`,
        `Durée moyenne : ${duration} min`,
      ],
    });
  }

  if (habitProfile.averageStudyDuration) {
    const duration = habitProfile.averageStudyDuration.value;
    suggestions.push({
      id: "adapt-study-duration",
      domain: "study",
      message: `Tes révisions terminées durent souvent ${duration} minutes — je calibrerai mes propositions en conséquence.`,
      previousValue: "30 min (par défaut)",
      suggestedValue: `${duration} min`,
      confidence: habitProfile.averageStudyDuration.confidence,
      evidence: [
        `${habitProfile.averageStudyDuration.sampleSize} sessions analysées`,
      ],
    });
  }

  if (habitProfile.preferredFreeTimeBlocks) {
    suggestions.push({
      id: "adapt-calm-blocks",
      domain: "calm",
      message:
        "Tu prends souvent un temps calme en fin de journée — je privilégierai ces créneaux.",
      previousValue: "Créneaux variés",
      suggestedValue: habitProfile.preferredFreeTimeBlocks.value.join(", "),
      confidence: habitProfile.preferredFreeTimeBlocks.confidence,
      evidence: [
        `${habitProfile.preferredFreeTimeBlocks.sampleSize} moments calmes observés`,
      ],
    });
  }

  if (habitProfile.preferredCoupleTime) {
    suggestions.push({
      id: "adapt-couple-time",
      domain: "couple",
      message: `Je note que le ${habitProfile.preferredCoupleTime.value} convient souvent pour du temps couple.`,
      previousValue: "Non déterminé",
      suggestedValue: habitProfile.preferredCoupleTime.value,
      confidence: habitProfile.preferredCoupleTime.confidence,
      evidence: [
        `${habitProfile.preferredCoupleTime.sampleSize} moments couple observés`,
      ],
    });
  }

  if (habitProfile.favoriteLeisureActivities) {
    const activities = habitProfile.favoriteLeisureActivities.value.join(", ");
    suggestions.push({
      id: "adapt-leisure",
      domain: "leisure",
      message: `Tes loisirs favoris semblent être : ${activities}.`,
      previousValue: "Suggestions génériques",
      suggestedValue: activities,
      confidence: habitProfile.favoriteLeisureActivities.confidence,
      evidence: [
        `${habitProfile.favoriteLeisureActivities.sampleSize} activités loisir analysées`,
      ],
    });
  }

  return suggestions.filter((item) => item.confidence >= 45);
}

export function buildEvolvingGoalSuggestions({
  habitProfile,
  statistics,
}: {
  habitProfile: LivingHabitProfile;
  statistics?: PeriodStatistics | null;
}): EvolvingGoalSuggestion[] {
  const suggestions: EvolvingGoalSuggestion[] = [];
  const studyProgress = statistics?.study.progressPercent ?? 0;
  const studyGoal = statistics?.study.weeklyGoalMinutes ?? 0;

  if (studyGoal > 0) {
    if (studyProgress >= 95 && (habitProfile.averageStudyDuration?.sampleSize ?? 0) >= 3) {
      suggestions.push({
        id: "goal-study-increase",
        domain: "study",
        direction: "increase",
        title: "Augmenter légèrement l'objectif de révision",
        explanation:
          "Tu atteins souvent ton objectif hebdomadaire — on pourrait viser un peu plus, si tu le souhaites.",
        confidence: clampConfidence(55 + studyProgress * 0.3),
        evidence: [
          `${Math.round(studyProgress)} % de l'objectif atteint cette semaine`,
          `${habitProfile.averageStudyDuration?.sampleSize ?? 0} sessions terminées`,
        ],
      });
    } else if (studyProgress < 45 && (habitProfile.averageCancellationRate?.value ?? 0) >= 0.35) {
      suggestions.push({
        id: "goal-study-decrease",
        domain: "study",
        direction: "decrease",
        title: "Réduire l'objectif de révision cette semaine",
        explanation:
          "Tu reportes souvent des activités — un objectif plus léger pourrait t'aider à avancer sans pression.",
        confidence: clampConfidence(58),
        evidence: [
          `${Math.round(studyProgress)} % seulement cette semaine`,
          `Taux d'annulation : ${Math.round((habitProfile.averageCancellationRate?.value ?? 0) * 100)} %`,
        ],
      });
    }
  }

  const sportSessions = statistics?.workout.completedSessions ?? 0;
  const sportGoal =
    sportSessions > 0 ||
    (habitProfile.preferredWorkoutDuration?.sampleSize ?? 0) >= 2
      ? 3
      : 0;
  if (sportGoal > 0) {
    if (sportSessions >= sportGoal && (habitProfile.preferredWorkoutDuration?.confidence ?? 0) >= 60) {
      suggestions.push({
        id: "goal-sport-increase",
        domain: "sport",
        direction: "increase",
        title: "Viser une séance de plus",
        explanation:
          "Tu tiens bien ton rythme sportif — une séance supplémentaire pourrait être envisageable.",
        confidence: 62,
        evidence: [
          `${sportSessions}/${sportGoal} séances cette semaine`,
          `Durée typique : ${habitProfile.preferredWorkoutDuration?.value ?? 25} min`,
        ],
      });
    } else if (sportSessions < sportGoal * 0.5 && (habitProfile.averageCancellationRate?.value ?? 0) >= 0.3) {
      suggestions.push({
        id: "goal-sport-decrease",
        domain: "sport",
        direction: "decrease",
        title: "Alléger l'objectif sport cette semaine",
        explanation:
          "Plusieurs séances ont été reportées — viser moins cette semaine peut être plus réaliste.",
        confidence: 60,
        evidence: [
          `${sportSessions}/${sportGoal} séances cette semaine`,
          "Reports fréquents observés",
        ],
      });
    }
  }

  return suggestions;
}

export function resolveAdaptiveSportDuration(
  habitProfile: LivingHabitProfile | null | undefined,
  fallback = 25,
): number {
  return habitProfile?.preferredWorkoutDuration?.value ?? fallback;
}

export function resolveAdaptiveStudyDuration(
  habitProfile: LivingHabitProfile | null | undefined,
  fallback = 30,
): number {
  return habitProfile?.averageStudyDuration?.value ?? fallback;
}

export function resolveAdaptiveCalmDuration(
  habitProfile: LivingHabitProfile | null | undefined,
  fallback = 15,
): number {
  const sportDuration = habitProfile?.preferredWorkoutDuration?.value;
  if (sportDuration && sportDuration <= 20) return 10;
  return fallback;
}
