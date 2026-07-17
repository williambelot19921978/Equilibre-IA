import { addDaysToDate } from "../../lib/time/deviceClock";
import { getWeekdayKey } from "../../lib/time/daySchedule";
import type { NlpEntity, NlpScope } from "../../types/nlp";
import { normalizeNlpTextAdvanced } from "./textNormalizer";

export function normalizeNlpText(text: string): string {
  return normalizeNlpTextAdvanced(text);
}

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

const WEEKDAY_MAP: Record<string, string> = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
  dimanche: "sunday",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseDurationMinutes(text: string): number | undefined {
  if (/(?:une|1)\s*heure(?:s)?\s+et\s+demi(?:e)?/.test(text)) {
    return 90;
  }

  const hourMatch = text.match(
    /(?:une|1)\s*heure(?:s)?(?:\s*(?:et\s*)?(\d+)\s*min(?:ute)?s?)?/,
  );
  if (hourMatch) {
    const extra = hourMatch[1] ? Number.parseInt(hourMatch[1], 10) : 0;
    return 60 + extra;
  }

  const halfHour = text.match(/(?:demi[- ]?heure|30\s*min)/);
  if (halfHour) return 30;

  const minuteMatch = text.match(/(\d+)\s*min(?:ute)?s?/);
  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10);
  }

  return undefined;
}

function parseTime(text: string): string[] {
  const times: string[] = [];
  const patterns = [
    /(?:a|à)\s*(\d{1,2})h(?:(\d{2}))?/g,
    /(?:a|à)\s*(\d{1,2})\s*h(?:\s*(\d{2}))?/g,
    /\b(\d{1,2})h(?:(\d{2}))?\b/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const hours = pad(Number.parseInt(match[1], 10));
      const minutes = pad(match[2] ? Number.parseInt(match[2], 10) : 0);
      times.push(`${hours}:${minutes}`);
    }
  }

  return [...new Set(times)];
}

function parseWorkTimeRange(text: string): { start?: string; end?: string } {
  const timeToken = String.raw`(\d{1,2})(?:h(?:(\d{2}))?|\s+heure(?:s)?)`;
  const rangeMatch = text.match(
    new RegExp(String.raw`de\s+${timeToken}\s+(?:a|à)\s+${timeToken}`),
  );
  if (rangeMatch) {
    const startH = pad(Number.parseInt(rangeMatch[1], 10));
    const startM = pad(rangeMatch[2] ? Number.parseInt(rangeMatch[2], 10) : 0);
    const endH = pad(Number.parseInt(rangeMatch[3], 10));
    const endM = pad(rangeMatch[4] ? Number.parseInt(rangeMatch[4], 10) : 0);
    return { start: `${startH}:${startM}`, end: `${endH}:${endM}` };
  }

  const looseRange = text.match(
    /(\d{1,2})\s*h(?:\s*(\d{2}))?\s*(?:-|–|\/)\s*(\d{1,2})\s*h(?:\s*(\d{2}))?/,
  );
  if (looseRange) {
    const startH = pad(Number.parseInt(looseRange[1], 10));
    const startM = pad(looseRange[2] ? Number.parseInt(looseRange[2], 10) : 0);
    const endH = pad(Number.parseInt(looseRange[3], 10));
    const endM = pad(looseRange[4] ? Number.parseInt(looseRange[4], 10) : 0);
    return { start: `${startH}:${startM}`, end: `${endH}:${endM}` };
  }

  const toMidi = text.match(
    /(\d{1,2})\s*h(?:\s*(\d{2}))?\s+(?:a|à)\s+midi/,
  );
  if (toMidi) {
    const startH = pad(Number.parseInt(toMidi[1], 10));
    const startM = pad(toMidi[2] ? Number.parseInt(toMidi[2], 10) : 0);
    return { start: `${startH}:${startM}`, end: "12:00" };
  }

  const wordRange = text.match(
    /de\s+(huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize)\s+heures?\s+(?:a|à)\s+midi/,
  );
  if (wordRange) {
    const hourMap: Record<string, number> = {
      huit: 8,
      neuf: 9,
      dix: 10,
      onze: 11,
      douze: 12,
      treize: 13,
      quatorze: 14,
      quinze: 15,
      seize: 16,
    };
    const hour = hourMap[wordRange[1]];
    if (hour !== undefined) {
      return { start: `${pad(hour)}:00`, end: "12:00" };
    }
  }

  return {};
}

