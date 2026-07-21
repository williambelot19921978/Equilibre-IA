/**
 * EPIC 5B — Background sync scheduler (architecture only).
 */

export type BackgroundSyncConfig = {
  readonly intervalMinutes: number;
  readonly enabled: boolean;
};

export const DEFAULT_BACKGROUND_SYNC_CONFIG: BackgroundSyncConfig = {
  intervalMinutes: 15,
  enabled: false,
};

export type BackgroundSyncTickHandler = () => void | Promise<void>;

export class BackgroundSyncScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: BackgroundSyncConfig = DEFAULT_BACKGROUND_SYNC_CONFIG;

  configure(config: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(handler: BackgroundSyncTickHandler): void {
    this.stop();
    if (!this.config.enabled) return;

    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.timer = setInterval(() => {
      void handler();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  getConfig(): BackgroundSyncConfig {
    return this.config;
  }
}

export const defaultBackgroundSyncScheduler = new BackgroundSyncScheduler();
