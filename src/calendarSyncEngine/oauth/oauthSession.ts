/**
 * EPIC 5B — OAuth session helpers (wraps google_calendar_connections).
 */

import type { GoogleCalendarConnectionRecord } from "../../types/googleCalendar";
import type { OAuthSessionInfo, OAuthSessionState } from "../types/syncTypes";

export function mapConnectionToOAuthSession(
  connection: GoogleCalendarConnectionRecord | null,
): OAuthSessionInfo {
  if (!connection) {
    return {
      provider: "google",
      state: "disconnected",
      scopes: [],
    };
  }

  let state: OAuthSessionState = "disconnected";
  if (connection.status === "connected") {
    state = isOAuthSessionExpired(connection.last_synced_at) ? "expired" : "connected";
  }
  if (connection.status === "error") state = "error";

  return {
    provider: "google",
    state,
    accountEmail: connection.google_account_email,
    lastSyncedAt: connection.last_synced_at,
    scopes: connection.scopes,
  };
}

export function isOAuthSessionExpired(lastSyncedAt: string | null, maxAgeMs = 7 * 24 * 60 * 60 * 1000): boolean {
  if (!lastSyncedAt) return false;
  return Date.now() - new Date(lastSyncedAt).getTime() > maxAgeMs;
}

export function describeOAuthState(session: OAuthSessionInfo): string {
  switch (session.state) {
    case "connected":
      return "Connecté";
    case "expired":
      return "Token expiré — reconnexion requise";
    case "revoked":
      return "Accès révoqué";
    case "error":
      return "Erreur de connexion";
    default:
      return "Non connecté";
  }
}
