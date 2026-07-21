/**
 * EPIC 5C — Semantic scoring engine.
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { ClassificationResult } from "../classification/classificationEngine";
import type {
  EnergyLevel,
  FlexibilityLevel,
  ImportanceLevel,
  SemanticEnrichment,
} from "../types/semanticTypes";

function durationMinutes(item: CalendarItem): number {
  const ms = new Date(item.end).getTime() - new Date(item.start).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}

function scoreImportance(
  item: CalendarItem,
  classification: ClassificationResult,
): ImportanceLevel {
  if (classification.category === "sante") return 5;
  if (classification.category === "famille" && /anniversaire/i.test(item.title)) return 4;
  if (classification.category === "travail" && /client/i.test(item.title)) return 4;
  if (item.type === "appointment") return 4;
  if (item.priority >= 4) return 4;
  if (classification.category === "sport") return 3;
  if (classification.category === "personnel") return 2;
  return 3;
}

function scoreStress(classification: ClassificationResult, duration: number): number {
  let stress = 20;
  if (classification.category === "sante") stress += 25;
  if (classification.category === "travail") stress += 20;
  if (classification.category === "famille") stress += 10;
  if (classification.category === "deplacement") stress += 15;
  if (duration > 120) stress += 10;
  if (classification.tags.includes("medical")) stress += 15;
  return Math.min(100, stress);
}

function scoreEnergy(classification: ClassificationResult, phase: "before" | "after"): EnergyLevel {
  if (classification.category === "sport") {
    return phase === "before" ? "moyenne" : "elevee";
  }
  if (classification.category === "sante") return "faible";
  if (classification.category === "travail") return phase === "before" ? "elevee" : "faible";
  if (classification.category === "repos") return "faible";
  return "moyenne";
}

function scoreFlexibility(
  item: CalendarItem,
  classification: ClassificationResult,
): FlexibilityLevel {
  if (classification.category === "sante") return "fixe";
  if (classification.tags.includes("medical")) return "fixe";
  if (item.type === "appointment" && classification.category === "travail") return "deplacable";
  if (classification.category === "sport") return "deplacable";
  if (classification.category === "personnel") return "flexible";
  if (!item.editable) return "fixe";
  return "deplacable";
}

function scoreImpact(base: number, classification: ClassificationResult): number {
  const boosts: Partial<Record<ClassificationResult["category"], number>> = {
    sante: 0.9,
    famille: 0.75,
    sport: 0.65,
    travail: 0.55,
    social: 0.5,
    personnel: 0.45,
  };
  return Math.min(1, base * (boosts[classification.category] ?? 0.35));
}

export function scoreSemanticEnrichment(
  item: CalendarItem,
  classification: ClassificationResult,
): SemanticEnrichment {
  const duration = durationMinutes(item);
  const importance = scoreImportance(item, classification);
  const stressLevel = scoreStress(classification, duration);
  const flexibility = scoreFlexibility(item, classification);

  return {
    category: classification.category,
    subcategory: classification.subcategory,
    importance,
    energyBefore: scoreEnergy(classification, "before"),
    energyAfter: scoreEnergy(classification, "after"),
    stressLevel,
    preparationNeeded:
      classification.category === "sante" ||
      classification.category === "deplacement" ||
      duration > 90,
    travelNeeded:
      classification.category === "deplacement" ||
      Boolean(item.location && item.location.length > 0),
    recoveryNeeded:
      classification.category === "sport" ||
      stressLevel >= 60 ||
      duration > 120,
    estimatedDuration: duration,
    focusRequired:
      classification.category === "travail" ||
      classification.category === "etudes",
    familyImpact: scoreImpact(0.7, classification),
    goalImpact: scoreImpact(0.5, classification),
    healthImpact: classification.category === "sante" ? 0.95 : scoreImpact(0.3, classification),
    financialImpact:
      classification.category === "travail" ? 0.6 : scoreImpact(0.2, classification),
    socialImpact:
      classification.category === "social" || classification.category === "famille"
        ? 0.8
        : scoreImpact(0.25, classification),
    flexibility,
    confidence: classification.confidence,
    tags: [...classification.tags],
  };
}
