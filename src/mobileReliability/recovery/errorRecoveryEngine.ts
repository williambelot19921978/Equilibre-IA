/**
 * EPIC 7B — Error recovery with exponential backoff retry.
 */

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 4,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  shouldRetry: (error) => {
    if (error instanceof TypeError) return true;
    if (error && typeof error === "object" && "status" in error) {
      const status = Number((error as { status: number }).status);
      return status >= 500 || status === 408 || status === 429;
    }
    return true;
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= config.maxAttempts || !config.shouldRetry(error, attempt)) {
        throw error;
      }
      const backoff = Math.min(
        config.maxDelayMs,
        config.baseDelayMs * 2 ** (attempt - 1),
      );
      await delay(backoff);
    }
  }

  throw lastError;
}

export class ErrorRecoveryEngine {
  async run<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T> {
    return withRetry(operation, options);
  }
}

export const defaultErrorRecoveryEngine = new ErrorRecoveryEngine();