function resolveWeekdayDate(
  weekday: string,
  referenceDate: string,
): string {
  const target = WEEKDAY_MAP[weekday];
  if (!target) return referenceDate;

  for (let delta = 0; delta <= 7; delta += 1) {
    const candidate = addDaysToDate(referenceDate, delta);
    if (getWeekdayKey(candidate) === target) {
      return candidate;
    }
  }

  return referenceDate;
}

function parseDates(text: string, referenceDate: string): {
  dates: string[];
  dateRange?: { start: string; end: string };
} {
  const refYear = Number.parseInt(referenceDate.slice(0, 4), 10);
  const dates: string[] = [];

  const rangeMatch = text.match(
    /du\s+(\d{1,2})\s+au\s+(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)/,
  );

  if (rangeMatch) {
    const monthKey = rangeMatch[3].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const month = FRENCH_MONTHS[monthKey] ?? FRENCH_MONTHS[rangeMatch[3]];
    let year = refYear;
    const refMonth = Number.parseInt(referenceDate.slice(5, 7), 10);
    if (month < refMonth) {
      year += 1;
    }
    const start = toDateString(year, month, Number.parseInt(rangeMatch[1], 10));
    const end = toDateString(year, month, Number.parseInt(rangeMatch[2], 10));
    return { dates: [start, end], dateRange: { start, end } };
  }

  if (/\bsemaine prochaine\b/.test(text)) {
    for (let delta = 7; delta < 14; delta += 1) {
      dates.push(addDaysToDate(referenceDate, delta));
    }
  }

  if (/\bdemain matin\b/.test(text)) {
    dates.push(addDaysToDate(referenceDate, 1));
  }

  if (/\bdemain\b/.test(text)) {
    dates.push(addDaysToDate(referenceDate, 1));
  }

  if (/\bapres-demain\b/.test(text)) {
    dates.push(addDaysToDate(referenceDate, 2));
  }

  if (/\baujourd'hui\b/.test(text) || /\baujourdhui\b/.test(text)) {
    dates.push(referenceDate);
  }

  if (/\bce soir\b/.test(text)) {
    dates.push(referenceDate);
  }

  if (/\bce week-end\b|\bce weekend\b/.test(text)) {
    for (let delta = 0; delta <= 6; delta += 1) {
      const candidate = addDaysToDate(referenceDate, delta);
      const key = getWeekdayKey(candidate);
      if (key === "saturday" || key === "sunday") {
        dates.push(candidate);
      }
    }
  }

  if (/\bcette semaine\b/.test(text)) {
    for (let delta = 0; delta < 7; delta += 1) {
      dates.push(addDaysToDate(referenceDate, delta));
    }
  }

  for (const label of Object.keys(WEEKDAY_MAP)) {
    if (new RegExp(`\\b${label}s?\\b`).test(text)) {
      dates.push(resolveWeekdayDate(label, referenceDate));
    }
  }

  const unique = [...new Set(dates)];
  return { dates: unique.length > 0 ? unique : [referenceDate] };
}

function detectScope(text: string): NlpScope {
  if (
    /\btous les\b/.test(text) ||
    /\bchaque\b/.test(text) ||
    /\bhabituellement\b/.test(text) ||
    /\bhabituel\b/.test(text) ||
    /\brythme\b/.test(text)
  ) {
    return "recurring";
  }

  if (/\bdu\s+\d{1,2}\s+au\s+\d{1,2}\b/.test(text)) {
    return "period";
  }

  return "punctual";
}

function extractWeekdays(text: string): string[] {
  const weekdays: string[] = [];

  for (const [label, key] of Object.entries(WEEKDAY_MAP)) {
    const plural = `${label}s`;
    if (new RegExp(`\\b${label}s?\\b`).test(text) || new RegExp(`\\b${plural}\\b`).test(text)) {
      weekdays.push(key);
    }
  }

  return weekdays;
}

function extractChildName(text: string, knownChildren: string[]): string | undefined {
  for (const name of knownChildren) {
    const normalized = normalizeNlpText(name);
    if (text.includes(normalized)) {
      return name;
    }
  }

  const match = text.match(
    /\b(peter|pierre|emma|lucas|lina|leo|chloe|nathan|sarah|julie|thomas|marie)\b/,
  );
  return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : undefined;
}

