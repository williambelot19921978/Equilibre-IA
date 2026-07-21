/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from "vitest";

import { toAnonymousId } from "./anonymize";
import {
  clearInsightEvents,
  clearInsightEventsForUser,
  listInsightEvents,
  trackInsightEvent,
} from "./eventStore";
import { setPrivacyPreference } from "../trustCenter/privacyPreferencesStore";

describe("eventStore user scoping", () => {
  beforeEach(() => {
    localStorage.clear();
    clearInsightEvents();
    setPrivacyPreference("user-a", "shareAnalytics", true);
    setPrivacyPreference("user-b", "shareAnalytics", true);
  });

  it("purges only the signed-out user analytics partition", () => {
    trackInsightEvent("user-a", "coach_opened", {});
    trackInsightEvent("user-b", "coach_opened", {});

    expect(listInsightEvents()).toHaveLength(2);

    clearInsightEventsForUser("user-a");

    const remaining = listInsightEvents();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.anonymousId).toBe(toAnonymousId("user-b"));
  });
});
