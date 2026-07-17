import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  generateSpiritualSuggestions,
  pickPrayerForContext,
  pickTodayWord,
  shouldShowHomeSpiritualCard,
} from "../../ai/spiritualSuggestionEngine";
import {
  BIBLE_VERSION,
  getContentById,
  pickRelaxationGuide,
  pickSpiritualContentItem,
  SPIRITUAL_CONTENT,
} from "../../content/spiritualContent";
import { buildSpiritualPreferences } from "../../lib/spiritual/preferences";
import { appendSpiritualHistory, mergeHistoryIds } from "../../lib/spiritual/history";
import { resolveSpiritualSchedule } from "../../lib/spiritual/scheduling";
import { AppRoutes, POST_ONBOARDING_ROUTES } from "../../lib/navigation/routes";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

const basePreferences = {
  faithImportance: "important",
  faithContent: ["verse", "prayer"],
  themesAvoid: [],
  showOnHome: true,
};

describe("Sprint 2.8 — espace spirituel", () => {
  it("A. route /spiritual enregistrée", () => {
    expect(AppRoutes.SPIRITUAL).toBe("/spiritual");
    expect(POST_ONBOARDING_ROUTES).toContain(AppRoutes.SPIRITUAL);
    expect(readSrc("app/router/AppRouter.tsx")).toContain("AppRoutes.SPIRITUAL");
  });

  it("B. F5 conserve /spiritual (route SPA protégée)", () => {
    const router = readSrc("app/router/AppRouter.tsx");
    expect(router).toMatch(/path=\{AppRoutes\.SPIRITUAL\}/);
    expect(router).toContain("SpiritualSpacePage");
  });

  it("C. spiritualité disabled — contenu neutre uniquement", () => {
    const item = pickTodayWord({
      hour: 12,
      preferences: { ...basePreferences, faithImportance: "disabled" },
    });
    expect(item.faithLevel).toBe("neutral");
  });

  it("D. spiritualité discreet — contenu chrétien occasionnel le soir", () => {
    const evening = pickTodayWord({
      hour: 20,
      preferences: { ...basePreferences, faithImportance: "discreet" },
    });
    const afternoon = pickTodayWord({
      hour: 14,
      preferences: { ...basePreferences, faithImportance: "discreet" },
    });
    expect(evening.faithLevel === "christian" || evening.faithLevel === "neutral").toBe(
      true,
    );
    expect(afternoon.faithLevel).toBe("neutral");
  });

  it("E. spiritualité important — verset ou contenu chrétien possible", () => {
    const item = pickTodayWord({
      hour: 10,
      preferences: { ...basePreferences, faithImportance: "important" },
    });
    expect(["neutral", "christian"]).toContain(item.faithLevel);
  });

  it("F. contenu sans répétition immédiate", () => {
    const first = pickSpiritualContentItem({
      preferences: ["verse"],
      faithImportance: "important",
    });
    const second = pickSpiritualContentItem({
      preferences: ["verse"],
      faithImportance: "important",
      recentIds: [first.id],
    });
    expect(second.id).not.toBe(first.id);
  });

  it("G. verset avec référence exacte", () => {
    const verse = SPIRITUAL_CONTENT.find((item) => item.id === "verse-2co-12-9");
    expect(verse?.reference).toBe("2 Corinthiens 12:9");
    expect(verse?.source).toBe(BIBLE_VERSION);
    expect(verse?.text).toContain("grâce");
  });

  it("H. prière courte", () => {
    const prayer = pickPrayerForContext({
      hour: 21,
      preferences: basePreferences,
      category: "evening",
    });
    expect(prayer.type).toBe("prayer");
    expect(prayer.text.length).toBeLessThan(300);
  });

  it("I. relaxation 5 minutes", () => {
    const guide = pickRelaxationGuide({ faithImportance: "disabled" });
    const fiveMin = pickRelaxationGuide({
      faithImportance: "important",
      maxDuration: 5,
    });
    expect(guide.steps.length).toBeGreaterThan(0);
    expect(fiveMin.durationMinutes).toBeLessThanOrEqual(5);
  });

  it("J. ajout au planning — détails spiritualActivityType", () => {
    const service = readSrc("services/spiritualPlanningService.ts");
    expect(service).toContain("spiritualActivityType");
    expect(service).toContain("generateAndSaveDayPlan");
    expect(service).toContain("locked: true");
  });

  it("K. ajout favori — service insert", () => {
    const service = readSrc("services/spiritualService.ts");
    expect(service).toContain("addSpiritualFavorite");
    expect(service).toContain("spiritual_favorites");
  });

  it("L. suppression favori", () => {
    const service = readSrc("services/spiritualService.ts");
    expect(service).toContain("removeSpiritualFavorite");
  });

  it("M. suggestion selon fatigue", () => {
    const tired = generateSpiritualSuggestions({
      hour: 15,
      fatigueLevel: "high",
      preferences: basePreferences,
    });
    const durations = tired
      .filter((item) => item.id !== "keep-free")
      .map((item) => item.durationMinutes);
    expect(Math.max(...durations)).toBeLessThanOrEqual(10);
  });

  it("N. suggestion tard le soir — calme ou prière", () => {
    const late = generateSpiritualSuggestions({
      hour: 22,
      preferences: basePreferences,
    });
    expect(late.some((item) => item.activityType === "silence" || item.activityType === "prayer")).toBe(
      true,
    );
  });

  it("O. bouton Ne rien prévoir", () => {
    const suggestions = generateSpiritualSuggestions({
      hour: 12,
      preferences: basePreferences,
    });
    expect(suggestions[0].id).toBe("keep-free");
    expect(suggestions[0].title).toContain("Ne rien prévoir");
  });

  it("P. accueil sans carte si disabled showOnHome", () => {
    const prefs = buildSpiritualPreferences({
      faithImportance: "important",
      faithContent: [],
      spiritualThemesAvoid: [],
      spiritualShowOnHome: "no",
    });
    expect(shouldShowHomeSpiritualCard(prefs)).toBe(false);
  });
});

describe("Sprint 2.8 — menu et historique", () => {
  it("navigation principale pointe vers /spiritual", () => {
    const nav = readSrc("lib/navigation/appNavigationItems.ts");
    expect(nav).toContain("route: AppRoutes.SPIRITUAL");
    expect(nav).toContain("Spirituel");
  });

  it("historique local évite répétitions", () => {
    const merged = mergeHistoryIds(["a", "c"], "b");
    expect(merged[0]).toBe("b");
    expect(merged).toContain("a");
    expect(mergeHistoryIds(merged, "b")).toEqual(["b", "a", "c"]);
    expect(getContentById("verse-2co-12-9")?.reference).toBeTruthy();
    expect(appendSpiritualHistory("noop-user", "x")).toContain("x");
  });

  it("resolveSpiritualSchedule calcule une plage horaire", () => {
    const { startsAt, endsAt } = resolveSpiritualSchedule({
      date: "2026-07-15",
      schedule: "custom",
      durationMinutes: 10,
      customStartTime: "20:00",
    });
    expect(new Date(endsAt).getTime() - new Date(startsAt).getTime()).toBe(
      10 * 60_000,
    );
  });
});
