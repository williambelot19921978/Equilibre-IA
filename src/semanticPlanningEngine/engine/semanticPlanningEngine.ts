/**
 * EPIC 5C — Semantic Planning Engine orchestrator.
 * Read-only enrichment layer on PlanningCalendarEngine snapshots.
 */

import type { PlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import { defaultPlanningCalendarEngine } from "../../planningCalendarEngine/engine/planningCalendarEngine";
import type { PlanningCalendarSnapshot } from "../../planningCalendarEngine/types/calendarItem";
import { classifyCalendarItem } from "../classification/classificationEngine";
import { scoreSemanticEnrichment } from "../scoring/semanticScoringEngine";
import { computeDailyLoad, mentalLoadFromSemantic } from "../load/dailyLoadEngine";
import { assessLifeBalance } from "../balance/lifeBalanceEngine";
import { generateSemanticInsights } from "../insights/insightEngine";
import { buildPredictionArchitecture } from "../prediction/predictionEngine";
import { computeGoalImpacts, type GoalSnapshot } from "../goals/goalImpactEngine";
import { computeHouseholdVision } from "../household/householdEngine";
import { buildSemanticBriefHints } from "../brief/semanticBriefHints";
import { wrapSemanticItem, type SemanticCalendarItem } from "../types/semanticCalendarItem";
import type {
  SemanticCategory,
  SemanticPlanningSnapshot,
} from "../types/semanticTypes";

export type SemanticPlanningInput = {
  readonly userId: string;
  readonly householdId?: string | null;
  readonly date: string;
  readonly goals?: readonly GoalSnapshot[];
  readonly childrenCount?: number;
  readonly memberCount?: number;
};

export type SemanticPlanningEngineDeps = {
  readonly planningEngine: PlanningCalendarEngine;
};

const EMPTY_SNAPSHOT: SemanticPlanningSnapshot = {
  enabled: false,
  date: "",
  items: [],
  dailyLoad: {
    mentalLoad: 0,
    physicalLoad: 0,
    focusMinutes: 0,
    travelMinutes: 0,
    personalMinutes: 0,
    familyMinutes: 0,
    workMinutes: 0,
    healthMinutes: 0,
    freeMinutes: 0,
    totalBusyMinutes: 0,
  },
  balance: {
    daily: {
      period: "daily",
      score: 50,
      signals: ["balanced"],
      confidence: 0,
      explanation: "Semantic engine désactivé.",
    },
    weekly: {
      period: "weekly",
      score: 50,
      signals: ["balanced"],
      confidence: 0,
      explanation: "Semantic engine désactivé.",
    },
    monthly: {
      period: "monthly",
      score: 50,
      signals: ["balanced"],
      confidence: 0,
      explanation: "Semantic engine désactivé.",
    },
  },
  insights: [],
  predictions: [],
  household: {
    togetherMinutes: 0,
    sharedFreeMinutes: 0,
    parentMinutes: 0,
    childrenMinutes: 0,
    individualMinutes: 0,
    confidence: 0,
  },
  briefHints: [],
  categoryDistribution: {
    sante: 0,
    travail: 0,
    sport: 0,
    famille: 0,
    deplacement: 0,
    etudes: 0,
    personnel: 0,
    social: 0,
    spirituel: 0,
    repos: 0,
    autre: 0,
  },
  generatedAt: new Date().toISOString(),
};

function sumFreeMinutes(snapshot: PlanningCalendarSnapshot): number {
  return snapshot.freeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
}

function buildCategoryDistribution(
  items: readonly SemanticCalendarItem[],
): Record<SemanticCategory, number> {
  const distribution: Record<SemanticCategory, number> = {
    sante: 0,
    travail: 0,
    sport: 0,
    famille: 0,
    deplacement: 0,
    etudes: 0,
    personnel: 0,
    social: 0,
    spirituel: 0,
    repos: 0,
    autre: 0,
  };
  for (const item of items) {
    distribution[item.category] += 1;
  }
  return distribution;
}

export class SemanticPlanningEngine {
  private readonly deps: SemanticPlanningEngineDeps;

  constructor(deps: SemanticPlanningEngineDeps) {
    this.deps = deps;
  }

  enrichItems(
    items: PlanningCalendarSnapshot["timeline"]["items"],
    goals: readonly GoalSnapshot[] = [],
  ): SemanticCalendarItem[] {
    return items
      .filter((item) => item.status !== "cancelled")
      .map((item) => {
        const classification = classifyCalendarItem(item);
        const enrichment = scoreSemanticEnrichment(item, classification);
        const goalLinks = computeGoalImpacts(item, classification, goals);
        return wrapSemanticItem(item, enrichment, goalLinks);
      });
  }

  enrichSnapshot(
    snapshot: PlanningCalendarSnapshot,
    input: SemanticPlanningInput,
  ): SemanticPlanningSnapshot {
    const goals = input.goals ?? [];
    const items = this.enrichItems(snapshot.timeline.items, goals);
    const freeMinutes = sumFreeMinutes(snapshot);
    const dailyLoad = computeDailyLoad(items);
    const dailyBalance = assessLifeBalance({
      items,
      dailyLoad,
      freeMinutesAvailable: freeMinutes,
      period: "daily",
      childrenCount: input.childrenCount,
    });
    const weeklyBalance = assessLifeBalance({
      items,
      dailyLoad,
      freeMinutesAvailable: freeMinutes,
      period: "weekly",
      childrenCount: input.childrenCount,
    });
    const monthlyBalance = assessLifeBalance({
      items,
      dailyLoad,
      freeMinutesAvailable: freeMinutes,
      period: "monthly",
      childrenCount: input.childrenCount,
    });

    const insights = generateSemanticInsights({
      items,
      dailyLoad,
      balance: dailyBalance,
      freeMinutes,
      date: input.date,
    });

    const avgGoalProgress =
      goals.length > 0 ? goals.reduce((sum) => sum + 50, 0) / goals.length : 50;

    const predictions = buildPredictionArchitecture({
      dailyLoad,
      balance: dailyBalance,
      conflictCount: snapshot.conflicts.length,
      goalProgressPercent: avgGoalProgress * 100,
    });

    const household = computeHouseholdVision({
      items,
      childrenCount: input.childrenCount ?? 0,
      memberCount: input.memberCount ?? 1,
      freeMinutes,
    });

    const mentalLoad = mentalLoadFromSemantic(dailyLoad);
    const briefHints = buildSemanticBriefHints({
      insights,
      items,
      freeMinutes,
      mentalLoad,
    });

    return {
      enabled: true,
      date: input.date,
      items,
      dailyLoad,
      balance: {
        daily: dailyBalance,
        weekly: weeklyBalance,
        monthly: monthlyBalance,
      },
      insights,
      predictions,
      household,
      briefHints,
      categoryDistribution: buildCategoryDistribution(items),
      generatedAt: new Date().toISOString(),
    };
  }

  async analyze(input: SemanticPlanningInput): Promise<SemanticPlanningSnapshot> {
    const dayStart = `${input.date}T00:00:00.000Z`;
    const dayEnd = `${input.date}T23:59:59.999Z`;

    const snapshot = await this.deps.planningEngine.buildSnapshot({
      userId: input.userId,
      householdId: input.householdId,
      start: dayStart,
      end: dayEnd,
    });

    return this.enrichSnapshot(snapshot, input);
  }

  async analyzeToday(input: Omit<SemanticPlanningInput, "date"> & { date: string }): Promise<SemanticPlanningSnapshot> {
    return this.analyze(input);
  }
}

export const defaultSemanticPlanningEngine = new SemanticPlanningEngine({
  planningEngine: defaultPlanningCalendarEngine,
});

export function createEmptySemanticSnapshot(date: string): SemanticPlanningSnapshot {
  return { ...EMPTY_SNAPSHOT, date, generatedAt: new Date().toISOString() };
}

export { mentalLoadFromSemantic };
