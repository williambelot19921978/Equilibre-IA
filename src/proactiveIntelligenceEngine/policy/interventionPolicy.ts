/**
 * EPIC 6B — Intervention Policy.
 * Jamais pendant réunion, sommeil, focus, sport, appel, conduite.
 */

import type { CalendarEventInput, SensitivePeriodKind } from "../types/proactiveTypes";

const MEETING_PATTERN = /réunion|meeting|sprint|standup|call|appel|visio|zoom|teams/i;
const SLEEP_PATTERN = /sommeil|sleep|repos|nuit|sieste/i;
const FOCUS_PATTERN = /focus|concentration|deep work|travail profond|étude|révision/i;
const SPORT_PATTERN = /sport|muscu|fit|course|entraînement|gym/i;
const CALL_PATTERN = /appel|call|téléphone|phone/i;
const DRIVING_PATTERN = /conduite|trajet|route|déplacement.*voiture|drive/i;
const FAMILY_PATTERN = /famille|enfant|dîner|repas familial/i;

function detectPeriod(
  event: CalendarEventInput,
  nowMs: number,
): SensitivePeriodKind | null {
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  if (nowMs < start || nowMs > end) return null;

  const title = event.title;
  const category = event.category ?? "";

  if (SLEEP_PATTERN.test(title) || category === "repos") return "sleep";
  if (MEETING_PATTERN.test(title) || category === "travail") return "meeting";
  if (FOCUS_PATTERN.test(title) || category === "etudes") return "focus";
  if (SPORT_PATTERN.test(title) || category === "sport") return "sport";
  if (CALL_PATTERN.test(title)) return "call";
  if (DRIVING_PATTERN.test(title) || category === "deplacement") return "driving";
  if (FAMILY_PATTERN.test(title) || category === "famille") return "family";

  return null;
}

export function detectSensitivePeriod(input: {
  readonly calendarEvents: readonly CalendarEventInput[];
  readonly now: string;
  readonly onVacation?: boolean;
}): { readonly kind: SensitivePeriodKind; readonly event: CalendarEventInput } | null {
  if (input.onVacation) {
    return { kind: "vacation", event: { id: "vacation", title: "Vacances", start: input.now, end: input.now } };
  }

  const nowMs = new Date(input.now).getTime();

  for (const event of input.calendarEvents) {
    const kind = detectPeriod(event, nowMs);
    if (kind) return { kind, event };
  }

  return null;
}

export function shouldBlockIntervention(kind: SensitivePeriodKind): boolean {
  return ["meeting", "sleep", "focus", "sport", "call", "driving", "family", "vacation", "deep_work"].includes(kind);
}

export function interventionEndTime(event: CalendarEventInput): string {
  return event.end;
}

export const PERIOD_LABELS: Record<SensitivePeriodKind, string> = {
  meeting: "réunion",
  sleep: "sommeil",
  focus: "focus",
  sport: "sport",
  call: "appel",
  driving: "conduite",
  family: "temps famille",
  vacation: "vacances",
  deep_work: "travail profond",
};
