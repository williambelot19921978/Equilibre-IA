/**
 * EPIC 7B — AnalyticsBridge (architecture stub — no external SDK).
 */

import type { CrashReport, LogEntry } from "../types/mobileTypes";
import { defaultLogEngine } from "./LogEngine";

export type AnalyticsEvent = {
  readonly name: string;
  readonly properties?: Record<string, unknown>;
  readonly at: string;
};

export class AnalyticsBridge {
  private events: AnalyticsEvent[] = [];
  private enabled = false;

  configure(options: { enabled?: boolean }): void {
    this.enabled = options.enabled ?? false;
  }

  track(name: string, properties?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      at: new Date().toISOString(),
    };
    this.events.unshift(event);
    if (this.enabled) {
      defaultLogEngine.info(`analytics:${name}`, properties);
    }
  }

  forwardCrash(report: CrashReport): void {
    if (!this.enabled) return;
    this.track("crash_reported", {
      id: report.id,
      message: report.message,
    });
  }

  forwardLog(entry: LogEntry): void {
    if (!this.enabled || entry.level === "debug") return;
    this.track("log_forwarded", {
      level: entry.level,
      message: entry.message,
    });
  }

  getEvents(): readonly AnalyticsEvent[] {
    return this.events;
  }
}

export const defaultAnalyticsBridge = new AnalyticsBridge();
