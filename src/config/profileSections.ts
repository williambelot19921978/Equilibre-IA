import type { DiscoveryQuestion } from "./discoveryQuestions";
import { discoveryQuestions } from "./discoveryQuestions";

export type ProfileSectionId =
  | "identity"
  | "work"
  | "sleep"
  | "studies"
  | "sport"
  | "rest"
  | "spirituality"
  | "priorities";

export type ProfileSectionConfig = {
  id: ProfileSectionId;
  title: string;
  description: string;
  factKeys: string[];
  questions: DiscoveryQuestion[];
};

const QUESTION_MAP = Object.fromEntries(
  discoveryQuestions.map((question) => [question.key, question]),
);

export const PROFILE_SECTIONS: ProfileSectionConfig[] = [
  {
    id: "identity",
    title: "Identité",
    description: "Informations personnelles de base.",
    factKeys: ["partner_name", "work_schedule", "sleep_schedule", "main_priority"],
    questions: [],
  },
  {
    id: "work",
    title: "Vie professionnelle",
    description: "Horaires, trajets et énergie après le travail.",
    factKeys: ["work_days", "commute_duration", "after_work_energy"],
    questions: [
      QUESTION_MAP.work_days,
      QUESTION_MAP.commute_duration,
      QUESTION_MAP.after_work_energy,
    ].filter(Boolean),
  },
  {
    id: "sleep",
    title: "Sommeil",
    description: "Rythme de sommeil et difficultés actuelles.",
    factKeys: ["sleep_needed_hours", "sleep_main_problem"],
    questions: [
      QUESTION_MAP.sleep_needed_hours,
      QUESTION_MAP.sleep_main_problem,
    ].filter(Boolean),
  },
  {
    id: "studies",
    title: "Études",
    description: "Formation active et habitudes d’étude.",
    factKeys: ["studies_active", "study_weekly_target", "study_best_period"],
    questions: [
      QUESTION_MAP.studies_active,
      QUESTION_MAP.study_weekly_target,
      QUESTION_MAP.study_best_period,
    ].filter(Boolean),
  },
  {
    id: "sport",
    title: "Sport",
    description: "Mouvements préférés et durées réalistes.",
    factKeys: [
      "sport_interest",
      "sport_minimum_duration",
      "sport_music_preference",
    ],
    questions: [
      QUESTION_MAP.sport_interest,
      QUESTION_MAP.sport_minimum_duration,
      QUESTION_MAP.sport_music_preference,
    ].filter(Boolean),
  },
  {
    id: "rest",
    title: "Repos",
    description: "Préférences de récupération et Spotify.",
    factKeys: ["rest_preference"],
    questions: [QUESTION_MAP.rest_preference].filter(Boolean),
  },
  {
    id: "spirituality",
    title: "Spiritualité",
    description: "Place de la foi et contenus souhaités.",
    factKeys: [
      "faith_importance",
      "faith_content_preferences",
      "spiritual_frequency",
      "spiritual_preferred_duration",
      "spiritual_preferred_moment",
      "spiritual_themes_avoid",
      "spiritual_show_on_home",
    ],
    questions: [
      QUESTION_MAP.faith_importance,
      QUESTION_MAP.faith_content_preferences,
      QUESTION_MAP.spiritual_frequency,
      QUESTION_MAP.spiritual_preferred_duration,
      QUESTION_MAP.spiritual_preferred_moment,
      QUESTION_MAP.spiritual_themes_avoid,
      QUESTION_MAP.spiritual_show_on_home,
    ].filter(Boolean),
  },
  {
    id: "priorities",
    title: "Priorités",
    description: "Objectif principal et concentration.",
    factKeys: ["main_priority", "procrastination_cause", "preferred_focus_duration"],
    questions: [
      QUESTION_MAP.procrastination_cause,
      QUESTION_MAP.preferred_focus_duration,
    ].filter(Boolean),
  },
];
