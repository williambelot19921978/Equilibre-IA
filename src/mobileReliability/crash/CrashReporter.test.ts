import { describe, expect, it } from "vitest";

import { defaultCrashReporter } from "./CrashReporter";
import { defaultAnalyticsBridge } from "./AnalyticsBridge";

describe("CrashReporter", () => {
  it("capture une erreur", () => {
    const report = defaultCrashReporter.capture(new Error("test crash"), { page: "/home" });
    expect(report.message).toBe("test crash");
    defaultAnalyticsBridge.configure({ enabled: true });
    defaultAnalyticsBridge.forwardCrash(report);
    expect(defaultAnalyticsBridge.getEvents()[0]?.name).toBe("crash_reported");
  });
});
