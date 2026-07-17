import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateSpiritualSuggestions } from "../../ai/spiritualSuggestionEngine";
import {
  findSuggestionForTakeTimeOption,
  openSpiritualSpotify,
  pickAnotherPrayerItem,
  pickAnotherRelaxationGuide,
  pickAnotherTodayWord,
  resolveSpiritualSpotifyUrl,
} from "../../lib/spiritual/spiritualSpaceActions";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const basePreferences = {
  faithImportance: "important",
  faithContent: ["verse", "prayer"],
  themesAvoid: [],
  showOnHome: true,
};

const baseInput = {
  hour: 20,
  preferences: basePreferences,
  recentContentIds: [] as string[],
};

describe("Correctif Espace spirituel — wiring actions", () => {
  it("A. autre proposition change le contenu", () => {
    const first = pickAnotherTodayWord(baseInput, "").next;
    const second = pickAnotherTodayWord(baseInput, first.id);
    expect(second.isDifferent).toBe(true);
    expect(second.next.id).not.toBe(first.id);
  });

  it("B. proposition différente exclut l'actuelle", () => {
    const first = pickAnotherTodayWord(baseInput, "").next;
    const again = pickAnotherTodayWord(baseInput, first.id);
    expect(again.next.id).not.toBe(first.id);
  });

  it("C. ajout au planning — service contient champs requis", () => {
    const service = readSrc("services/spiritualPlanningService.ts");
    expect(service).toContain("spiritualActivityType");
    expect(service).toContain("contentId");
    expect(service).toContain("generateAndSaveDayPlan");
  });

  it("D. modal AddToDay utilise modal-overlay + portal", () => {
    const modal = readSrc("components/spiritual/AddToDayModal.tsx");
    expect(modal).toContain("modal-overlay");
    expect(modal).toContain("createPortal");
    expect(modal).not.toContain("modal-backdrop");
  });

  it("E. favori — service insert", () => {
    expect(readSrc("services/spiritualService.ts")).toContain("addSpiritualFavorite");
  });

  it("F. favori — service delete", () => {
    expect(readSrc("services/spiritualService.ts")).toContain("removeSpiritualFavorite");
  });

  it("G. autre prière différente", () => {
    const first = pickAnotherPrayerItem(
      { ...baseInput, category: "evening" },
      "",
    ).next;
    const second = pickAnotherPrayerItem(
      { ...baseInput, category: "evening" },
      first.id,
    );
    expect(second.isDifferent).toBe(true);
  });

  it("H. relaxation — modal player présent", () => {
    const modal = readSrc("components/spiritual/RelaxationPlayerModal.tsx");
    expect(modal).toContain("RelaxationPlayerModal");
    expect(modal).toContain("Démarrer");
    expect(modal).toContain("modal-overlay");
  });

  it("I. démarrage relaxation branché sur la page", () => {
    const page = readSrc("pages/SpiritualSpacePage.tsx");
    expect(page).toContain("Lancer une relaxation");
    expect(page).toContain("handleStartRelaxation");
    expect(page).toContain("RelaxationPlayerModal");
  });

  it("J. Spotify configuré — URL valide", () => {
    const url = resolveSpiritualSpotifyUrl(["https://open.spotify.com/playlist/test"]);
    expect(url).toMatch(/^https:\/\/open\.spotify\.com\//);
  });

  it("K. Spotify non configuré — message explicite", () => {
    const result = openSpiritualSpotify(null);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Spotify n'est pas encore configuré");
  });

  it("L. préférences sauvegardées via action centrale", () => {
    const page = readSrc("pages/SpiritualSpacePage.tsx");
    expect(page).toContain("handleSavePreference");
    expect(page).toContain("saveProfileSectionFacts");
    expect(page).toContain('action: "savePreferences"');
  });

  it("M. erreur Supabase visible sur la page", () => {
    const page = readSrc("pages/SpiritualSpacePage.tsx");
    expect(page).toContain("message message-error");
    expect(page).toContain("Impossible d'ajouter aux favoris");
  });

  it("N. inventaire central des actions", () => {
    const actions = readSrc("lib/spiritual/spiritualSpaceActions.ts");
    expect(actions).toContain("refreshSuggestion");
    expect(actions).toContain("addSuggestionToDay");
    expect(actions).toContain("startRelaxation");
    expect(actions).toContain("logSpiritualAction");
    expect(readSrc("pages/SpiritualSpacePage.tsx")).toContain(
      "logSpiritualAction",
    );
  });

  it("O. aucun clic silencieux sur chip sans suggestion", () => {
    const suggestions = generateSpiritualSuggestions({
      hour: 8,
      preferences: basePreferences,
    });
    const music = findSuggestionForTakeTimeOption("music", suggestions);
    expect(music).toBeUndefined();
  });

  it("P. chip relaxation trouve une suggestion", () => {
    const suggestions = generateSpiritualSuggestions({
      hour: 20,
      preferences: basePreferences,
    });
    const match = findSuggestionForTakeTimeOption("relaxation", suggestions);
    expect(match).toBeDefined();
  });

  it("Q. Spotify URL calme disponible par défaut", () => {
    const url = resolveSpiritualSpotifyUrl(null);
    expect(url).toMatch(/^https:\/\/open\.spotify\.com\//);
  });

  it("R. autre relaxation différente", () => {
    const first = pickAnotherRelaxationGuide(
      { recentIds: [], faithImportance: "important" },
      "",
    ).next;
    const second = pickAnotherRelaxationGuide(
      { recentIds: [], faithImportance: "important" },
      first.id,
    );
    expect(second.isDifferent).toBe(true);
  });
});
