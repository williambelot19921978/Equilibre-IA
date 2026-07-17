export const FAMILY_CONTEXT_TYPE_OPTIONS = [
  { label: "Vacances utilisateur", value: "user_vacation" },
  { label: "Vacances enfants", value: "children_vacation" },
  { label: "Déplacement professionnel", value: "work_travel" },
  { label: "Conjoint absent", value: "partner_absent" },
  { label: "Conjoint présent", value: "partner_present" },
  { label: "Parent seul avec les enfants", value: "solo_parent" },
  { label: "Enfant absent", value: "child_absent" },
  { label: "Enfant malade", value: "child_sick" },
  { label: "Fermeture école ou crèche", value: "school_closed" },
  { label: "Garde exceptionnelle", value: "exceptional_childcare" },
  { label: "Horaires de travail exceptionnels", value: "exceptional_work_hours" },
  { label: "Événement familial", value: "family_event" },
  { label: "Autre", value: "other" },
] as const;

export type FamilyContextType =
  (typeof FAMILY_CONTEXT_TYPE_OPTIONS)[number]["value"];
