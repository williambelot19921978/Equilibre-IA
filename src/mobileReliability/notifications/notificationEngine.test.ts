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

describe("notificationEngine", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("respecte le niveau none", async () => {
    const { defaultNotificationEngine } = await import("./notificationEngine");
    const { setNotificationLevel } = await import("./notificationPreferencesStore");

    setNotificationLevel("user-1", "none");
    const result = defaultNotificationEngine.deliver({
      userId: "user-1",
      proactiveNotification: {
        channel: "in_app",
        message: "Conseil coach",
        suggestionId: "s-1",
        at: new Date().toISOString(),
        architectureOnly: true,
      },
    });

    expect(result).toBeNull();
  });

  it("livre une notification quand les règles passent", async () => {
    const { defaultNotificationEngine } = await import("./notificationEngine");
    const { setNotificationLevel } = await import("./notificationPreferencesStore");

    setNotificationLevel("user-1", "all");
    const result = defaultNotificationEngine.deliver({
      userId: "user-1",
      proactiveNotification: {
        channel: "in_app",
        message: "Conseil coach du matin",
        suggestionId: "s-2",
        at: new Date().toISOString(),
        architectureOnly: true,
      },
    });

    expect(result?.body).toContain("coach");
    expect(defaultNotificationEngine.getUnreadCount("user-1")).toBe(1);
  });
});
