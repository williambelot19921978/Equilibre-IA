export type QuestionOption = {
  label: string;
  value: string;
};

export type DiscoveryQuestion = {
  key: string;
  category:
    | "family"
    | "children"
    | "work"
    | "studies"
    | "sleep"
    | "energy"
    | "procrastination"
    | "sport"
    | "music"
    | "rest"
    | "spirituality";
  title: string;
  description?: string;
  type: "text" | "number" | "time" | "select" | "multi-select";
  options?: QuestionOption[];
  placeholder?: string;
  dependsOn?: {
    key: string;
    acceptedValues: string[];
  };
};

export const discoveryQuestions: DiscoveryQuestion[] = [
  {
    key: "morning_children_responsibility",
    category: "children",
    title: "Qui prépare généralement les enfants le matin ?",
    description:
      "Cela m’aidera à protéger ce temps dans ton futur planning.",
    type: "select",
    options: [
      { label: "Principalement moi", value: "me" },
      { label: "Principalement mon conjoint", value: "partner" },
      { label: "Nous partageons", value: "shared" },
      { label: "Cela dépend des jours", value: "varies" },
    ],
  },
  {
    key: "morning_children_duration",
    category: "children",
    title:
      "Combien de minutes faut-il réellement pour préparer les enfants le matin ?",
    description:
      "Compte le réveil, l’habillage, le petit-déjeuner et le départ.",
    type: "number",
    placeholder: "Ex. 75",
  },
  {
    key: "children_departure_time",
    category: "children",
    title: "À quelle heure les enfants doivent-ils être prêts à partir ?",
    type: "time",
  },
  {
    key: "children_evening_routine",
    category: "children",
    title: "Que faut-il généralement gérer avec les enfants le soir ?",
    type: "multi-select",
    options: [
      { label: "Les récupérer", value: "pickup" },
      { label: "Les devoirs", value: "homework" },
      { label: "Préparer le repas", value: "meal" },
      { label: "Le bain ou la douche", value: "bath" },
      { label: "Le coucher", value: "bedtime" },
      { label: "Des activités", value: "activities" },
    ],
  },
  {
    key: "work_days",
    category: "work",
    title: "Quels jours travailles-tu habituellement ?",
    type: "multi-select",
    options: [
      { label: "Lundi", value: "monday" },
      { label: "Mardi", value: "tuesday" },
      { label: "Mercredi", value: "wednesday" },
      { label: "Jeudi", value: "thursday" },
      { label: "Vendredi", value: "friday" },
      { label: "Samedi", value: "saturday" },
      { label: "Dimanche", value: "sunday" },
      { label: "Mes jours changent", value: "variable" },
    ],
  },
  {
    key: "commute_duration",
    category: "work",
    title: "Combien de minutes dure habituellement ton trajet ?",
    type: "number",
    placeholder: "Ex. 25",
  },
  {
    key: "after_work_energy",
    category: "energy",
    title: "Comment te sens-tu généralement après le travail ?",
    type: "select",
    options: [
      { label: "Encore en forme", value: "high" },
      { label: "Correctement disponible", value: "medium" },
      { label: "Souvent fatiguée", value: "low" },
      { label: "Cela dépend beaucoup", value: "variable" },
    ],
  },
  {
    key: "studies_active",
    category: "studies",
    title: "Suis-tu actuellement des études ou une formation ?",
    type: "select",
    options: [
      { label: "Oui", value: "yes" },
      { label: "Non", value: "no" },
    ],
  },
  {
    key: "study_weekly_target",
    category: "studies",
    title: "Combien d’heures aimerais-tu consacrer à ta formation par semaine ?",
    type: "number",
    placeholder: "Ex. 6",
    dependsOn: {
      key: "studies_active",
      acceptedValues: ["yes"],
    },
  },
  {
    key: "study_best_period",
    category: "studies",
    title: "À quel moment es-tu généralement la plus efficace pour étudier ?",
    type: "select",
    options: [
      { label: "Très tôt le matin", value: "early_morning" },
      { label: "Dans la matinée", value: "morning" },
      { label: "Après le déjeuner", value: "afternoon" },
      { label: "En fin de journée", value: "evening" },
      { label: "Cela dépend des jours", value: "variable" },
    ],
    dependsOn: {
      key: "studies_active",
      acceptedValues: ["yes"],
    },
  },
  {
    key: "procrastination_cause",
    category: "procrastination",
    title: "Quand tu repousses une tâche, qu’est-ce qui te bloque le plus ?",
    type: "multi-select",
    options: [
      { label: "Elle paraît trop longue", value: "too_long" },
      { label: "Je ne sais pas par où commencer", value: "unclear_start" },
      { label: "Je suis fatiguée", value: "fatigue" },
      { label: "Je me laisse distraire", value: "distraction" },
      { label: "Je préfère faire les petites tâches", value: "easy_tasks" },
      { label: "J’ai peur de mal faire", value: "perfectionism" },
    ],
  },
  {
    key: "preferred_focus_duration",
    category: "procrastination",
    title: "Quelle durée de concentration te semble la plus réaliste ?",
    type: "select",
    options: [
      { label: "15 minutes", value: "15" },
      { label: "25 minutes", value: "25" },
      { label: "45 minutes", value: "45" },
      { label: "60 minutes", value: "60" },
      { label: "Je ne sais pas encore", value: "unknown" },
    ],
  },
  {
    key: "sleep_needed_hours",
    category: "sleep",
    title: "De combien d’heures de sommeil as-tu besoin pour te sentir bien ?",
    type: "number",
    placeholder: "Ex. 8",
  },
  {
    key: "sleep_main_problem",
    category: "sleep",
    title: "Qu’est-ce qui perturbe le plus ton sommeil actuellement ?",
    type: "multi-select",
    options: [
      { label: "Je me couche trop tard", value: "late_bedtime" },
      { label: "Les enfants se réveillent", value: "children_wake" },
      { label: "Le téléphone", value: "phone" },
      { label: "Le stress", value: "stress" },
      { label: "Je termine mes tâches tard", value: "late_tasks" },
      { label: "Rien en particulier", value: "none" },
    ],
  },
  {
    key: "sport_interest",
    category: "sport",
    title: "Quel type de mouvement aimerais-tu intégrer plus souvent ?",
    type: "multi-select",
    options: [
      { label: "Marche", value: "walking" },
      { label: "Renforcement musculaire", value: "strength" },
      { label: "Yoga ou mobilité", value: "yoga" },
      { label: "Course", value: "running" },
      { label: "Danse", value: "dance" },
      { label: "Je ne sais pas encore", value: "unknown" },
    ],
  },
  {
    key: "sport_minimum_duration",
    category: "sport",
    title: "Quelle petite durée de sport accepterais-tu même un jour chargé ?",
    type: "select",
    options: [
      { label: "5 minutes", value: "5" },
      { label: "10 minutes", value: "10" },
      { label: "15 minutes", value: "15" },
      { label: "20 minutes", value: "20" },
    ],
  },
  {
    key: "sport_music_preference",
    category: "music",
    title: "Pour faire du sport, quelle ambiance t’aiderait le plus ?",
    type: "multi-select",
    options: [
      { label: "Pop dynamique", value: "pop" },
      { label: "Rock", value: "rock" },
      { label: "Électro", value: "electronic" },
      { label: "Musique chrétienne dynamique", value: "christian_energy" },
      { label: "Rap", value: "rap" },
      { label: "Je préfère tester plusieurs styles", value: "discover" },
    ],
  },
  {
    key: "rest_preference",
    category: "rest",
    title: "Quand tu as besoin de récupérer, qu’est-ce qui t’aide le plus ?",
    type: "multi-select",
    options: [
      { label: "Musique douce", value: "soft_music" },
      { label: "Podcast ou histoire", value: "story" },
      { label: "Livre audio", value: "audiobook" },
      { label: "Silence", value: "silence" },
      { label: "Marche tranquille", value: "slow_walk" },
      { label: "Prière ou méditation chrétienne", value: "prayer" },
    ],
  },
  {
    key: "faith_importance",
    category: "spirituality",
    title: "Quelle place souhaites-tu donner à la foi chrétienne dans l’application ?",
    type: "select",
    options: [
      { label: "Une place importante", value: "important" },
      { label: "Quelques propositions discrètes", value: "discreet" },
      { label: "Seulement lorsque j’en ai besoin", value: "when_needed" },
      { label: "Je préfère ne pas l’activer", value: "disabled" },
    ],
  },
  {
    key: "faith_content_preferences",
    category: "spirituality",
    title: "Quels contenus spirituels aimerais-tu recevoir ?",
    type: "multi-select",
    options: [
      { label: "Verset du jour", value: "verse" },
      { label: "Courte prière", value: "prayer" },
      { label: "Temps de gratitude", value: "gratitude" },
      { label: "Encouragement chrétien", value: "encouragement" },
      { label: "Réflexion du soir", value: "evening_reflection" },
    ],
    dependsOn: {
      key: "faith_importance",
      acceptedValues: ["important", "discreet", "when_needed"],
    },
  },
  {
    key: "spiritual_frequency",
    category: "spirituality",
    title: "À quelle fréquence souhaites-tu des propositions spirituelles ?",
    type: "select",
    options: [
      { label: "Quotidiennement", value: "daily" },
      { label: "Quelques fois par semaine", value: "weekly" },
      { label: "Occasionnellement", value: "occasional" },
      { label: "Seulement quand je le demande", value: "on_demand" },
    ],
    dependsOn: {
      key: "faith_importance",
      acceptedValues: ["important", "discreet", "when_needed"],
    },
  },
  {
    key: "spiritual_preferred_duration",
    category: "spirituality",
    title: "Quelle durée idéale pour un moment spirituel ?",
    type: "select",
    options: [
      { label: "5 minutes", value: "5" },
      { label: "10 minutes", value: "10" },
      { label: "15 minutes", value: "15" },
      { label: "20 minutes", value: "20" },
    ],
  },
  {
    key: "spiritual_preferred_moment",
    category: "spirituality",
    title: "Quel moment préfères-tu ?",
    type: "select",
    options: [
      { label: "Le matin", value: "morning" },
      { label: "Midi", value: "midday" },
      { label: "Après-midi", value: "afternoon" },
      { label: "Le soir", value: "evening" },
    ],
  },
  {
    key: "spiritual_themes_avoid",
    category: "spirituality",
    title: "Thèmes à éviter (facultatif)",
    type: "multi-select",
    options: [
      { label: "Références bibliques", value: "verse" },
      { label: "Prières", value: "prayer" },
      { label: "Encouragements chrétiens", value: "encouragement" },
    ],
  },
  {
    key: "spiritual_show_on_home",
    category: "spirituality",
    title: "Afficher la carte spirituelle sur l'accueil ?",
    type: "select",
    options: [
      { label: "Oui", value: "yes" },
      { label: "Non", value: "no" },
    ],
  },
];