export type DailyCheckinMood =
  | "great"
  | "good"
  | "okay"
  | "tired"
  | "exhausted"
  | "stressed"
  | "sick";

export type DailyCheckinRecord = {
  id: string;
  user_id: string;
  household_id: string | null;
  checkin_date: string;
  energy_level: string | null;
  fatigue_level: string | null;
  stress_level: string | null;
  mood: DailyCheckinMood;
  intensity: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyCheckinInput = {
  mood: DailyCheckinMood;
  intensity?: number | null;
  note?: string | null;
};

export const DAILY_CHECKIN_MOOD_OPTIONS: Array<{
  value: DailyCheckinMood;
  label: string;
  emoji: string;
}> = [
  { value: "great", label: "En pleine forme", emoji: "⚡" },
  { value: "good", label: "Bien", emoji: "🙂" },
  { value: "okay", label: "Moyen", emoji: "😐" },
  { value: "tired", label: "Fatigué", emoji: "😴" },
  { value: "exhausted", label: "Épuisé", emoji: "🪫" },
  { value: "stressed", label: "Stressé", emoji: "😰" },
  { value: "sick", label: "Malade", emoji: "🤒" },
];

export type CheckinPlanningImpact = {
  energyLevel: "high" | "medium" | "low" | "variable";
  fatigueLevel: "low" | "medium" | "high";
  stressLevel: "low" | "medium" | "high";
  maxFillRatioMultiplier: number;
  avoidIntenseSport: boolean;
  preferCalmActivities: boolean;
  minimalPlanning: boolean;
  adaptations: string[];
};

export function resolveCheckinPlanningImpact(
  mood: DailyCheckinMood,
  intensity?: number | null,
): CheckinPlanningImpact {
  const level = intensity ?? 3;

  switch (mood) {
    case "great":
      return {
        energyLevel: "high",
        fatigueLevel: "low",
        stressLevel: "low",
        maxFillRatioMultiplier: 1,
        avoidIntenseSport: false,
        preferCalmActivities: false,
        minimalPlanning: false,
        adaptations: ["Tu es en forme — le planning prévu est conservé."],
      };
    case "good":
      return {
        energyLevel: "medium",
        fatigueLevel: "low",
        stressLevel: "low",
        maxFillRatioMultiplier: 1,
        avoidIntenseSport: false,
        preferCalmActivities: false,
        minimalPlanning: false,
        adaptations: [],
      };
    case "okay":
      return {
        energyLevel: "medium",
        fatigueLevel: level <= 2 ? "medium" : "low",
        stressLevel: "medium",
        maxFillRatioMultiplier: 0.9,
        avoidIntenseSport: false,
        preferCalmActivities: false,
        minimalPlanning: false,
        adaptations: ["Journée moyenne — un peu plus de marge conservée."],
      };
    case "tired":
      return {
        energyLevel: "low",
        fatigueLevel: "high",
        stressLevel: "medium",
        maxFillRatioMultiplier: 0.75,
        avoidIntenseSport: true,
        preferCalmActivities: true,
        minimalPlanning: false,
        adaptations: [
          "Tu es fatigué — remplissage réduit et sport intense évité.",
        ],
      };
    case "exhausted":
      return {
        energyLevel: "low",
        fatigueLevel: "high",
        stressLevel: "high",
        maxFillRatioMultiplier: 0.55,
        avoidIntenseSport: true,
        preferCalmActivities: true,
        minimalPlanning: true,
        adaptations: [
          "Tu es épuisé — seules les priorités essentielles sont conservées.",
        ],
      };
    case "stressed":
      return {
        energyLevel: "medium",
        fatigueLevel: "medium",
        stressLevel: "high",
        maxFillRatioMultiplier: 0.8,
        avoidIntenseSport: true,
        preferCalmActivities: true,
        minimalPlanning: false,
        adaptations: [
          "Tu es stressé — marges augmentées et activités calmes privilégiées.",
        ],
      };
    case "sick":
      return {
        energyLevel: "low",
        fatigueLevel: "high",
        stressLevel: "medium",
        maxFillRatioMultiplier: 0.45,
        avoidIntenseSport: true,
        preferCalmActivities: true,
        minimalPlanning: true,
        adaptations: [
          "Tu es malade — planning minimal. L’application ne remplace pas un professionnel de santé.",
        ],
      };
    default:
      return resolveCheckinPlanningImpact("good");
  }
}
