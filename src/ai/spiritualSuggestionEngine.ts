import {
  pickRelaxationGuide,
  pickSpiritualContentItem,
} from "../content/spiritualContent";
import type {
  SpiritualContentItem,
  SpiritualPreferences,
  SpiritualSuggestion,
} from "../types/spiritual";

export type SpiritualSuggestionInput = {
  hour: number;
  availableMinutes?: number;
  fatigueLevel?: "low" | "medium" | "high";
  isVacation?: boolean;
  isAlone?: boolean;
  preferences: SpiritualPreferences;
  recentIds?: string[];
  recentContentIds?: string[];
};

function resolveFatigue(
  input: SpiritualSuggestionInput,
): "low" | "medium" | "high" {
  if (input.fatigueLevel) return input.fatigueLevel;
  if (input.preferences.afterWorkEnergy === "low") return "high";
  if (input.preferences.afterWorkEnergy === "high") return "low";
  return "medium";
}

function allowsChristianContent(faithImportance?: string): boolean {
  return Boolean(faithImportance && faithImportance !== "disabled");
}

function shouldOfferChristianToday(input: SpiritualSuggestionInput): boolean {
  const faith = input.preferences.faithImportance;
  if (!allowsChristianContent(faith)) return false;
  if (faith === "important") return true;
  if (faith === "discreet") return input.hour >= 18;
  if (faith === "when_needed") {
    return (
      resolveFatigue(input) === "high" ||
      input.hour >= 20 ||
      input.isAlone === true
    );
  }
  return false;
}

function buildKeepFreeSuggestion(): SpiritualSuggestion {
  return {
    id: "keep-free",
    activityType: "reflection",
    title: "Ne rien prévoir",
    description: "Conserver ce moment sans activité ajoutée.",
    durationMinutes: 0,
    reason: "Toujours possible — jamais imposé.",
    optional: true,
  };
}

function preferredDuration(input: SpiritualSuggestionInput): number {
  return input.preferences.preferredDuration ?? 10;
}

function maxDuration(input: SpiritualSuggestionInput): number {
  const pref = preferredDuration(input);
  const available = input.availableMinutes ?? pref;
  const fatigue = resolveFatigue(input);

  if (fatigue === "high" || input.isAlone) {
    return Math.min(available, 10, pref);
  }

  if (input.hour >= 21) {
    return Math.min(available, 15, pref);
  }

  return Math.min(available, pref, 30);
}

function eveningContext(hour: number): boolean {
  return hour >= 19;
}

export function generateSpiritualSuggestions(
  input: SpiritualSuggestionInput,
): SpiritualSuggestion[] {
  const suggestions: SpiritualSuggestion[] = [buildKeepFreeSuggestion()];
  const maxMin = maxDuration(input);
  const recent = [
    ...(input.recentIds ?? []),
    ...(input.recentContentIds ?? []),
  ];
  const faith = input.preferences.faithImportance;
  const christian = shouldOfferChristianToday(input);
  const evening = eveningContext(input.hour);
  const fatigue = resolveFatigue(input);

  if (maxMin >= 2) {
    const guide = pickRelaxationGuide({
      recentIds: recent,
      faithImportance: faith,
      maxDuration: Math.min(maxMin, 5),
    });

    suggestions.push({
      id: `relax-${guide.id}`,
      activityType: guide.id.startsWith("breath") ? "breathing" : "relaxation",
      title: guide.title,
      description: guide.steps[0],
      durationMinutes: Math.min(guide.durationMinutes, maxMin),
      reason:
        fatigue === "high"
          ? "Format très court adapté à ta fatigue."
          : "Un moment pour te recentrer.",
      optional: true,
      guide,
    });
  }

  if (evening && maxMin >= 5) {
    suggestions.push({
      id: "silence-evening",
      activityType: "silence",
      title: "Silence — 5 minutes",
      description: "Quelques minutes sans bruit ni écran.",
      durationMinutes: Math.min(5, maxMin),
      reason: "Le soir, le calme aide à terminer la journée en douceur.",
      optional: true,
    });
  }

  if (maxMin >= 5) {
    suggestions.push({
      id: "gratitude-short",
      activityType: "gratitude",
      title: "Gratitude — 5 min",
      description: "Trois choses simples pour lesquelles tu es reconnaissante.",
      durationMinutes: Math.min(5, maxMin),
      reason: "Facultatif — pour clore ou marquer une pause.",
      optional: true,
      content: pickSpiritualContentItem({
        preferences: input.preferences.faithContent,
        recentIds: recent,
        faithImportance: faith,
        types: ["gratitude"],
      }),
    });
  }

  if (christian && maxMin >= 5) {
    const prayer = pickSpiritualContentItem({
      preferences: input.preferences.faithContent,
      recentIds: recent,
      faithImportance: faith,
      types: ["prayer"],
      contexts: evening ? ["evening"] : ["any"],
    });

    suggestions.push({
      id: `prayer-${prayer.id}`,
      activityType: "prayer",
      title: evening ? "Courte prière du soir" : "Courte prière",
      description: prayer.text.slice(0, 120),
      durationMinutes: Math.min(prayer.durationMinutes, maxMin),
      reason: "Proposition facultative selon tes préférences.",
      optional: true,
      content: prayer,
    });
  }

  if (christian && maxMin >= 3) {
    const verse = pickSpiritualContentItem({
      preferences: input.preferences.faithContent,
      recentIds: recent,
      faithImportance: faith,
      types: ["verse"],
    });

    suggestions.push({
      id: `reading-${verse.id}`,
      activityType: "reading",
      title: "Lecture d'un verset",
      description: `${verse.reference ?? "Verset"} — lecture courte.`,
      durationMinutes: Math.min(verse.durationMinutes, maxMin),
      reason: "Lecture spirituelle facultative.",
      optional: true,
      content: verse,
    });
  }

  if (maxMin >= 10 && fatigue !== "high") {
    suggestions.push({
      id: "walk-calm",
      activityType: "walk",
      title: "Marche calme",
      description: "Quelques minutes de marche lente, sans objectif.",
      durationMinutes: Math.min(10, maxMin),
      reason: input.isVacation
        ? "En vacances, une marche légère peut faire du bien."
        : "Bouger doucement peut apaiser le corps.",
      optional: true,
    });
  }

  if (maxMin >= 5) {
    suggestions.push({
      id: "screen-free",
      activityType: "screen_free",
      title: "Temps sans écran",
      description: "Pose le téléphone et accorde-toi quelques minutes calmes.",
      durationMinutes: Math.min(15, maxMin),
      reason: "Repos réel, sans culpabiliser.",
      optional: true,
    });
  }

  if (maxMin >= 10) {
    const reflection = pickSpiritualContentItem({
      preferences: input.preferences.faithContent,
      recentIds: recent,
      faithImportance: faith,
      types: ["reflection"],
      contexts: evening ? ["evening"] : ["any"],
    });

    suggestions.push({
      id: `reflection-${reflection.id}`,
      activityType: "reflection",
      title: "Réflexion — patience et repos",
      description: reflection.text.slice(0, 100),
      durationMinutes: Math.min(reflection.durationMinutes, maxMin),
      reason: "Prendre un temps pour toi, sans obligation.",
      optional: true,
      content: reflection,
    });
  }

  return suggestions.slice(0, 8);
}

