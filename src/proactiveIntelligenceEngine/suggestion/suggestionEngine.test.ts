/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { generateSuggestions } from "./suggestionEngine";
import { clearSuggestions } from "./suggestionStore";
import { BUSY_DAY_INPUT, EMPTY_DAY_INPUT } from "../testing/fixtures";

const USER = "suggestion-test";

describe("SuggestionEngine", () => {
  beforeEach(() => {
    clearSuggestions(USER);
  });

  it("génère suggestions avec id, titre, confiance, priorité, expiration", () => {
    const suggestions = generateSuggestions({ ...BUSY_DAY_INPUT, userId: USER });

    expect(suggestions.length).toBeGreaterThan(0);
    for (const suggestion of suggestions) {
      expect(suggestion.id).toBeTruthy();
      expect(suggestion.title).toBeTruthy();
      expect(suggestion.confidence).toBeGreaterThan(0);
      expect(suggestion.priority).toBeGreaterThan(0);
      expect(suggestion.expiresAt).toBeTruthy();
      expect(suggestion.status).toBe("generated");
      expect(suggestion.explainability.why).toBeTruthy();
      expect(suggestion.explainability.whyNow).toBeTruthy();
    }
  });

  it("journée chargée — alerte conflit et organisation", () => {
    const suggestions = generateSuggestions({ ...BUSY_DAY_INPUT, userId: USER });
    expect(suggestions.some((suggestion) => suggestion.kind === "alert")).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.kind === "organization")).toBe(true);
  });

  it("journée vide — peu ou pas de suggestions urgentes", () => {
    const suggestions = generateSuggestions({ ...EMPTY_DAY_INPUT, userId: USER });
    const alerts = suggestions.filter((suggestion) => suggestion.kind === "alert");
    expect(alerts).toHaveLength(0);
  });

  it("peut préparer une action sans l'exécuter", () => {
    const suggestions = generateSuggestions({ ...BUSY_DAY_INPUT, userId: USER });
    const withAction = suggestions.filter((suggestion) => suggestion.preparedAction);
    expect(withAction.length).toBeGreaterThan(0);
    expect(withAction.every((suggestion) => suggestion.status === "generated")).toBe(true);
  });
});
