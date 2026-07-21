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

describe("dailyCheckinPreference", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("désactive le check-in sur demande utilisateur", async () => {
    const {
      getDailyCheckinPreference,
      isDailyCheckinEnabledForUser,
      setDailyCheckinPreference,
    } = await import("./dailyCheckinPreference");

    setDailyCheckinPreference("user-checkin-pref", { enabled: true });
    expect(isDailyCheckinEnabledForUser("user-checkin-pref")).toBe(true);
    setDailyCheckinPreference("user-checkin-pref", { enabled: false });
    expect(getDailyCheckinPreference("user-checkin-pref").enabled).toBe(false);
  });
});
