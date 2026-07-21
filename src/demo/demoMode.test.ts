import { beforeEach, describe, expect, it, vi } from "vitest";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("demoMode", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("active uniquement après activation explicite", async () => {
    const { disableDemoMode, enableDemoMode, isDemoModeActive } = await import("./demoMode");

    expect(isDemoModeActive()).toBe(false);
    enableDemoMode();
    expect(isDemoModeActive()).toBe(true);
    disableDemoMode();
    expect(isDemoModeActive()).toBe(false);
  });

  it("fournit un snapshot démo complet", async () => {
    const { buildDemoSnapshot } = await import("./demoMode");
    const snapshot = buildDemoSnapshot();
    expect(snapshot.coachTip.length).toBeGreaterThan(10);
    expect(snapshot.nextAction).toContain("—");
  });
});
