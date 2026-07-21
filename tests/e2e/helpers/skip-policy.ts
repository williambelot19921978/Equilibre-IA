/**
 * QA-2 — Strict skip policy for Quality Guardian.
 * CRITICAL scenarios must never be silently skipped.
 */

export type SkipCategory = "CRITICAL" | "OPTIONAL" | "EXPERIMENTAL";

export const CRITICAL_SCENARIO_IDS = [
  "auth",
  "onboarding",
  "planning",
  "goals",
  "daily-brief",
  "household",
  "collaboration",
  "rls",
  "user-switch",
] as const;

export type CriticalScenarioId = (typeof CRITICAL_SCENARIO_IDS)[number];

export class GuardianCriticalSkipError extends Error {
  readonly category: SkipCategory = "CRITICAL";

  constructor(message: string) {
    super(`CRITICAL_SKIP: ${message}`);
    this.name = "GuardianCriticalSkipError";
  }
}

export function assertCriticalPrecondition(
  condition: boolean,
  reason: string,
): asserts condition {
  if (!condition) {
    throw new GuardianCriticalSkipError(reason);
  }
}

export function skipOptional(_condition: boolean, _reason: string): void {
  // Use test.skip in spec files for OPTIONAL scenarios only.
}

export function isCriticalSkipError(error: unknown): boolean {
  return (
    error instanceof GuardianCriticalSkipError ||
    (error instanceof Error && error.message.startsWith("CRITICAL_SKIP:"))
  );
}

export function mapTestFileToScenarioId(filePath: string): CriticalScenarioId | null {
  const normalized = filePath.replace(/\\/g, "/");

  if (normalized.includes("/auth/")) return "auth";
  if (normalized.includes("/onboarding/")) return "onboarding";
  if (normalized.includes("/planning/")) return "planning";
  if (normalized.includes("/goals/")) return "goals";
  if (normalized.includes("/dailyBrief/")) return "daily-brief";
  if (normalized.includes("/household/")) return "household";
  if (normalized.includes("/collaboration/")) return "collaboration";
  if (normalized.includes("/rls/")) return "rls";
  if (normalized.includes("/zz-session/")) return "user-switch";

  return null;
}

export function isCriticalTestFile(filePath: string): boolean {
  return mapTestFileToScenarioId(filePath) !== null;
}
