/**
 * EPIC 6E — Merge profile facts, living memory, goals into unified knowledge items.
 */

import type {
  LifeKnowledgeCategory,
  LifeKnowledgeInput,
  LifeKnowledgeItem,
  LifeKnowledgeSource,
} from "../types/lifeKnowledgeTypes";

const FACT_CATEGORY_MAP: Record<string, LifeKnowledgeCategory> = {
  family_status: "personal_life",
  children_count: "personal_life",
  pets: "personal_life",
  life_rhythm: "personal_life",
  work_schedule: "work",
  remote_work: "work",
  shift_work: "work",
  frequent_travel: "work",
  bed_time: "health_recovery",
  wake_time: "health_recovery",
  energy_peak: "health_recovery",
  preferred_morning: "preferences",
  preferred_evening: "preferences",
  quiet_notifications: "preferences",
  ideal_session_duration: "preferences",
};

function item(
  id: string,
  category: LifeKnowledgeCategory,
  label: string,
  value: string,
  source: LifeKnowledgeSource,
  confidence: number,
  status: LifeKnowledgeItem["status"],
  evidence?: string[],
): LifeKnowledgeItem {
  const now = new Date().toISOString();
  return {
    id,
    category,
    label,
    value,
    source,
    confidence,
    status,
    createdAt: now,
    updatedAt: now,
    lastVerifiedAt: source === "settings" || source === "user_confirmed" ? now : undefined,
    evidence,
  };
}

function stringifyFactValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function mergeKnowledgeFromSources(input: LifeKnowledgeInput): LifeKnowledgeItem[] {
  const items: LifeKnowledgeItem[] = [];

  for (const fact of input.profileFacts ?? []) {
    const category = FACT_CATEGORY_MAP[fact.fact_key] ?? "personal_life";
    const rawValue =
      fact.fact_value.value ??
      fact.fact_value.bed_time ??
      fact.fact_value.wake_time ??
      fact.fact_value.start;
    const value = stringifyFactValue(rawValue);
    if (!value) continue;

    items.push(
      item(
        `fact-${fact.fact_key}`,
        category,
        fact.fact_key.replace(/_/g, " "),
        value,
        "settings",
        0.95,
        "confirmed",
        ["Paramètres utilisateur"],
      ),
    );
  }

  if ((input.childrenCount ?? 0) > 0) {
    items.push(
      item(
        "derived-children",
        "personal_life",
        "Enfants",
        `${input.childrenCount} enfant(s)`,
        "settings",
        0.98,
        "confirmed",
        ["Contexte foyer"],
      ),
    );
  }

  for (const insight of input.livingInsights ?? []) {
    const isConfirmed = insight.status === "confirmed";
    items.push(
      item(
        `living-${insight.id}`,
        mapLivingCategory(insight.category),
        insight.label,
        insight.detail,
        "observed",
        insight.confidence,
        isConfirmed ? "confirmed" : "pending_confirmation",
        [insight.category],
      ),
    );
  }

  for (const pref of input.validatedPreferences ?? []) {
    items.push(
      item(
        `pref-${pref.id}`,
        "preferences",
        pref.label,
        pref.proposedValue,
        "user_confirmed",
        Math.max(0.9, pref.confidence),
        "confirmed",
        ["Préférence validée par l'utilisateur"],
      ),
    );
  }

  for (const goal of input.activeGoals ?? []) {
    items.push(
      item(
        `goal-${goal.id}`,
        "long_term_goals",
        "Objectif",
        goal.name,
        "goals",
        0.88,
        "confirmed",
        ["Objectif créé par l'utilisateur"],
      ),
    );
  }

  return dedupeItems(items);
}

function mapLivingCategory(category: string): LifeKnowledgeCategory {
  if (/work|travail|job/i.test(category)) return "work";
  if (/sleep|sommeil|health|santé|recovery/i.test(category)) return "health_recovery";
  if (/goal|objectif/i.test(category)) return "long_term_goals";
  if (/prefer|habit|habitude/i.test(category)) return "preferences";
  if (/life|famille|family|move|vacation/i.test(category)) return "life_changes";
  return "personal_life";
}

function dedupeItems(items: LifeKnowledgeItem[]): LifeKnowledgeItem[] {
  const seen = new Map<string, LifeKnowledgeItem>();
  for (const entry of items) {
    const key = `${entry.category}:${entry.label.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing || entry.confidence > existing.confidence) {
      seen.set(key, entry);
    }
  }
  return [...seen.values()];
}
