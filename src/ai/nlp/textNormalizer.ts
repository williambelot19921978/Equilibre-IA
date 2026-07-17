/**
 * Normalisation avancée du texte NLP — Sprint 4.1
 */

const APOSTROPHE_VARIANTS = /[''´`]/g;
const MULTISPACE = /\s+/g;

const FAMILIAR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bje bosse\b/g, "je travaille"],
  [/\bpose mes vacances\b/g, "suis en vacances"],
  [/\bfooting\b/g, "courir"],
  [/\bmuscu\b/g, "sport"],
  [/\brdv\b/g, "rendez-vous"],
  [/\bptit\b/g, "petit"],
  [/\bptite\b/g, "petite"],
  [/\b1h\b/g, "1 heure"],
  [/\b2h\b/g, "2 heures"],
  [/\b(\d{1,2})\s*h\b/g, "$1 heure"],
  [/\b(\d{1,2})\s*heures?\b/g, "$1 heure"],
  [/\bdemain matin\b/g, "demain matin"],
  [/\bvendredi prochain\b/g, "vendredi"],
  [/\bsemaine prochaine\b/g, "semaine prochaine"],
  [/\bdeplace ma revision\b/g, "reviser demain matin"],
];

export function normalizeNlpTextAdvanced(text: string): string {
  let normalized = text
    .trim()
    .toLowerCase()
    .replace(APOSTROPHE_VARIANTS, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(MULTISPACE, " ");

  for (const [pattern, replacement] of FAMILIAR_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized
    .replace(/\b(\d{1,2})\s*:\s*(\d{2})\b/g, "$1h$2")
    .replace(/\b(\d{1,2})\s+h\s+(\d{2})\b/g, "$1h$2")
    .replace(/\b(\d{1,2})\s+h\b/g, "$1h00")
    .replace(/\b(\d{1,2})h(\d{2})\b/g, "$1h$2");

  return normalized.trim();
}
