/**
 * EPIC 9 — Aura release versioning & channels.
 */

export type ReleaseChannel = "alpha" | "beta" | "stable";

/** Semantic version — keep in sync with package.json */
export const APP_VERSION = "1.0.0-beta.1";

export const APP_BETA_LABEL = "Version bêta privée";

export function getReleaseChannel(): ReleaseChannel {
  const raw = import.meta.env.VITE_AURA_RELEASE_CHANNEL?.trim().toLowerCase();
  if (raw === "alpha" || raw === "beta" || raw === "stable") return raw;
  if (APP_VERSION.includes("alpha")) return "alpha";
  if (APP_VERSION.includes("beta")) return "beta";
  return "stable";
}

export function getChannelLabel(channel: ReleaseChannel = getReleaseChannel()): string {
  if (channel === "alpha") return "Alpha";
  if (channel === "beta") return "Beta";
  return "Stable";
}

export function formatDisplayVersion(version: string = APP_VERSION): string {
  return version.startsWith("v") ? version : `v${version}`;
}

export function parseVersion(version: string = APP_VERSION): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    return { major: 1, minor: 0, patch: 0, prerelease: "beta.1" };
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}
