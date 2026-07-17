import { MAX_SLOT_SUGGESTIONS } from "../../config/activityRepeatRules";
import type { TimelineSlotSuggestion } from "./displayedDayTimeline";
import type { FreeTimeSuggestion } from "../../types/freeTimeSuggestion";
import type { LifeProposalCategory } from "../../types/lifeContext";
import type { FreeSlotInput } from "../../ai/freeTimeSuggestionEngine";

const TIMELINE_TO_LIFE_CATEGORY: Record<string, LifeProposalCategory> = {
  study: "study",
  sport: "sport",
  calm: "calm",
  couple: "couple",
  family: "family",
  outing: "outing",
  leisure: "leisure",
  spiritual: "spiritual",
  reading: "reading",
  rest: "rest",
  keep_free: "keep_free",
  wind_down: "calm",
};

const LIFE_TO_SUGGESTION_TYPE: Record<
  LifeProposalCategory,
  FreeTimeSuggestion["type"]
> = {
  sport: "sport",
  study: "study",
  calm: "calm",
  family: "family_outing",
  admin: "personal_task",
  reading: "personal_task",
  spiritual: "spiritual",
  rest: "calm",
  outing: "vacation_activity",
  leisure: "leisure",
  couple: "personal_task",
  keep_free: "keep_free",
};

const LIFE_TO_ACTION: Record<
  LifeProposalCategory,
  FreeTimeSuggestion["action"]
> = {
  sport: "generate_sport",
  study: "assign_study",
  calm: "open_calm",
  family: "create_family",
  admin: "create_task",
  reading: "create_task",
  spiritual: "show_spiritual",
  rest: "open_calm",
  outing: "create_family",
  leisure: "add_leisure",
  couple: "create_task",
  keep_free: "keep_free",
};

function suggestionMatchesPrimary(
  suggestion: FreeTimeSuggestion,
  lifeCategory: LifeProposalCategory,
): boolean {
  if (lifeCategory === "study") return suggestion.type === "study";
  if (lifeCategory === "sport") return suggestion.type === "sport";
  if (lifeCategory === "calm" || lifeCategory === "rest") {
    return suggestion.type === "calm";
  }
  if (lifeCategory === "couple") {
    return /couple/i.test(suggestion.title);
  }
  if (lifeCategory === "spiritual") return suggestion.type === "spiritual";
  if (lifeCategory === "family" || lifeCategory === "outing") {
    return suggestion.type === "family_outing" || suggestion.type === "vacation_activity";
  }
  if (lifeCategory === "leisure") return suggestion.type === "leisure";
  if (lifeCategory === "reading") {
    return suggestion.type === "personal_task" && /lecture/i.test(suggestion.title);
  }
  return false;
}

function primaryToFreeTimeSuggestion(
  primary: TimelineSlotSuggestion,
  slot: FreeSlotInput,
): FreeTimeSuggestion | null {
  const lifeCategory =
    TIMELINE_TO_LIFE_CATEGORY[primary.category] ??
    (primary.category as LifeProposalCategory);

  if (!lifeCategory || lifeCategory === "keep_free") return null;

  const duration =
    primary.durationMinutes > 0
      ? Math.min(primary.durationMinutes, slot.durationMinutes)
      : 0;

  if (duration === 0 && primary.durationMinutes > 0) {
    return null;
  }

  return {
    id: primary.id || `primary-${lifeCategory}-${slot.id}`,
    type: LIFE_TO_SUGGESTION_TYPE[lifeCategory],
    title: primary.title,
    description: primary.description,
    recommendedDuration: duration,
    reason: primary.reason,
    priority: "high",
    action: LIFE_TO_ACTION[lifeCategory],
  };
}

export function ensurePrimarySuggestionInList({
  suggestions,
  primarySuggestion,
  slot,
}: {
  suggestions: FreeTimeSuggestion[];
  primarySuggestion?: TimelineSlotSuggestion;
  slot: FreeSlotInput;
}): FreeTimeSuggestion[] {
  if (!primarySuggestion) return suggestions.slice(0, MAX_SLOT_SUGGESTIONS);

  const lifeCategory =
    TIMELINE_TO_LIFE_CATEGORY[primarySuggestion.category] ??
    (primarySuggestion.category as LifeProposalCategory);

  if (!lifeCategory || lifeCategory === "keep_free") {
    return suggestions.slice(0, MAX_SLOT_SUGGESTIONS);
  }

  const keepFree = suggestions.find((item) => item.type === "keep_free");
  const withoutKeepFree = suggestions.filter((item) => item.type !== "keep_free");

  const alreadyPresent = withoutKeepFree.some((item) =>
    suggestionMatchesPrimary(item, lifeCategory),
  );

  let ordered = withoutKeepFree;

  if (!alreadyPresent) {
    const injected = primaryToFreeTimeSuggestion(primarySuggestion, slot);
    if (injected) {
      ordered = [injected, ...withoutKeepFree];
    }
  } else {
    const matchIndex = withoutKeepFree.findIndex((item) =>
      suggestionMatchesPrimary(item, lifeCategory),
    );
    if (matchIndex > 0) {
      const match = withoutKeepFree[matchIndex];
      ordered = [
        match,
        ...withoutKeepFree.slice(0, matchIndex),
        ...withoutKeepFree.slice(matchIndex + 1),
      ];
    }
  }

  const trimmed = ordered.slice(0, MAX_SLOT_SUGGESTIONS - (keepFree ? 1 : 0));
  const result = keepFree ? [...trimmed, keepFree] : trimmed;

  return result.slice(0, MAX_SLOT_SUGGESTIONS);
}
