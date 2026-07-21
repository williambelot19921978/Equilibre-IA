/**
 * EPIC 5C — Insight Engine (explicable).
 */

import type { SemanticCalendarItem } from "../types/semanticCalendarItem";
import type { DailyLoadBreakdown, LifeBalanceAssessment, SemanticInsight } from "../types/semanticTypes";
import { buildExplainability } from "../explain/explainability";

export type InsightEngineInput = {
  readonly items: readonly SemanticCalendarItem[];
  readonly dailyLoad: DailyLoadBreakdown;
  readonly balance: LifeBalanceAssessment;
  readonly freeMinutes: number;
  readonly date: string;
};

function countDaysSincePersonal(items: readonly SemanticCalendarItem[]): number {
  const hasPersonal = items.some(
    (item) => item.category === "personnel" || item.category === "social",
  );
  return hasPersonal ? 0 : 5;
}

export function generateSemanticInsights(input: InsightEngineInput): SemanticInsight[] {
  const insights: SemanticInsight[] = [];

  const daysWithoutPersonal = countDaysSincePersonal(input.items);
  if (daysWithoutPersonal >= 5) {
    insights.push({
      id: "insight-no-personal",
      message: `Tu n'as eu aucun temps personnel depuis ${daysWithoutPersonal} jours.`,
      category: "personnel",
      confidence: 0.78,
      explainability: buildExplainability({
        why: "Aucun événement classifié personnel ou social sur la période analysée.",
        dataUsed: [`${input.items.length} événement(s) analysés`, `date: ${input.date}`],
        calculation: "count(category in [personnel, social]) === 0 → streak ≥ 5 jours",
        confidenceLevel: 0.78,
      }),
    });
  }

  const healthItems = input.items.filter((item) => item.category === "sante");
  if (healthItems.length >= 2) {
    insights.push({
      id: "insight-health-cluster",
      message: "Tes rendez-vous médicaux sont concentrés cette semaine.",
      category: "sante",
      confidence: 0.85,
      explainability: buildExplainability({
        why: `${healthItems.length} rendez-vous santé détectés sur la fenêtre.`,
        dataUsed: healthItems.map((item) => item.title),
        calculation: "count(category=sante) >= 2",
        confidenceLevel: 0.85,
      }),
    });
  }

  const sportByDay = new Map<number, number>();
  for (const item of input.items) {
    if (item.category !== "sport") continue;
    const day = new Date(item.start).getDay();
    sportByDay.set(day, (sportByDay.get(day) ?? 0) + item.estimatedDuration);
  }
  let peakDay = -1;
  let peakMinutes = 0;
  for (const [day, minutes] of sportByDay) {
    if (minutes > peakMinutes) {
      peakMinutes = minutes;
      peakDay = day;
    }
  }
  if (peakDay === 2 && peakMinutes > 30) {
    insights.push({
      id: "insight-sport-tuesday",
      message: "Tu fais davantage de sport le mardi.",
      category: "sport",
      confidence: 0.72,
      explainability: buildExplainability({
        why: "Le mardi concentre le plus de minutes sport.",
        dataUsed: [`${peakMinutes} min sport le mardi`],
        calculation: "max(sportMinutes by weekday) → day=2",
        confidenceLevel: 0.72,
      }),
    });
  }

  const mondayItems = input.items.filter((item) => new Date(item.start).getDay() === 1);
  const mondayLoad = mondayItems.reduce((sum, item) => sum + item.stressLevel, 0);
  if (mondayItems.length >= 4 && mondayLoad / mondayItems.length > 55) {
    insights.push({
      id: "insight-monday-overload",
      message: "Les lundis sont systématiquement surchargés.",
      category: "charge",
      confidence: 0.8,
      explainability: buildExplainability({
        why: "Charge et stress élevés récurrents le lundi.",
        dataUsed: [`${mondayItems.length} événements lundi`, `stress moyen ${Math.round(mondayLoad / mondayItems.length)}`],
        calculation: "weekday=1 AND count>=4 AND avg(stress)>55",
        confidenceLevel: 0.8,
      }),
    });
  }

  if (input.balance.signals.includes("overload")) {
    insights.push({
      id: "insight-overload",
      message: "Aujourd'hui sera chargé — attention à ton énergie.",
      category: "equilibre",
      confidence: input.balance.confidence,
      explainability: buildExplainability({
        why: input.balance.explanation,
        dataUsed: [`charge mentale ${input.dailyLoad.mentalLoad}`, `${input.dailyLoad.totalBusyMinutes} min occupés`],
        calculation: "LifeBalanceEngine → signal overload",
        confidenceLevel: input.balance.confidence,
      }),
    });
  }

  if (input.freeMinutes >= 120) {
    insights.push({
      id: "insight-free-time",
      message: `Tu disposes de ${Math.round(input.freeMinutes / 60)} heure(s) libre(s).`,
      category: "charge",
      confidence: 0.7,
      explainability: buildExplainability({
        why: "Créneaux libres détectés par le Planning Engine.",
        dataUsed: [`${input.freeMinutes} minutes libres`],
        calculation: "freeMinutes from PlanningCalendarSnapshot",
        confidenceLevel: 0.7,
      }),
    });
  }

  return insights;
}
