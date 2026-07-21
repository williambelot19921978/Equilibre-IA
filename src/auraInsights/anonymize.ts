/**
 * EPIC 8B — One-way anonymous cohort id (no reversible PII).
 */

const LOCAL_SALT_KEY = "aura-insights-salt";

function readInstallSalt(): string {
  if (typeof localStorage === "undefined") return "aura-static-salt";
  let salt = localStorage.getItem(LOCAL_SALT_KEY);
  if (!salt) {
    salt = `s_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem(LOCAL_SALT_KEY, salt);
  }
  return salt;
}

export function toAnonymousId(userId: string): string {
  const envSalt = typeof import.meta !== "undefined"
    ? import.meta.env.VITE_AURA_INSIGHTS_SALT ?? ""
    : "";
  const payload = `${envSalt}:${readInstallSalt()}:${userId}`;
  let hash = 5381;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash * 33) ^ payload.charCodeAt(index);
  }
  return `anon_${(hash >>> 0).toString(36)}`;
}

/** Strip any key that looks like PII or free text */
export function sanitizeMeta(
  meta: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
      continue;
    }
    if (typeof value === "string") {
      const allowedEnums = [
        "sport", "family", "wellbeing", "study", "goals", "general",
        "quick", "standard", "complete",
        "habits", "checkins", "goals", "auraMemory", "all",
        "json", "csv", "pdf",
        "coach", "planning", "checkin", "goals", "digest",
        "app_open", "navigation", "onboarding",
      ];
      if (allowedEnums.includes(value) || key === "mark" || key === "feature" || key === "scope" || key === "format" || key === "domain" || key === "mode" || key === "channel") {
        safe[key] = value;
      }
    }
  }
  return safe;
}
