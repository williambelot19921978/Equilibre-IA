type PostgrestLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function extractPostgrestError(error: unknown): PostgrestLikeError | null {
  if (error instanceof Error) {
    return error as PostgrestLikeError;
  }

  if (error && typeof error === "object") {
    const candidate = error as PostgrestLikeError;

    if (
      candidate.message ||
      candidate.code ||
      candidate.details ||
      candidate.hint
    ) {
      return candidate;
    }
  }

  return null;
}

export function formatSupabaseError({
  table,
  operation,
  error,
}: {
  table: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "UPSERT";
  error: unknown;
}): Error {
  const pgError = extractPostgrestError(error);

  if (!pgError) {
    return new Error(
      `[${table}] ${operation} — erreur non reconnue: ${JSON.stringify(error)}`,
    );
  }

  const message = pgError.message ?? "échec sans message";
  const code = pgError.code ? `code=${pgError.code}` : null;
  const details = pgError.details ? `details=${pgError.details}` : null;
  const hint = pgError.hint ? `hint=${pgError.hint}` : null;

  const suffix = [code, details, hint].filter(Boolean).join(" | ");

  if (
    message.includes("does not exist") ||
    pgError.code === "42P01" ||
    pgError.code === "PGRST205"
  ) {
    return new Error(
      `[${table}] ${operation} — table ou colonne absente${suffix ? ` — ${suffix}` : ""}. Exécute les migrations Supabase.`,
    );
  }

  if (
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("violates check constraint") ||
    pgError.code === "42501" ||
    pgError.code === "23514"
  ) {
    return new Error(
      `[${table}] ${operation} — ${message}${suffix ? ` — ${suffix}` : ""}`,
    );
  }

  return new Error(
    `[${table}] ${operation} — ${message}${suffix ? ` — ${suffix}` : ""}`,
  );
}

export function logSupabaseInsertPayload(
  table: string,
  payload: Record<string, unknown>,
): void {
  if (import.meta.env.DEV) {
    console.info(`[${table}] INSERT payload`, payload);
  }
}
