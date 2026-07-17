import type { ChildcareMode } from "../../types/childcare";
import type { FamilyContextImpact } from "../../types/familyContext";

const CHILDCARE_IMPACTS: Record<ChildcareMode, FamilyContextImpact> = {
  home_with_me: {
    maxFillRatio: 0.35,
    reducePersonalTasks: true,
    avoidLongTasks: true,
    onlyMicroTasks: true,
  },
  home_with_partner: {
    maxFillRatio: 0.5,
    reducePersonalTasks: true,
  },
  grandparents: {
    maxFillRatio: 0.78,
  },
  summer_camp: {
    maxFillRatio: 0.82,
    disableSchoolDeparture: true,
  },
  nanny: {
    maxFillRatio: 0.65,
  },
  other: {
    maxFillRatio: 0.55,
  },
};

const CHILDCARE_ADAPTATIONS: Record<ChildcareMode, string> = {
  home_with_me:
    "Enfants à la maison avec toi — journée très contrainte, micro-activités seulement.",
  home_with_partner:
    "Enfants à la maison avec ton conjoint — disponibilité modérée.",
  grandparents:
    "Enfants chez les grands-parents — rythme proche d'une journée normale.",
  summer_camp:
    "Centre aéré — plus de créneaux libres en journée.",
  nanny:
    "Assistante maternelle — garde structurée, créneaux limités.",
  other: "Mode de garde personnalisé — planning allégé par précaution.",
};

export function resolveChildcareImpact(
  mode: ChildcareMode | undefined | null,
): FamilyContextImpact {
  if (!mode) {
    return { maxFillRatio: 0.5, disableSchoolDeparture: true };
  }
  return CHILDCARE_IMPACTS[mode];
}

export function getChildcareAdaptationMessage(
  mode: ChildcareMode | undefined | null,
): string | null {
  if (!mode) return null;
  return CHILDCARE_ADAPTATIONS[mode];
}
