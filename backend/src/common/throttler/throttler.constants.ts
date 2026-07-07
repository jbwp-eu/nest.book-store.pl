export const SENSITIVE_THROTTLE_NAME = 'sensitive';

export const SENSITIVE_THROTTLE_DEFAULTS = {
  // Okno czasowe (w milisekundach) do zliczania żądań dla throttlingu (domyślnie 15 minut = 900_000 ms)
  windowMs: 900_000,
  max: 20,
} as const;

function positiveInt(value: string | undefined, fallback: number): number {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveSensitiveThrottlerConfig() {
  const ttl = positiveInt(
    process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS,
    SENSITIVE_THROTTLE_DEFAULTS.windowMs,
  );
  const limit = positiveInt(
    process.env.RATE_LIMIT_SENSITIVE_MAX,
    SENSITIVE_THROTTLE_DEFAULTS.max,
  );

  return {
    name: SENSITIVE_THROTTLE_NAME,
    ttl,
    limit,
  };
}