function extractLocation(text: string): string | undefined {
  const match = text.match(/chez\s+([a-zàâäéèêëïîôùûüç\s-]+)/);
  return match ? match[1].trim() : undefined;
}

function detectWorkExceptionKind(
  text: string,
): import("../../types/nlp").NlpEntity["workExceptionKind"] {
  const normalized = text.toLowerCase();
  const hasMorning = /\b(matin|matinee|matinée)\b/.test(normalized);
  const hasAfternoon = /\b(apres-midi|après-midi|aprem)\b/.test(normalized);
  const noWork =
    (/\b(ne travaille pas|pas de travail)\b/.test(normalized) ||
      /\bfinalement\b.*\b(ne travaille pas|pas de travail)\b/.test(normalized)) &&
    !/\bje travaille\b/.test(normalized);
  const onlyWork =
    /\b(seulement|uniquement)\b/.test(normalized) &&
    /\btravail/.test(normalized);
  const worksAtPeriod =
    /\bje travaille\b/.test(normalized) && !noWork;

  if (worksAtPeriod && hasMorning && !hasAfternoon) {
    return "work_morning_only";
  }

  if (worksAtPeriod && hasAfternoon && !hasMorning) {
    return "work_afternoon_only";
  }

  if (onlyWork && hasMorning && !hasAfternoon) {
    return "work_morning_only";
  }

  if (onlyWork && hasAfternoon && !hasMorning) {
    return "work_afternoon_only";
  }

  if (noWork && hasMorning && !hasAfternoon) {
    return "half_morning";
  }

  if (noWork && hasAfternoon && !hasMorning) {
    return "half_afternoon";
  }

  if (
    /\b(j'ai mon apres-midi|j'ai mon après-midi|mon apres-midi|mon après-midi)\b/.test(
      normalized,
    )
  ) {
    return "half_afternoon";
  }

  if (
    /\b(j'ai ma matinee|j'ai ma matinée|ma matinee|ma matinée)\b/.test(normalized)
  ) {
    return "half_morning";
  }

  if (noWork) {
    return "cancel";
  }

  if (
    /\b(commence|debut|début)\b/.test(normalized) &&
    !/\bde\s+\d/.test(normalized)
  ) {
    return "start_override";
  }

  if (/\b(termine|fini|finis)\b.*\b(midi|12)\b/.test(normalized)) {
    return "end_override";
  }

  if (/\b(seulement|uniquement)\s+de\b/.test(normalized)) {
    return "time_override";
  }

  return undefined;
}

export function extractEntities({
  text,
  referenceDate,
  childNames = [],
}: {
  text: string;
  referenceDate: string;
  childNames?: string[];
}): NlpEntity {
  const normalized = normalizeNlpText(text);
  const { dates, dateRange } = parseDates(normalized, referenceDate);
  const scope = detectScope(normalized);
  const weekdays = extractWeekdays(normalized);
  const durationMinutes = parseDurationMinutes(normalized);
  const times = parseTime(normalized);
  const workTimeRange = parseWorkTimeRange(normalized);
  if (workTimeRange.start) times.unshift(workTimeRange.start);
  if (workTimeRange.end) times.push(workTimeRange.end);

  let durationDeltaMinutes: number | undefined;
  if (/une heure plus tard|1 heure plus tard|finis.*plus tard|finir.*plus tard/.test(normalized)) {
    durationDeltaMinutes = 60;
  } else if (/demi[- ]?heure plus tard/.test(normalized)) {
    durationDeltaMinutes = 30;
  }

  const activity = /\brendez[- ]?vous\b|\brdv\b/.test(normalized)
    ? "appointment"
    : /\brevision\b|\breviser\b/.test(normalized)
      ? "study"
      : undefined;

  return {
    dates,
    dateRange,
    times: [...new Set(times)],
    durationMinutes,
    durationDeltaMinutes,
    workTimeStart: workTimeRange.start,
    workTimeEnd: workTimeRange.end,
    workExceptionKind: detectWorkExceptionKind(normalized),
    weekday: weekdays[0],
    weekdays,
    person: /\bwilliam\b/.test(normalized)
      ? "William"
      : /\bmadeline\b/.test(normalized)
        ? "Madeline"
        : undefined,
    childName: extractChildName(normalized, childNames),
    location: extractLocation(normalized),
    activity,
    scope,
    recurring: scope === "recurring",
  };
}
