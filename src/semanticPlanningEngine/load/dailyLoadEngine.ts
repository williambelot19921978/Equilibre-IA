/**
 * EPIC 5C — Daily Load Engine.
 */

import type { SemanticCalendarItem } from "../types/semanticCalendarItem";
import type { DailyLoadBreakdown, SemanticCategory } from "../types/semanticTypes";

const CATEGORY_MINUTES: Record<SemanticCategory, keyof DailyLoadBreakdown | null> = {
  sante: "healthMinutes",
  travail: "workMinutes",
  sport: "physicalLoad",
  famille: "familyMinutes",
  deplacement: "travelMinutes",
  etudes: "focusMinutes",
  personnel: "personalMinutes",
  social: "personalMinutes",
  spirituel: "personalMinutes",
  repos: "freeMinutes",
  autre: null,
};

function initBreakdown(): {
  mentalLoad: number;
  physicalLoad: number;
  focusMinutes: number;
  travelMinutes: number;
  personalMinutes: number;
  familyMinutes: number;
  workMinutes: number;
  healthMinutes: number;
  freeMinutes: number;
  totalBusyMinutes: number;
} {
  return {
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
  };
}

export function computeDailyLoad(items: readonly SemanticCalendarItem[]): DailyLoadBreakdown {
  const breakdown = initBreakdown();

  for (const item of items) {
    if (item.status === "cancelled") continue;

    const minutes = item.estimatedDuration;
    breakdown.totalBusyMinutes += minutes;

    breakdown.mentalLoad += (item.stressLevel / 100) * minutes * 0.4;
    if (item.category === "sport") {
      breakdown.physicalLoad += minutes;
    }

    const bucket = CATEGORY_MINUTES[item.category];
    if (bucket === "physicalLoad") {
      breakdown.physicalLoad += minutes;
    } else if (bucket && bucket !== "mentalLoad" && bucket !== "totalBusyMinutes") {
      breakdown[bucket] += minutes;
    }

    if (item.focusRequired) {
      breakdown.focusMinutes += minutes;
    }
    if (item.travelNeeded) {
      breakdown.travelMinutes += Math.min(45, Math.round(minutes * 0.25));
    }
  }

  breakdown.mentalLoad = Math.round(Math.min(100, breakdown.mentalLoad));
  breakdown.physicalLoad = Math.round(breakdown.physicalLoad);

  return breakdown;
}

export function mentalLoadFromSemantic(load: DailyLoadBreakdown): number {
  return Math.min(100, Math.round(load.mentalLoad + load.focusMinutes * 0.15 + load.workMinutes * 0.1));
}