export function pickTodayWord(
  input: SpiritualSuggestionInput,
): SpiritualContentItem {
  const recent = [
    ...(input.recentIds ?? []),
    ...(input.recentContentIds ?? []),
  ];
  const christian = shouldOfferChristianToday(input);

  if (christian) {
    const types: SpiritualContentItem["type"][] = [
      "motivation",
      "verse",
      "encouragement",
      "reflection",
    ];

    return pickSpiritualContentItem({
      preferences: input.preferences.faithContent,
      recentIds: recent,
      faithImportance: input.preferences.faithImportance,
      types,
      contexts: eveningContext(input.hour) ? ["evening", "any"] : ["any"],
    });
  }

  return pickSpiritualContentItem({
    preferences: [],
    recentIds: recent,
    faithImportance: "disabled",
    types: ["motivation", "calm_invitation", "gratitude", "reflection"],
  });
}

export function pickPrayerForContext(
  input: SpiritualSuggestionInput & { category?: SpiritualContentItem["prayerCategory"] },
): SpiritualContentItem {
  const hour = input.hour;
  const category =
    input.category ??
    (hour < 12 ? "morning" : hour >= 19 ? "evening" : "peace");

  const recent = [
    ...(input.recentIds ?? []),
    ...(input.recentContentIds ?? []),
  ];

  return pickSpiritualContentItem({
    preferences: input.preferences.faithContent,
    recentIds: recent,
    faithImportance: input.preferences.faithImportance,
    types: ["prayer"],
    prayerCategory: category,
  });
}

export function isSpiritualAutoOfferEnabled(
  faithImportance?: string,
): boolean {
  return Boolean(faithImportance && faithImportance !== "disabled");
}

export function shouldShowHomeSpiritualCard(
  preferences: SpiritualPreferences,
): boolean {
  return preferences.showOnHome !== false;
}

export function buildSpiritualInputFromLifeContext(
  lifeContext: import("../types/lifeContext").LifeContext,
  preferences: SpiritualPreferences,
  hour: number = new Date().getHours(),
): SpiritualSuggestionInput {
  return {
    hour,
    availableMinutes:
      lifeContext.freeSlots[0]?.durationMinutes ?? preferences.preferredDuration,
    fatigueLevel:
      lifeContext.energyPrediction === "low"
        ? "high"
        : lifeContext.energyPrediction === "high"
          ? "low"
          : "medium",
    isVacation: lifeContext.vacation,
    isAlone:
      lifeContext.familySituation === "parent_alone" ||
      lifeContext.familySituation === "partner_absent",
    preferences,
  };
}
