/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearUserScopedStorage,
  USER_SCOPED_STORAGE_PREFIXES,
} from "./userScopedStorage";

describe("userScopedStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears registered user prefixes", () => {
    localStorage.setItem("equilibre-assistant-conversation:user-1", "[]");
    localStorage.setItem("epic2-goals:user-1", "[]");
    localStorage.setItem("unrelated-key", "keep");

    clearUserScopedStorage("user-1");

    expect(localStorage.getItem("equilibre-assistant-conversation:user-1")).toBeNull();
    expect(localStorage.getItem("epic2-goals:user-1")).toBeNull();
    expect(localStorage.getItem("unrelated-key")).toBe("keep");
  });

  it("documents critical prefixes", () => {
    expect(USER_SCOPED_STORAGE_PREFIXES).toContain("equilibre-assistant-conversation:");
    expect(USER_SCOPED_STORAGE_PREFIXES).toContain("epic2-goals:");
  });
});
