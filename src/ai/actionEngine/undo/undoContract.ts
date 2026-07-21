/** EPIC 4C — Undo architecture (contract only — execution deferred). */

import type { SecureActionType } from "../types/secureAction";

export type UndoToken = {
  readonly id: string;
  readonly actionId: string;
  readonly actionType: SecureActionType;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly reversible: boolean;
  readonly snapshot: Readonly<Record<string, unknown>>;
};

export type UndoRequest = {
  readonly tokenId: string;
  readonly userId: string;
  readonly reason?: string;
};

export type UndoResult = {
  readonly success: boolean;
  readonly message: string;
  readonly restoredAt: string;
};

/** Future UndoEngine — not implemented in EPIC 4C. */
export type IUndoEngine = {
  registerUndoToken(token: UndoToken): void;
  canUndo(tokenId: string, userId: string): boolean;
  undo(request: UndoRequest): Promise<UndoResult>;
};

export const UNDO_NOT_IMPLEMENTED_MESSAGE =
  "Annulation (Undo) — architecture préparée, exécution non disponible dans EPIC 4C.";
