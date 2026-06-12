import type { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { Forbidden } from "./errorHandler";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Top-level GET navigations that legitimately arrive from other origins.
const EXEMPT_PREFIXES = ["/auth/callback", "/auth/recruiter/verify"];

/**
 * CSRF defence for a SameSite=None session cookie (cross-origin SPA): browsers
 * attach the cookie to cross-site requests, so we reject any state-changing
 * request whose Origin header is present but not allowlisted. A missing Origin
 * means a non-browser client (curl, server) — no ambient-cookie risk there.
 */
export function registerOriginCheck(app: FastifyInstance) {
  app.addHook("onRequest", async (req) => {
    if (!MUTATING.has(req.method)) return;
    if (EXEMPT_PREFIXES.some((p) => req.url.startsWith(p))) return;

    const origin = req.headers.origin;
    if (origin && !env.corsOrigins.includes(origin)) {
      throw Forbidden("Cross-origin request rejected");
    }
  });
}
