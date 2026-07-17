const FRENCH_HOUR_WORDS: Record<string, number> = {
  une: 1,
  un: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  midi: 12,
  minuit: 0,
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toTime(hours: number, minutes = 0): string {
  return `${pad(hours)}:${pad(minutes)}`;
}

function parseFlexibleTimeToken(raw: string): string | null {
  const token = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");

  if (!token) return null;
  if (token === "midi") return "12:00";
  if (token === "minuit") return "00:00";

  const numeric = token.match(/^(\d{1,2})\s*h(?:\s*(\d{2}))?$/);
  if (numeric) {
    return toTime(
      Number.parseInt(numeric[1], 10),
      numeric[2] ? Number.parseInt(numeric[2], 10) : 0,
    );
  }

  const wordHour = token.match(
    /^(une|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize)\s+heure(?:s)?$/,
  );
  if (wordHour && wordHour[1] in FRENCH_HOUR_WORDS) {
    return toTime(FRENCH_HOUR_WORDS[wordHour[1]]);
  }

  if (token in FRENCH_HOUR_WORDS) {
    return toTime(FRENCH_HOUR_WORDS[token]);
  }

  return null;
}

export function parseClarificationTimeResponse(text: string): {
  startTime?: string;
  endTime?: string;
  times: string[];
} {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  const times: string[] = [];
  let startTime: string | undefined;
  let endTime: string | undefined;

  const deRange = normalized.match(
    /de\s+(.+?)\s+(?:a|à)\s+(.+)/,
  );
  if (deRange) {
    startTime = parseFlexibleTimeToken(deRange[1]) ?? undefined;
    endTime = parseFlexibleTimeToken(deRange[2]) ?? undefined;
  }

  if (!startTime || !endTime) {
    const dashRange = normalized.match(
      /(\d{1,2}\s*h(?:\s*\d{2})?)\s*(?:-|–|\/)\s*(\d{1,2}\s*h(?:\s*\d{2})?|midi)/,
    );
    if (dashRange) {
      startTime = startTime ?? parseFlexibleTimeToken(dashRange[1]) ?? undefined;
      endTime = endTime ?? parseFlexibleTimeToken(dashRange[2]) ?? undefined;
    }
  }

  if (!startTime || !endTime) {
    const looseRange = normalized.match(
      /(\d{1,2}\s*h(?:\s*\d{2})?)\s+(?:a|à)\s+(\d{1,2}\s*h(?:\s*\d{2})?|midi)/,
    );
    if (looseRange) {
      startTime = startTime ?? parseFlexibleTimeToken(looseRange[1]) ?? undefined;
      endTime = endTime ?? parseFlexibleTimeToken(looseRange[2]) ?? undefined;
    }
  }

  if (!endTime) {
    const until = normalized.match(
      /(?:jusqu['']?\s*(?:a|à)|finis\s+(?:a|à)|termine\s+(?:a|à))\s+(.+)/,
    );
    if (until) {
      endTime = parseFlexibleTimeToken(until[1]) ?? undefined;
    }
  }

  for (const match of normalized.matchAll(/\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b/g)) {
    const parsed = toTime(
      Number.parseInt(match[1], 10),
      match[2] ? Number.parseInt(match[2], 10) : 0,
    );
    times.push(parsed);
  }

  if (/\bmidi\b/.test(normalized)) times.push("12:00");

  const uniqueTimes = [...new Set(times)];
  if (startTime) uniqueTimes.unshift(startTime);
  if (endTime) uniqueTimes.push(endTime);

  const mergedTimes = [...new Set(uniqueTimes)];
  if (!startTime && mergedTimes.length >= 1) startTime = mergedTimes[0];
  if (!endTime && mergedTimes.length >= 2) endTime = mergedTimes[1];

  return {
    startTime,
    endTime,
    times: mergedTimes,
  };
}
