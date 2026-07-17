export const WORK_DAY_OPTIONS = [
  { label: "Lundi", value: "monday" },
  { label: "Mardi", value: "tuesday" },
  { label: "Mercredi", value: "wednesday" },
  { label: "Jeudi", value: "thursday" },
  { label: "Vendredi", value: "friday" },
  { label: "Samedi", value: "saturday" },
  { label: "Dimanche", value: "sunday" },
  { label: "Mes jours changent", value: "variable" },
] as const;

export const AFTER_WORK_ENERGY_OPTIONS = [
  { label: "Encore en forme", value: "high" },
  { label: "Correctement disponible", value: "medium" },
  { label: "Souvent fatiguée", value: "low" },
  { label: "Cela dépend beaucoup", value: "variable" },
] as const;

export const EVENING_ROUTINE_OPTIONS = [
  { label: "Les récupérer", value: "pickup" },
  { label: "Les devoirs", value: "homework" },
  { label: "Préparer le repas", value: "meal" },
  { label: "Le bain ou la douche", value: "bath" },
  { label: "Le coucher", value: "bedtime" },
  { label: "Des activités", value: "activities" },
] as const;

export const FOCUS_DURATION_OPTIONS = [
  { label: "15 minutes", value: 15 },
  { label: "25 minutes", value: 25 },
  { label: "45 minutes", value: 45 },
  { label: "60 minutes", value: 60 },
] as const;

export const MAIN_PRIORITY_OPTIONS = [
  { label: "Famille", value: "family" },
  { label: "Études ou formation", value: "studies" },
  { label: "Sommeil", value: "sleep" },
  { label: "Sport", value: "sport" },
  { label: "Temps personnel", value: "rest" },
  { label: "Travail", value: "work" },
  { label: "Équilibre global", value: "balance" },
] as const;

export const MANUAL_CONSTRAINT_TYPES = [
  { label: "Travail exceptionnel", value: "exceptional_work" },
  { label: "Rendez-vous", value: "appointment" },
  { label: "École", value: "school" },
  { label: "Activité enfant", value: "child_activity" },
  { label: "Médecin", value: "doctor" },
  { label: "Sport", value: "sport" },
  { label: "Vacances", value: "vacation" },
  { label: "Déplacement", value: "travel" },
  { label: "Événement libre", value: "free_event" },
] as const;

export type ManualConstraintType =
  (typeof MANUAL_CONSTRAINT_TYPES)[number]["value"];
