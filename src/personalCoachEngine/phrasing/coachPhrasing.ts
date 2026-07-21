/**
 * EPIC 6D — Coach phrasing for Conversation Engine.
 */

import type { CoachAdvice, PersonalCoachInput } from "../types/personalCoachTypes";

export function buildCoachPhrasingHints(input: {
  readonly coachInput: PersonalCoachInput;
  readonly recovery: readonly CoachAdvice[];
  readonly successes: readonly CoachAdvice[];
}): string[] {
  const hints: string[] = [];
  const energy = input.coachInput.dailyEnergy ?? 5;

  if (energy <= 4 && input.recovery.length > 0) {
    hints.push("Je reste à tes côtés — on peut alléger cette journée ensemble.");
  } else if (input.successes.length > 0) {
    hints.push("Bravo pour tes progrès récents — continuons à ton rythme.");
  } else if (energy >= 8) {
    hints.push("Tu sembles en forme — profite de cette énergie comme tu l'entends.");
  }

  return hints.slice(0, 2);
}
