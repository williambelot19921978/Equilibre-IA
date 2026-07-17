/**
 * Matrice explicite des expressions reconnues — Sprint 4.1
 * Référence pour tests et maintenance (patterns réels dans intentEngine.ts).
 */
export const NLP_INTENT_MATRIX = {
  WORK_OVERRIDE: [
    "je travaille demain",
    "je bosse demain",
    "je suis au travail mercredi",
    "je travaille de 9h a 17h",
    "je finis une heure plus tard",
    "tous les mercredis je suis en repos",
    "jour de repos",
  ],
  VACATION: [
    "je suis en vacances",
    "nous sommes en vacances",
    "vacances du 10 au 18 aout",
    "je pose mes vacances",
    "conges",
  ],
  SPORT: [
    "je veux courir",
    "footing",
    "seance de sport",
    "musculation",
    "marche",
    "supprime mon sport",
  ],
  SPIRITUAL: [
    "je veux prier",
    "temps de priere",
    "moment spirituel",
    "temps calme chretien",
  ],
  STUDY: [
    "je veux lire",
    "lire 30 minutes",
    "reviser",
    "deplace ma revision",
  ],
  CHILDREN: [
    "peter dort chez mamie",
    "enfant malade",
    "garde exceptionnelle",
  ],
  APPOINTMENT: [
    "j'ai un rendez-vous demain a 14h",
    "rdv demain",
    "rendez-vous a 14 heures",
  ],
  FATIGUE: ["je suis fatigue", "je suis epuise"],
  QUIET_EVENING: ["soiree tranquille", "soir calme"],
} as const;

export type NlpIntentMatrixKey = keyof typeof NLP_INTENT_MATRIX;

/** Format tableau pour tests et documentation */
export const INTENT_EXPRESSION_MATRIX = Object.entries(NLP_INTENT_MATRIX).map(
  ([key, examples]) => ({
    key: key as NlpIntentMatrixKey,
    intent: key,
    examples: [...examples],
  }),
);
