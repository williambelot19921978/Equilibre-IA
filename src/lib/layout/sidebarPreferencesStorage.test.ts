/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  clearSidebarCollapsedFromStorage,
  readSidebarCollapsedFromStorage,
  writeSidebarCollapsedToStorage,
} from "./sidebarPreferencesStorage";

const USER_ID = "test-user-id";

describe("sidebarPreferencesStorage", () => {
  beforeEach(() => {
    clearSidebarCollapsedFromStorage(USER_ID);
  });

  afterEach(() => {
    clearSidebarCollapsedFromStorage(USER_ID);
  });

  it("persiste collapsed=true puis le relit", () => {
    expect(readSidebarCollapsedFromStorage(USER_ID)).toBeNull();
    writeSidebarCollapsedToStorage(USER_ID, true);
    expect(readSidebarCollapsedFromStorage(USER_ID)).toBe(true);
  });

  it("persiste collapsed=false puis le relit", () => {
    writeSidebarCollapsedToStorage(USER_ID, false);
    expect(readSidebarCollapsedFromStorage(USER_ID)).toBe(false);
  });
});
