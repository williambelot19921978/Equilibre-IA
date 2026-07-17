export const CALENDAR_FILTERS = [
  { id: "all", label: "Tout" },
  { id: "work", label: "Travail" },
  { id: "appointments", label: "Rendez-vous" },
  { id: "children", label: "Enfants" },
  { id: "vacations", label: "Vacances" },
  { id: "birthdays", label: "Anniversaires" },
  { id: "google", label: "Google" },
  { id: "tasks", label: "Tâches" },
] as const;

export type CalendarFilterId = (typeof CALENDAR_FILTERS)[number]["id"];
