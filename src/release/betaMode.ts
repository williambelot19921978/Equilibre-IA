/**
 * EPIC 9 — Global beta mode (badge, channel display).
 */

import { getReleaseChannel, type ReleaseChannel } from "./version";

const BADGE_HIDDEN_KEY = "aura-beta-badge-hidden";

export function isBetaModeEnabled(): boolean {
  const env = import.meta.env.VITE_AURA_BETA_MODE;
  if (env === "false" || env === "0") return false;
  if (getReleaseChannel() === "stable") return false;
  return true;
}

export function isBetaBadgeVisible(): boolean {
  if (!isBetaModeEnabled()) return false;
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(BADGE_HIDDEN_KEY) !== "true";
}

export function setBetaBadgeVisible(visible: boolean): void {
  if (typeof localStorage === "undefined") return;
  if (visible) {
    localStorage.removeItem(BADGE_HIDDEN_KEY);
  } else {
    localStorage.setItem(BADGE_HIDDEN_KEY, "true");
  }
}

export function getActiveChannel(): ReleaseChannel {
  return getReleaseChannel();
}

export function getBetaModeSummary(): {
  enabled: boolean;
  badgeVisible: boolean;
  channel: ReleaseChannel;
} {
  return {
    enabled: isBetaModeEnabled(),
    badgeVisible: isBetaBadgeVisible(),
    channel: getActiveChannel(),
  };
}
