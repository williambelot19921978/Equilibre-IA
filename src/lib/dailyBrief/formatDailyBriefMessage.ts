/**
 * EPIC1-A — Natural copy for Daily Brief (no LLM).
 */

import type { DayBriefAnalysis } from "./analyzeDayForBrief";

export function formatDailyBriefGreeting(firstName: string): string {
  const trimmed = firstName.trim() || "toi";
  const capitalized =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return `Bonjour ${capitalized} 👋`;
}

export function formatDailyBriefSynthesis(
  analysis: DayBriefAnalysis,
): string {
  switch (analysis.synthesisKey) {
    case "empty":
      return "Ta journée est encore à composer.";
    case "open":
      return "Tu disposes de plusieurs créneaux intéressants aujourd'hui.";
    case "busy":
      return "Aujourd'hui semble être une journée assez chargée.";
    default:
      return "Ta journée paraît plutôt équilibrée.";
  }
}

export function formatStudyBriefExplanation(message: string): string {
  return message.replace(/\n\n/g, "\n").trim();
}

export function formatSportBriefExplanation(
  variant: "scheduled" | "completed",
): string {
  if (variant === "completed") {
    return "Tu as déjà bougé aujourd'hui.\n\nAucun changement recommandé.";
  }

  return "Ta séance est déjà prévue aujourd'hui.\n\nAucun changement recommandé.";
}

export function formatTimeRiskExplanation(): string {
  return "Ton après-midi est assez dense.\n\nÉvite d'ajouter de nouvelles tâches importantes.";
}
