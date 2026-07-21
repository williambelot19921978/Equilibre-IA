/**
 * EPIC 7B — Connectivity detection (online / offline / degraded).
 */

import type { ConnectivityState } from "../types/mobileTypes";

type Listener = (state: ConnectivityState) => void;

export class ConnectivityEngine {
  private listeners = new Set<Listener>();
  private state: ConnectivityState =
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";

  constructor() {
    if (typeof window === "undefined") return;
    window.addEventListener("online", () => this.setState("online"));
    window.addEventListener("offline", () => this.setState("offline"));
  }

  getState(): ConnectivityState {
    return this.state;
  }

  isOnline(): boolean {
    return this.state !== "offline";
  }

  /** Mark degraded when requests fail but browser reports online. */
  markDegraded(): void {
    if (this.state === "online") {
      this.setState("degraded");
    }
  }

  markHealthy(): void {
    if (this.state === "degraded") {
      this.setState("online");
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private setState(next: ConnectivityState): void {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}

export const defaultConnectivityEngine = new ConnectivityEngine();
