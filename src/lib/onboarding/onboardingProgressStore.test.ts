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

describe("onboardingProgressStore", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("persiste les étapes UX onboarding", async () => {
    const { getOnboardingUxProgress, patchOnboardingUxProgress, resetOnboardingUxProgress } =
      await import("./onboardingProgressStore");

    resetOnboardingUxProgress("user-onboarding-test");
    patchOnboardingUxProgress("user-onboarding-test", { welcomeSeen: true, introSeen: true });
    const progress = getOnboardingUxProgress("user-onboarding-test");
    expect(progress.welcomeSeen).toBe(true);
    expect(progress.introSeen).toBe(true);
    expect(progress.checkinChoiceDone).toBe(false);
  });
});
