import type { MemoryProfile } from "../../ai/memoryEngine";
import type { SpiritualPreferences } from "../../types/spiritual";

export function buildSpiritualPreferences(
  profile: Partial<MemoryProfile>,
): SpiritualPreferences {
  const showOnHomeRaw = profile.spiritualShowOnHome;

  return {
    faithImportance: profile.faithImportance,
    faithContent: profile.faithContent ?? [],
    frequency: profile.spiritualFrequency,
    preferredDuration: profile.spiritualPreferredDuration,
    preferredMoment: profile.spiritualPreferredMoment,
    themesAvoid: profile.spiritualThemesAvoid ?? [],
    showOnHome: showOnHomeRaw !== "no",
    afterWorkEnergy: profile.afterWorkEnergy,
  };
}
