/**
 * EPIC 7B — Offline mutation queue (localStorage).
 */

import type { OfflineMutation, OfflineMutationKind } from "../types/mobileTypes";

const PREFIX = "offline-mutation-queue-";

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

function readQueue(userId: string): OfflineMutation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    return JSON.parse(raw) as OfflineMutation[];
  } catch {
    return [];
  }
}

function writeQueue(userId: string, entries: OfflineMutation[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key(userId), JSON.stringify(entries.slice(0, 200)));
}

export function enqueueOfflineMutation(input: {
  userId: string;
  kind: OfflineMutationKind;
  payload: Record<string, unknown>;
}): OfflineMutation {
  const now = new Date().toISOString();
  const mutation: OfflineMutation = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    kind: input.kind,
    payload: input.payload,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  const queue = readQueue(input.userId);
  queue.unshift(mutation);
  writeQueue(input.userId, queue);
  return mutation;
}

export function listOfflineMutations(userId: string): OfflineMutation[] {
  return readQueue(userId);
}

export function listPendingMutations(userId: string): OfflineMutation[] {
  return readQueue(userId).filter(
    (item) => item.status === "pending" || item.status === "failed",
  );
}

export function updateOfflineMutation(
  userId: string,
  mutationId: string,
  patch: Partial<OfflineMutation>,
): void {
  writeQueue(
    userId,
    readQueue(userId).map((item) =>
      item.id === mutationId
        ? { ...item, ...patch, updatedAt: new Date().toISOString() }
        : item,
    ),
  );
}

export function removeOfflineMutation(userId: string, mutationId: string): void {
  writeQueue(
    userId,
    readQueue(userId).filter((item) => item.id !== mutationId),
  );
}

export function clearOfflineMutations(userId: string): void {
  writeQueue(userId, []);
}
