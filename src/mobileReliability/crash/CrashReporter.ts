/**
 * EPIC 7B — CrashReporter (architecture only — no external service).
 */

import type { CrashReport } from "../types/mobileTypes";
import { defaultLogEngine } from "./LogEngine";

type CrashListener = (report: CrashReport) => void;

export class CrashReporter {
  private listeners = new Set<CrashListener>();
  private reports: CrashReport[] = [];

  capture(error: unknown, context?: Record<string, unknown>): CrashReport {
    const report: CrashReport = {
      id: `crash-${Date.now()}`,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      at: new Date().toISOString(),
    };

    this.reports.unshift(report);
    defaultLogEngine.error(report.message, { stack: report.stack, ...context });
    for (const listener of this.listeners) {
      listener(report);
    }
    return report;
  }

  getReports(): readonly CrashReport[] {
    return this.reports;
  }

  subscribe(listener: CrashListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  installGlobalHandlers(): () => void {
    if (typeof window === "undefined") return () => undefined;

    const onError = (event: ErrorEvent) => {
      this.capture(event.error ?? event.message, { source: "window.onerror" });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      this.capture(event.reason, { source: "unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }
}

export const defaultCrashReporter = new CrashReporter();
