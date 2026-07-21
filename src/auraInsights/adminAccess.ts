/**
 * EPIC 8B — Admin access control (Supabase app_metadata + env fallback).
 */

export function isAuraAdmin(
  email: string | null | undefined,
  appMetadata?: Record<string, unknown> | null,
): boolean {
  if (appMetadata?.aura_role === "admin" || appMetadata?.role === "admin") {
    return true;
  }

  if (!email) return false;
  const raw = import.meta.env.VITE_AURA_ADMIN_EMAILS ?? "";
  if (!raw.trim()) return false;
  const allowed = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function isAuraInsightsEnabled(): boolean {
  const raw = import.meta.env.VITE_AURA_INSIGHTS;
  if (raw === undefined || raw.trim() === "") return true;
  return raw === "true" || raw === "1";
}
