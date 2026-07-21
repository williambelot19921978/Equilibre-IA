/**
 * EPIC 8A — Security status (session display).
 */

import { supabase } from "../lib/supabase/client";
import { secureSignOut } from "../mobileReliability/security/sessionSecurity";
import type { SecuritySnapshot } from "./types";

function resolveDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Appareil inconnu";
  const platform = navigator.platform || "Navigateur";
  const mobile = /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Ordinateur";
  return `${mobile} — ${platform}`;
}

export async function buildSecuritySnapshot(user: {
  id: string;
  email?: string | null;
  last_sign_in_at?: string;
} | null): Promise<SecuritySnapshot> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  return {
    email: user?.email ?? null,
    lastSignInAt: user?.last_sign_in_at ?? session?.user?.last_sign_in_at ?? null,
    sessionExpiresAt: session?.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
    currentDeviceLabel: resolveDeviceLabel(),
    isSessionFresh: session ? session.expires_at! * 1000 > Date.now() : false,
  };
}

export async function signOutAllDevices(userId?: string): Promise<void> {
  await supabase.auth.signOut({ scope: "global" });
  await secureSignOut(userId);
}

export async function signOutCurrentDevice(userId?: string): Promise<void> {
  await secureSignOut(userId);
}
