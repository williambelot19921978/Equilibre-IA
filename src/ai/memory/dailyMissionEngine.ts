import type { DailyCheckinRecord } from "../../types/dailyCheckin";
import type {
  DailyMission,
  HabitTrend,
  LivingHabitProfile,
  LivingInsight,
} from "../../types/livingMemory";
import type { LifeContext } from "../../types/lifeContext";
import type { PeriodStatistics } from "../../lib/statistics/getStatisticsForPeriod";

export type GenerateDailyMissionInput = {
  referenceDate: string;
  lifeContext?: LifeContext | null;
  habitProfile: LivingHabitProfile;
  insights: LivingInsight[];
  trends: HabitTrend[];
  statistics?: PeriodStatistics | null;
  checkins: DailyCheckinRecord[];
};

function buildMission(
  partial: Omit<DailyMission, "id"> & { id?: string },
  referenceDate: string,
): DailyMission {
  return {
    id: partial.id ?? `daily-mission-${referenceDate}`,
    ...partial,
  };
}

export function generateDailyMission(
  input: GenerateDailyMissionInput,
): DailyMission | null {
  const {
    referenceDate,
    lifeContext,
    habitProfile,
    insights,
    trends,
    statistics,
    checkins,
  } = input;

  const todayCheckin = checkins.find(
    (checkin) => checkin.checkin_date === referenceDate,
  );
  const tired =
    todayCheckin?.mood === "tired" ||
    todayCheckin?.mood === "exhausted" ||
    todayCheckin?.mood === "sick" ||
    lifeContext?.energyPrediction === "low";

  const studyProgress = statistics?.study.progressPercent ?? 0;
  const studyGoal = statistics?.study.weeklyGoalMinutes ?? 0;
  const sportDone = lifeContext?.workoutCompletedToday ?? false;
  const studyInsight = insights.find((insight) =>
    insight.category.includes("study"),
  );

  if (tired) {
    return buildMission(
      {
        category: "rest",
        title: "Mission du jour",
        description: "Accorder-toi une vraie pause sans culpabilité.",
        reasoning:
          "Ton énergie est fragile aujourd'hui — une mission légère protège ton équilibre.",
        evidence: [
          todayCheckin ? `Check-in : ${todayCheckin.mood}` : "Énergie basse détectée",
        ],
      },
      referenceDate,
    );
  }

  if (
    studyGoal > 0 &&
    studyProgress < 60 &&
    !lifeContext?.activityCompletion?.studyDone
  ) {
    const duration = habitProfile.averageStudyDuration?.value ?? 30;
    const timing = studyInsight?.label ?? "révision";
    return buildMission(
      {
        category: "study",
        title: "Mission du jour",
        description: `Consacrer ${duration} minutes sans interruption à ta formation.`,
        reasoning: `Objectif révision à ${Math.round(studyProgress)} % — ${timing} semble te convenir.`,
        evidence: [
          `${Math.round(studyProgress)} % de l'objectif hebdo`,
          studyInsight?.detail ?? "Révisions en cours cette semaine",
        ],
      },
      referenceDate,
    );
  }

  if (!sportDone && (lifeContext?.sportPossible ?? true)) {
    const duration = habitProfile.preferredWorkoutDuration?.value ?? 25;
    const lateTrend = trends.find((trend) => trend.id === "trend-sport-late-evening");
    return buildMission(
      {
        category: "sport",
        title: "Mission du jour",
        description: `Bouger ${duration} minutes, sans viser la perfection.`,
        reasoning: lateTrend
          ? "Je te propose une séance plus tôt — le sport tardif est souvent reporté."
          : "Une séance adaptée à ta durée habituelle suffit.",
        evidence: [
          `Durée typique : ${duration} min`,
          lateTrend?.detail ?? "Sport pas encore fait aujourd'hui",
        ],
      },
      referenceDate,
    );
  }

  if (lifeContext?.freeEvening && lifeContext.childrenPresent) {
    return buildMission(
      {
        category: "family",
        title: "Mission du jour",
        description: "Profiter pleinement de la soirée en famille.",
        reasoning:
          "Tu as une soirée disponible avec les proches — c'est une priorité humaine.",
        evidence: ["Soirée libre", "Enfants présents"],
      },
      referenceDate,
    );
  }

  if (lifeContext?.partnerPresent && !sportDone) {
    return buildMission(
      {
        category: "couple",
        title: "Mission du jour",
        description: "Prendre un moment de qualité à deux, même court.",
        reasoning: "Le temps couple renforce ton équilibre global.",
        evidence: ["Partenaire présent"],
      },
      referenceDate,
    );
  }

  const calmInsight = insights.find((insight) => insight.id === "calm-after-work");
  if (calmInsight) {
    return buildMission(
      {
        category: "calm",
        title: "Mission du jour",
        description: "Prendre 15 minutes de temps calme pour respirer.",
        reasoning: calmInsight.detail,
        evidence: calmInsight.evidence,
      },
      referenceDate,
    );
  }

  if ((statistics?.completion.postponedCount ?? 0) >= 2) {
    return buildMission(
      {
        category: "organization",
        title: "Mission du jour",
        description: "Traiter une seule tâche reportée au lieu de la décaler encore.",
        reasoning: "Les reports s'accumulent — une action unique suffit.",
        evidence: [
          `${statistics?.completion.postponedCount ?? 0} reports cette semaine`,
        ],
      },
      referenceDate,
    );
  }

  return buildMission(
    {
      category: "calm",
      title: "Mission du jour",
      description: "Préserver un moment pour toi, sans remplir la journée.",
      reasoning: "Aucune urgence claire — je te propose une mission douce.",
      evidence: ["Journée équilibrée"],
    },
    referenceDate,
  );
}
