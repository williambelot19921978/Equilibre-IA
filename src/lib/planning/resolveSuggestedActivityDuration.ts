import type { LifeDayType, LifeEnergyPrediction } from "../../types/lifeContext";
import { resolveRecommendedSportDuration } from "./resolveSportDuration";

export type SuggestedActivityType =
  | "sport"
  | "study"
  | "calm"
  | "couple"
  | "family_outing"
  | "reading"
  | "leisure"
  | "spiritual"
  | "film"
  | "board_game"
  | "walk";

export function resolveSuggestedActivityDuration({
  activityType,
  freeSlotDuration,
  energy = "medium",
  dayType = "WORKDAY",
  preferredFocusMinutes = 25,
  leisureSubtype,
}: {
  activityType: SuggestedActivityType;
  freeSlotDuration: number;
  energy?: LifeEnergyPrediction | string;
  dayType?: LifeDayType;
  preferredFocusMinutes?: number;
  leisureSubtype?: string;
}): number {
  const tired = energy === "low";
  const capped = (minutes: number) => Math.min(minutes, freeSlotDuration);

  switch (activityType) {
    case "sport":
      return capped(
        resolveRecommendedSportDuration({
          slotMinutes: freeSlotDuration,
          energy,
          preferredMinutes: preferredFocusMinutes,
        }),
      );
    case "study":
      if (tired) return capped(Math.min(15, freeSlotDuration));
      return capped(Math.min(Math.max(preferredFocusMinutes, 20), 45));
    case "calm":
      return capped(Math.min(tired ? 30 : 20, 30));
    case "couple":
      return freeSlotDuration;
    case "family_outing":
      return capped(Math.max(60, Math.min(freeSlotDuration, 180)));
    case "reading":
      return capped(Math.min(tired ? 20 : 45, 45));
    case "spiritual":
      return capped(Math.min(15, 30));
    case "film":
      return capped(Math.min(150, Math.max(90, freeSlotDuration)));
    case "board_game":
      return capped(Math.min(120, Math.max(45, freeSlotDuration)));
    case "walk":
      return capped(Math.min(90, Math.max(30, freeSlotDuration)));
    case "leisure":
      if (leisureSubtype === "film") {
        return resolveSuggestedActivityDuration({
          activityType: "film",
          freeSlotDuration,
          energy,
          dayType,
        });
      }
      if (leisureSubtype === "board_game") {
        return resolveSuggestedActivityDuration({
          activityType: "board_game",
          freeSlotDuration,
          energy,
          dayType,
        });
      }
      return capped(Math.min(45, freeSlotDuration));
    default:
      return capped(Math.min(30, freeSlotDuration));
  }
}
