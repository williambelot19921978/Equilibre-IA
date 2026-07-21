/**
 * EPIC 7B — LogEngine (in-memory, no external service).
 */

import type { LogEntry } from "../types/mobileTypes";

export class LogEngine {
  private entries: LogEntry[] = [];
  private readonly maxEntries = 500;

  log(level: LogEntry["level"], message: string, context?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context,
      at: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }
    return entry;
  }

  debug(message: string, context?: Record<string, unknown>): LogEntry {
    return this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): LogEntry {
    return this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): LogEntry {
    return this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): LogEntry {
    return this.log("error", message, context);
  }

  getEntries(level?: LogEntry["level"]): readonly LogEntry[] {
    return level ? this.entries.filter((entry) => entry.level === level) : this.entries;
  }

  clear(): void {
    this.entries = [];
  }
}

export const defaultLogEngine = new LogEngine();
