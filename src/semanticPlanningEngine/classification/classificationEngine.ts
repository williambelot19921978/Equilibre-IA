/**
 * EPIC 5C — Classification Engine (rules + architecture for future IA).
 */

import type { CalendarItem } from "../../planningCalendarEngine/types/calendarItem";
import type { SemanticCategory } from "../types/semanticTypes";

export type ClassificationResult = {
  readonly category: SemanticCategory;
  readonly subcategory: string;
  readonly tags: readonly string[];
  readonly confidence: number;
  readonly matchedRule: string;
};

type ClassificationRule = {
  readonly id: string;
  readonly category: SemanticCategory;
  readonly subcategory: string;
  readonly tags: readonly string[];
  readonly patterns: readonly RegExp[];
  readonly itemTypes?: readonly CalendarItem["type"][];
  readonly origins?: readonly CalendarItem["origin"][];
};

const RULES: readonly ClassificationRule[] = [
  {
    id: "health-dentist",
    category: "sante",
    subcategory: "Consultation",
    tags: ["medical", "rdv"],
    patterns: [/dentiste/i, /médecin/i, /docteur/i, /consultation/i, /ophtalm/i, /kiné/i, /vaccin/i],
    itemTypes: ["appointment"],
  },
  {
    id: "health-nutrition",
    category: "sante",
    subcategory: "Nutrition",
    tags: ["sante", "nutrition"],
    patterns: [/nutrition/i, /diétét/i, /nutritionniste/i],
  },
  {
    id: "work-meeting",
    category: "travail",
    subcategory: "Réunion",
    tags: ["work", "meeting"],
    patterns: [/réunion/i, /sprint/i, /stand-?up/i, /sync/i, /comité/i, /point/i],
    itemTypes: ["appointment", "event"],
  },
  {
    id: "work-focus",
    category: "travail",
    subcategory: "Travail concentré",
    tags: ["work", "focus"],
    patterns: [/deep work/i, /focus/i, /bureau/i, /client/i],
    itemTypes: ["event", "task"],
  },
  {
    id: "sport-gym",
    category: "sport",
    subcategory: "Entraînement",
    tags: ["sport", "fitness"],
    patterns: [/basic fit/i, /gym/i, /muscu/i, /course à pied/i, /running/i, /sport/i, /séance/i, /entraînement/i],
    itemTypes: ["event", "task", "goal"],
  },
  {
    id: "family-event",
    category: "famille",
    subcategory: "Événement familial",
    tags: ["famille", "celebration"],
    patterns: [/anniversaire/i, /fête/i, /famille/i, /enfant/i, /école/i, /parent/i],
  },
  {
    id: "travel",
    category: "deplacement",
    subcategory: "Voyage",
    tags: ["travel", "commute"],
    patterns: [/voyage/i, /déplacement/i, /trajet/i, /vol /i, /train/i, /commute/i],
  },
  {
    id: "study",
    category: "etudes",
    subcategory: "Études",
    tags: ["study", "learning"],
    patterns: [/cours/i, /révision/i, /examen/i, /étude/i, /devoir/i, /tp /i],
    itemTypes: ["task", "goal", "event"],
  },
  {
    id: "personal",
    category: "personnel",
    subcategory: "Temps personnel",
    tags: ["personal", "rest"],
    patterns: [/pause/i, /lecture/i, /hobby/i, /perso/i, /relax/i],
  },
  {
    id: "social",
    category: "social",
    subcategory: "Social",
    tags: ["social", "friends"],
    patterns: [/ami/i, /apéro/i, /resto/i, /dîner/i, /soirée/i],
  },
  {
    id: "spiritual",
    category: "spirituel",
    subcategory: "Spiritualité",
    tags: ["spiritual"],
    patterns: [/prière/i, /messe/i, /méditation/i, /spirituel/i],
  },
  {
    id: "rest",
    category: "repos",
    subcategory: "Repos",
    tags: ["rest", "sleep"],
    patterns: [/sommeil/i, /sieste/i, /repos/i, /détente/i],
  },
];

function matchRule(item: CalendarItem, rule: ClassificationRule): boolean {
  const haystack = `${item.title} ${item.description ?? ""} ${item.location ?? ""}`.toLowerCase();

  if (rule.itemTypes && !rule.itemTypes.includes(item.type)) {
    return false;
  }
  if (rule.origins && !rule.origins.includes(item.origin)) {
    return false;
  }

  return rule.patterns.some((pattern) => pattern.test(haystack));
}

function classifyByItemType(item: CalendarItem): ClassificationResult | null {
  if (item.type === "goal") {
    return {
      category: "sport",
      subcategory: "Objectif",
      tags: ["goal"],
      confidence: 0.55,
      matchedRule: "type-goal-default",
    };
  }
  if (item.type === "task") {
    return {
      category: "personnel",
      subcategory: "Tâche",
      tags: ["task"],
      confidence: 0.5,
      matchedRule: "type-task-default",
    };
  }
  if (item.origin === "task") {
    return {
      category: "personnel",
      subcategory: "Tâche planifiée",
      tags: ["task"],
      confidence: 0.55,
      matchedRule: "origin-task",
    };
  }
  if (item.origin === "goal") {
    return {
      category: "sport",
      subcategory: "Objectif planifié",
      tags: ["goal"],
      confidence: 0.55,
      matchedRule: "origin-goal",
    };
  }
  return null;
}

export function classifyCalendarItem(item: CalendarItem): ClassificationResult {
  for (const rule of RULES) {
    if (matchRule(item, rule)) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        tags: rule.tags,
        confidence: 0.82,
        matchedRule: rule.id,
      };
    }
  }

  const typeFallback = classifyByItemType(item);
  if (typeFallback) return typeFallback;

  if (item.type === "appointment") {
    return {
      category: "autre",
      subcategory: "Rendez-vous",
      tags: ["appointment"],
      confidence: 0.45,
      matchedRule: "fallback-appointment",
    };
  }

  return {
    category: "autre",
    subcategory: "Non classifié",
    tags: ["other"],
    confidence: 0.35,
    matchedRule: "fallback-default",
  };
}

export function classifyCalendarItems(
  items: readonly CalendarItem[],
): Map<string, ClassificationResult> {
  const map = new Map<string, ClassificationResult>();
  for (const item of items) {
    map.set(item.id, classifyCalendarItem(item));
  }
  return map;
}
