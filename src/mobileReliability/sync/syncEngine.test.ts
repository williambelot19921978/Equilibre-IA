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

describe("offlineMutationQueue", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("enqueue et liste les mutations en attente", async () => {
    const { enqueueOfflineMutation, listPendingMutations } = await import(
      "../offline/offlineMutationQueue"
    );

    enqueueOfflineMutation({
      userId: "user-1",
      kind: "task_create",
      payload: { title: "Test" },
    });

    expect(listPendingMutations("user-1")).toHaveLength(1);
  });
});
