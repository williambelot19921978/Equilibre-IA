export const GOAL_CATEGORIES = [
  { value: "studies", label: "Formation / études" },
  { value: "work", label: "Travail" },
  { value: "personal", label: "Personnel" },
  { value: "sport", label: "Sport" },
  { value: "home", label: "Maison" },
  { value: "spirituality", label: "Spiritualité" },
  { value: "other", label: "Autre" },
] as const;

export function getGoalCategoryLabel(value: string): string {
  return GOAL_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export const GOAL_IMPORTANCE_OPTIONS = [
  { value: "low" as const, label: "Faible" },
  { value: "medium" as const, label: "Normale" },
  { value: "high" as const, label: "Élevée" },
];
