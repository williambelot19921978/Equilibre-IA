import { describe, expect, it } from "vitest";

import {
  describeOAuthState,
  isOAuthSessionExpired,
  mapConnectionToOAuthSession,
} from "../oauth/oauthSession";
import { CONNECTION_CONNECTED } from "../testing/fixtures";

describe("EPIC5B OAuth session", () => {
  it("mapConnectionToOAuthSession — disconnected", () => {
    const session = mapConnectionToOAuthSession(null);
    expect(session.state).toBe("disconnected");
    expect(session.scopes).toEqual([]);
  });

  it("mapConnectionToOAuthSession — connected", () => {
    const session = mapConnectionToOAuthSession(CONNECTION_CONNECTED);
    expect(session.state).toBe("connected");
    expect(session.accountEmail).toBe("user@gmail.com");
    expect(session.lastSyncedAt).toBe(CONNECTION_CONNECTED.last_synced_at);
  });

  it("isOAuthSessionExpired détecte une sync trop ancienne", () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isOAuthSessionExpired(old, 7 * 24 * 60 * 60 * 1000)).toBe(true);
    expect(isOAuthSessionExpired(null)).toBe(false);
  });

  it("describeOAuthState retourne un libellé lisible", () => {
    expect(describeOAuthState({ provider: "google", state: "connected", scopes: [] })).toBe(
      "Connecté",
    );
    expect(describeOAuthState({ provider: "google", state: "disconnected", scopes: [] })).toBe(
      "Non connecté",
    );
  });
});
