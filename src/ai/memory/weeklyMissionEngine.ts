import type {
  HabitTrend,
  LivingHabitProfile,
  WeeklyMission,
} from "../../types/livingMemory";
import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";

export type GenerateWeeklyMissionInput = {
  referenceDate: string;
  habitProfile: LivingHabitProfile;
  trends: HabitTrend[];
  statistics?: PeriodStatistics | null;
};

export function generateWeeklyMission(
  input: GenerateWeeklyMissionInput,
): WeeklyMission | null {
  const { referenceDate, habitProfile, trends, statistics } = input;

  const sportDone = statistics?.workout.completedSessions ?? 0;
  const sportGoal =
    sportDone > 0 || (habitProfile.preferredWorkoutDuration?.sampleSize ?? 0) >= 2
      ? 3
      : 0;
  const studyGoalMinutes = statistics?.study.weeklyGoalMinutes ?? 0;
  const studyDoneMinutes = statistics?.study.completedMinutes ?? 0;
  const cancelRate = habitProfile.averageCancellationRate?.value ?? 0;

  if (sportGoal > 0 && sportDone < sportGoal) {
    const remaining = sportGoal - sportDone;
    const duration = habitProfile.preferredWorkoutDuration?.value ?? 25;
    return {
      id: `weekly-mission-sport-${referenceDate}`,
      title: "Mission de la semaine (facultative)",
      description: `Faire ${remaining} séance${remaining > 1 ? "s" : ""} de sport de ${duration} minutes.`,
      targetLabel: `${sportGoal} séances visées`,
      optional: true,
      reasoning:
        "Basé sur ton objectif sportif et ta durée habituelle — tu restes libre de l'ajuster.",
      evidence: [
        `${sportDone}/${sportGoal} séances déjà faites`,
        `Durée typique : ${duration} min`,
      ],
    };
  }

  if (studyGoalMinutes > 0 && studyDoneMinutes < studyGoalMinutes * 0.7) {
    const hours = Math.ceil((studyGoalMinutes - studyDoneMinutes) / 60);
    return {
      id: `weekly-mission-study-${referenceDate}`,
      title: "Mission de la semaine (facultative)",
      description: `Atteindre ${hours} heure${hours > 1 ? "s" : ""} de révision supplémentaire.`,
      targetLabel: `${Math.round(studyGoalMinutes / 60)} h visées cette semaine`,
      optional: true,
      reasoning:
        "Tu es en retard sur ton objectif révision — une mission progressive peut aider.",
      evidence: [
        `${Math.round(studyDoneMinutes / 60)} h déjà faites`,
        `${Math.round(studyGoalMinutes / 60)} h visées`,
      ],
    };
  }

  if (cancelRate >= 0.35) {
    return {
      id: `weekly-mission-no-postpone-${referenceDate}`,
      title: "Mission de la semaine (facultative)",
      description: "Ne reporter aucune activité déjà planifiée.",
      targetLabel: "Zéro report volontaire",
      optional: true,
      reasoning:
        "Tu reportes souvent — cette semaine, on peut viser la continuité sans pression.",
      evidence: trends
        .filter((trend) => trend.id.includes("postpone"))
        .flatMap((trend) => trend.evidence)
        .slice(0, 2),
    };
  }

  if (sportGoal > 0) {
    return {
      id: `weekly-mission-sport-maintain-${referenceDate}`,
      title: "Mission de la semaine (facultative)",
      description: `Maintenir ${sportGoal} séances de sport cette semaine.`,
      targetLabel: `${sportGoal} séances`,
      optional: true,
      reasoning: "Ton rythme actuel est bon — on peut le consolider.",
      evidence: [`${sportDone}/${sportGoal} séances cette semaine`],
    };
  }

  return null;
}
