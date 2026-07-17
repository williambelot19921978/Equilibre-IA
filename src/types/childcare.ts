export type ChildcareMode =
  | "home_with_me"
  | "home_with_partner"
  | "grandparents"
  | "summer_camp"
  | "nanny"
  | "other";

export const CHILDCARE_MODE_OPTIONS: Array<{
  value: ChildcareMode;
  label: string;
  description: string;
}> = [
  {
    value: "home_with_me",
    label: "Maison avec moi",
    description: "Peu de disponibilité — charge élevée.",
  },
  {
    value: "home_with_partner",
    label: "Maison avec mon conjoint",
    description: "Disponibilité intermédiaire.",
  },
  {
    value: "grandparents",
    label: "Chez les grands-parents",
    description: "Journée presque normale.",
  },
  {
    value: "summer_camp",
    label: "Centre aéré",
    description: "Journée plus libre en journée.",
  },
  {
    value: "nanny",
    label: "Assistante maternelle",
    description: "Garde structurée — créneaux modérés.",
  },
  {
    value: "other",
    label: "Autre",
    description: "À préciser dans la description.",
  },
];

export function getChildcareModeLabel(mode: ChildcareMode | undefined | null): string {
  if (!mode) return "Non précisé";
  return (
    CHILDCARE_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode
  );
}
