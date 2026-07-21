/**
 * EPIC 7C — Sound architecture (no default audio files).
 * Future: wire validation, success, coach, notification sounds.
 */

export type AuraSoundId = "validation" | "success" | "coach" | "notification";

export type AuraSoundPreferences = {
  enabled: boolean;
  volume: number;
  perSound: Record<AuraSoundId, boolean>;
};

const STORAGE_KEY = "aura-sound-preferences";

const DEFAULT_PREFS: AuraSoundPreferences = {
  enabled: false,
  volume: 0.6,
  perSound: {
    validation: true,
    success: true,
    coach: true,
    notification: true,
  },
};

type SoundHandler = (id: AuraSoundId) => void;

let customHandler: SoundHandler | null = null;

export function readSoundPreferences(): AuraSoundPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function persistSoundPreferences(prefs: AuraSoundPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function setAuraSoundHandler(handler: SoundHandler | null): void {
  customHandler = handler;
}

/** Play a sound if enabled — no-op until assets/handler are registered. */
export function playAuraSound(id: AuraSoundId): void {
  const prefs = readSoundPreferences();
  if (!prefs.enabled || !prefs.perSound[id]) return;
  customHandler?.(id);
}

export function getAuraSoundAssetPath(id: AuraSoundId): string {
  return `/aura/sounds/${id}.mp3`;
}
