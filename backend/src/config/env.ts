import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated environment access. Import `env` from here instead of
 * touching `process.env`. The process exits early if required vars are missing.
 */
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 characters"),
  SESSION_COOKIE: z.string().default("tpc_session"),

  // Public base URL of THIS API (used to build magic-link URLs in emails).
  API_BASE_URL: z.string().default("http://localhost:4000"),

  // SMTP for outbound email (recruiter magic links, notifications). When unset,
  // emails are logged to the console in development.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("IIT Patna TPC <no-reply@iitp.ac.in>"),

  // Microsoft Entra ID (Outlook SSO)
  AZURE_TENANT_ID: z.string().optional(),
  AZURE_CLIENT_ID: z.string().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),
  AZURE_REDIRECT_URI: z.string().default("http://localhost:4000/auth/callback"),

  // S3-compatible object storage (resumes, JDs)
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default("tpc-files"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const e = parsed.data;

const corsOrigins = e.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

export const env = {
  port: e.PORT,
  nodeEnv: e.NODE_ENV,
  corsOrigins,
  frontendOrigin: corsOrigins[0] ?? "http://localhost:3000",
  databaseUrl: e.DATABASE_URL,
  redisUrl: e.REDIS_URL,
  jwtSecret: e.JWT_SECRET,
  cookieSecret: e.COOKIE_SECRET,
  sessionCookie: e.SESSION_COOKIE,
  apiBaseUrl: e.API_BASE_URL,
  smtp: {
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    user: e.SMTP_USER,
    pass: e.SMTP_PASS,
    from: e.SMTP_FROM,
  },
  azure: {
    tenantId: e.AZURE_TENANT_ID,
    clientId: e.AZURE_CLIENT_ID,
    clientSecret: e.AZURE_CLIENT_SECRET,
    redirectUri: e.AZURE_REDIRECT_URI,
  },
  s3: {
    endpoint: e.S3_ENDPOINT,
    region: e.S3_REGION,
    bucket: e.S3_BUCKET,
    accessKeyId: e.S3_ACCESS_KEY_ID,
    secretAccessKey: e.S3_SECRET_ACCESS_KEY,
  },
} as const;

export const isProduction = env.nodeEnv === "production";
