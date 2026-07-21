/**
 * EPIC 7B — PWA update helpers.
 */

type UpdateCallback = () => void;

let updateCallback: UpdateCallback | null = null;

export function registerPwaUpdateListener(callback: UpdateCallback): void {
  updateCallback = callback;
}

export function promptPwaUpdate(): void {
  updateCallback?.();
}

/** Called from main.tsx when vite-plugin-pwa signals an update. */
export function notifyPwaUpdateAvailable(): void {
  promptPwaUpdate();
}
