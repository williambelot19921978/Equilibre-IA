/**
 * EPIC 6A — Observation history store (localStorage).
 */

import type { BehaviorObservation } from "../types/adaptiveTypes";

const STORAGE_PREFIX = "adaptive-observations-";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): BehaviorObservation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as BehaviorObservation[];
  } catch {
    return [];
  }
}

function write(userId: string, observations: BehaviorObservation[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(observations.slice(0, 500)));
}

export function appendObservation(userId: string, observation: BehaviorObservation): void {
  const history = read(userId);
  history.unshift(observation);
  write(userId, history);
}

export function appendObservations(userId: string, observations: readonly BehaviorObservation[]): void {
  if (observations.length === 0) return;
  const history = read(userId);
  write(userId, [...observations, ...history]);
}

export function getObservations(userId: string): BehaviorObservation[] {
  return read(userId);
}

export function clearObservations(userId: string): void {
  write(userId, []);
}

export function filterObservationsSince(
  observations: readonly BehaviorObservation[],
  sinceIso: string,
): BehaviorObservation[] {
  const since = new Date(sinceIso).getTime();
  return observations.filter((obs) => new Date(obs.timestamp).getTime() >= since);
}
