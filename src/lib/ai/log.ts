/** Lightweight AI logging + retry, deliberately free of secrets/PII. */

const REDACT_KEYS = new Set(["apiKey", "token", "authorization", "email"]);

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = REDACT_KEYS.has(k) ? "«redacted»" : v;
  }
  return out;
}

export function logAi(event: string, meta: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV === "test") return;
  // eslint-disable-next-line no-console
  console.info(`[ai] ${event}`, redact(meta));
}

/** Retry an async op with exponential backoff. Used by real provider adapters. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 400 }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logAi("retry", { attempt: i + 1, message: error instanceof Error ? error.message : "unknown" });
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** i));
      }
    }
  }
  throw lastError;
}
