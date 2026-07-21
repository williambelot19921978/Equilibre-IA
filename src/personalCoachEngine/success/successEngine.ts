/**
 * EPIC 6D — Success Engine — natural, non-repetitive congratulations.
 */

import type { CoachAdvice, PersonalCoachInput } from "../types/personalCoachTypes";
import { getShownSuccessKeys, recordShownSuccess } from "../store/coachStore";

const SUCCESS_TEMPLATES = [
  (name: string) => `Bravo pour « ${name} » — chaque pas compte.`,
  (name: string) => `« ${name} » avance bien. Continue comme ça.`,
  (name: string) => `Beau progrès sur « ${name} » — tu es sur la bonne voie.`,
  (name: string) => `« ${name} » : une belle régularité se dessine.`,
];

function pickTemplate(key: string): (name: string) => string {
  const hash = key.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SUCCESS_TEMPLATES[hash % SUCCESS_TEMPLATES.length]!;
}

export function detectSuccesses(input: PersonalCoachInput): CoachAdvice[] {
  const shown = new Set(getShownSuccessKeys(input.userId));
  const successes: CoachAdvice[] = [];
  const goals = input.activeGoals ?? [];
  const habits = input.validatedHabits ?? input.topHabits ?? [];
  const recent = input.recentSuccesses ?? [];

  for (const goal of goals.slice(0, 2)) {
    const key = `goal-progress-${goal.id}`;
    if (shown.has(key)) continue;
    successes.push({
      id: `success-goal-${goal.id}-${input.date}`,
      domain: "personal_goals",
      kind: "success",
      title: "Progrès objectif",
      message: pickTemplate(key)(goal.name),
      explainability: {
        why: "Objectif actif avec signaux positifs.",
        whyToday: "Célébration d'un progrès, pas d'un verdict.",
        goalId: goal.id,
        goalName: goal.name,
        expectedImpact: "Renforcer la motivation.",
        confidence: 0.78,
      },
      estimatedSeconds: 15,
    });
  }

  for (const habit of habits.slice(0, 2)) {
    const key = `habit-${habit}`;
    if (shown.has(key)) continue;
    successes.push({
      id: `success-habit-${habit}-${input.date}`,
      domain: "wellbeing",
      kind: "success",
      title: "Habitude consolidée",
      message: `Ta régularité sur « ${habit} » est remarquable.`,
      explainability: {
        why: "Habitude validée observée.",
        whyToday: "Reconnaissance sans répétition.",
        expectedImpact: "Encourager la continuité.",
        confidence: 0.8,
      },
      estimatedSeconds: 12,
    });
  }

  for (const item of recent.slice(0, 2)) {
    const key = `recent-${item}`;
    if (shown.has(key)) continue;
    successes.push({
      id: `success-recent-${item}-${input.date}`,
      domain: "wellbeing",
      kind: "success",
      title: "Réussite récente",
      message: item,
      explainability: {
        why: "Progrès récent détecté.",
        whyToday: "Moment opportun pour valoriser.",
        expectedImpact: "Renforcer le sentiment d'accomplissement.",
        confidence: 0.75,
      },
      estimatedSeconds: 12,
    });
  }

  return successes.slice(0, 4);
}

export function markSuccessShown(userId: string, advice: CoachAdvice): void {
  if (advice.explainability.goalId) {
    recordShownSuccess(userId, `goal-progress-${advice.explainability.goalId}`);
    return;
  }
  if (advice.kind === "success" && advice.message.includes("«")) {
    const match = advice.message.match(/« ([^»]+) »/);
    if (match?.[1]) {
      recordShownSuccess(userId, `habit-${match[1]}`);
    }
  }
}
