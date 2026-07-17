import { formatSupabaseError } from "../lib/supabase/formatError";

export type PlanningGenerationStep =
  | "load"
  | "normalize"
  | "generate"
  | "save";

export class PlanningGenerationError extends Error {
  readonly code: string;

  readonly userMessage: string;

  readonly technicalDetails: string;

  readonly entityId?: string;

  readonly step: PlanningGenerationStep;

  constructor({
    code,
    userMessage,
    technicalDetails,
    entityId,
    step,
  }: {
    code: string;
    userMessage: string;
    technicalDetails: string;
    entityId?: string;
    step: PlanningGenerationStep;
  }) {
    super(userMessage);
    this.name = "PlanningGenerationError";
    this.code = code;
    this.userMessage = userMessage;
    this.technicalDetails = technicalDetails;
    this.entityId = entityId;
    this.step = step;
  }

  static fromSupabase({
    error,
    operation,
    step,
    table = "calendar_items",
  }: {
    error: unknown;
    operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
    step: PlanningGenerationStep;
    table?: string;
  }): PlanningGenerationError {
    const formatted = formatSupabaseError({ table, operation, error });
    const pgError =
      error && typeof error === "object"
        ? (error as { code?: string })
        : undefined;

    return new PlanningGenerationError({
      code: pgError?.code ?? "SUPABASE_ERROR",
      userMessage: formatted.message,
      technicalDetails: formatted.message,
      step,
    });
  }

  static noAvailableSlots(): PlanningGenerationError {
    return new PlanningGenerationError({
      code: "NO_AVAILABLE_SLOTS",
      userMessage:
        "Le planning n’a aucun intervalle disponible entre le réveil et le coucher.",
      technicalDetails: "findAvailableSlots returned zero usable intervals.",
      step: "generate",
    });
  }
}

export function isPlanningGenerationError(
  error: unknown,
): error is PlanningGenerationError {
  return error instanceof PlanningGenerationError;
}

export function getPlanningErrorMessage(error: unknown): string {
  if (isPlanningGenerationError(error)) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Impossible de générer le planning.";
}
