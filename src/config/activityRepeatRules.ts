import type { LifeProposalCategory } from "../types/lifeContext";

export type ActivityCategoryKey =
  | "sport"
  | "study"
  | "reading"
  | "calm"
  | "spiritual"
  | "couple"
  | "family"
  | "leisure"
  | "rest"
  | "keep_free"
  | "outing"
  | "admin";

export type ActivityRepeatRule = {
  automaticDailyLimit: number | null;
  minGapMinutes?: number;
  manualAllowed: boolean;
};

export const ACTIVITY_REPEAT_RULES: Record<ActivityCategoryKey, ActivityRepeatRule> = {
  sport: { automaticDailyLimit: 1, manualAllowed: true },
  study: { automaticDailyLimit: 3, minGapMinutes: 90, manualAllowed: true },
  reading: { automaticDailyLimit: 2, manualAllowed: true },
  calm: { automaticDailyLimit: 2, manualAllowed: true },
  spiritual: { automaticDailyLimit: 2, manualAllowed: true },
  couple: { automaticDailyLimit: 1, manualAllowed: true },
  family: { automaticDailyLimit: 2, manualAllowed: true },
  outing: { automaticDailyLimit: 2, manualAllowed: true },
  leisure: { automaticDailyLimit: 2, manualAllowed: true },
  rest: { automaticDailyLimit: null, manualAllowed: true },
  admin: { automaticDailyLimit: null, manualAllowed: true },
  keep_free: { automaticDailyLimit: null, manualAllowed: true },
};

export const MAX_SLOT_SUGGESTIONS = 5;

export function mapProposalCategoryToRepeatKey(
  category: LifeProposalCategory,
): ActivityCategoryKey {
  switch (category) {
    case "sport":
      return "sport";
    case "study":
      return "study";
    case "reading":
      return "reading";
    case "calm":
      return "calm";
    case "spiritual":
      return "spiritual";
    case "couple":
      return "couple";
    case "family":
      return "family";
    case "outing":
      return "outing";
    case "leisure":
      return "leisure";
    case "rest":
      return "rest";
    case "admin":
      return "admin";
    case "keep_free":
      return "keep_free";
    default:
      return "rest";
  }
}
