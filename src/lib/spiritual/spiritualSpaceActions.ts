import type { RelaxationGuide } from "../../types/spiritual";
import type { SpiritualSuggestion } from "../../types/spiritual";
import {
  pickPrayerForContext,
  pickTodayWord,
  type SpiritualSuggestionInput,
} from "../../ai/spiritualSuggestionEngine";
import { pickRelaxationGuide } from "../../content/spiritualContent";
import { MUSIC_PLAYLISTS } from "../../data/leisureContentLibrary";

export type SpiritualSpaceActionType =
  | "refreshSuggestion"
  | "addSuggestionToDay"
  | "startRelaxation"
  | "addFavorite"
  | "removeFavorite"
  | "showAnotherPrayer"
  | "openSpotify"
  | "savePreferences"
  | "addCalmTime"
  | "showAnotherRelaxation"
  | "focusPreferences";

export type SpiritualActionLogPayload = {
  action: SpiritualSpaceActionType;
  contentId?: string;
  suggestionId?: string;
  disabled?: boolean;
};

export function logSpiritualAction(payload: SpiritualActionLogPayload): void {
  if (import.meta.env.DEV) {
    console.log("[SPIRITUAL ACTION]", payload);
  }
}

export function findSuggestionForTakeTimeOption(
  optionId: string,
  suggestions: SpiritualSuggestion[],
): SpiritualSuggestion | undefined {
  const eligible = suggestions.filter((item) => item.id !== "keep-free");

  const direct = eligible.find((item) => item.activityType === optionId);
  if (direct) return direct;

  const aliasMap: Record<string, SpiritualSuggestion["activityType"][]> = {
    relaxation: ["relaxation", "breathing"],
  };

  const aliases = aliasMap[optionId];
  if (aliases) {
    return eligible.find((item) => aliases.includes(item.activityType));
  }

  return undefined;
}

export function pickAnotherTodayWord(
  input: SpiritualSuggestionInput,
  currentId: string,
) {
  const recentContentIds = [
    ...(input.recentContentIds ?? []),
    ...(input.recentIds ?? []),
    currentId,
  ];

  const next = pickTodayWord({
    ...input,
    recentContentIds,
  });

  return { next, isDifferent: next.id !== currentId };
}

export function pickAnotherPrayerItem(
  input: SpiritualSuggestionInput & { category?: string },
  currentId: string,
) {
  const recentContentIds = [...(input.recentContentIds ?? []), currentId];
  const next = pickPrayerForContext({
    ...input,
    recentContentIds,
    category: input.category as never,
  });

  return { next, isDifferent: next.id !== currentId };
}

export function pickAnotherRelaxationGuide(
  options: {
    recentIds: string[];
    faithImportance?: string;
  },
  currentId: string,
) {
  const next = pickRelaxationGuide({
    ...options,
    recentIds: [...options.recentIds, currentId],
  });

  return { next, isDifferent: next.id !== currentId };
}

export function resolveSpiritualSpotifyUrl(
  profileMusicPreference?: string | string[] | null,
): string | null {
  const raw = Array.isArray(profileMusicPreference)
    ? profileMusicPreference[0]
    : profileMusicPreference;

  if (raw && /^https?:\/\//i.test(raw)) {
    return raw;
  }

  const calmPlaylist = MUSIC_PLAYLISTS.find((playlist) =>
    /calme|relax|détente|meditat/i.test(playlist.title),
  );

  return calmPlaylist?.spotifyUrl ?? null;
}

export function openSpiritualSpotify(url: string | null): {
  ok: boolean;
  message?: string;
} {
  if (!url) {
    return {
      ok: false,
      message: "Spotify n'est pas encore configuré.",
    };
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true };
}

export function buildRelaxationSuggestion(
  guide: RelaxationGuide,
): SpiritualSuggestion {
  return {
    id: guide.id,
    activityType: guide.id.startsWith("breath") ? "breathing" : "relaxation",
    title: guide.title,
    description: guide.steps[0] ?? "Relaxation guidée",
    durationMinutes: guide.durationMinutes,
    reason: "Relaxation guidée",
    optional: true,
    guide,
  };
}
