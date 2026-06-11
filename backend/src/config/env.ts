import "dotenv/config";

/**
 * Centralised, typed access to environment variables.
 * Read from here instead of touching `process.env` directly.
 */
export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  /** Allowed CORS origins, parsed from a comma-separated list. */
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

export const isProduction = env.nodeEnv === "production";
