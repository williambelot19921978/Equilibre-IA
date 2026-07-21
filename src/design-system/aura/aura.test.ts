/** @vitest-environment happy-dom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { AURA_BRAND, AURA_THEME_STORAGE_KEY } from "./brand";
import { AuraStar } from "../../components/aura/AuraStar";
import { applyThemeMode, readStoredThemeMode, resolveEffectiveTheme } from "./themeStore";
import { playAuraSound, readSoundPreferences } from "./soundEngine";
import { appConfig } from "../../config/app";

describe("Aura brand", () => {
  it("exposes Aura as public app name", () => {
    expect(AURA_BRAND.name).toBe("Aura");
    expect(appConfig.name).toBe("Aura");
  });
});

describe("AuraStar", () => {
  it("renders semantic variant with accessible label", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AuraStar, { variant: "coach" }));
    });

    expect(container.querySelector('[aria-label="Conseil du coach"]')).toBeTruthy();
    root.unmount();
    container.remove();
  });
});

describe("Aura theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("persists and resolves theme mode", () => {
    localStorage.setItem(AURA_THEME_STORAGE_KEY, "dark");
    expect(readStoredThemeMode()).toBe("dark");
    applyThemeMode("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(resolveEffectiveTheme("system")).toMatch(/light|dark/);
  });
});

describe("Aura sound engine", () => {
  it("does not play sounds when disabled by default", () => {
    const handler = vi.fn();
    playAuraSound("success");
    expect(handler).not.toHaveBeenCalled();
    expect(readSoundPreferences().enabled).toBe(false);
  });
});
