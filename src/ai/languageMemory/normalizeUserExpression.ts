const TRAILING_PUNCTUATION = /[.!?…]+$/u;
const MULTI_SPACE = /\s+/g;

const TEMPORAL_SUFFIXES = [
  /\s+aujourd'?hui$/u,
  /\s+ce matin$/u,
  /\s+ce soir$/u,
  /\s+cet aprem$/u,
  /\s+cet après-midi$/u,
  /\s+la$/u,
  /\s+maintenant$/u,
  /\s+en ce moment$/u,
];

export type NormalizedExpressionParts = {
  normalized: string;
  core: string;
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeUserExpression(raw: string): string {
  const lowered = stripAccents(raw.trim().toLowerCase());
  const withoutPunctuation = lowered.replace(TRAILING_PUNCTUATION, "").trim();
  return withoutPunctuation.replace(MULTI_SPACE, " ");
}

export function extractExpressionCore(normalized: string): string {
  let core = normalized;
  for (const pattern of TEMPORAL_SUFFIXES) {
    core = core.replace(pattern, "").trim();
  }
  return core.replace(MULTI_SPACE, " ");
}

export function normalizeExpressionParts(raw: string): NormalizedExpressionParts {
  const normalized = normalizeUserExpression(raw);
  const core = extractExpressionCore(normalized);
  return { normalized, core };
}

export function expressionsMatch(stored: string, incoming: NormalizedExpressionParts): boolean {
  if (stored === incoming.normalized || stored === incoming.core) {
    return true;
  }
  return incoming.normalized.startsWith(`${stored} `) || incoming.core.startsWith(`${stored} `);
}
