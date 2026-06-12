import type { FastifyInstance, FastifyReply } from "fastify";
import { randomBytes } from "node:crypto";
import { msal, SCOPES, resolveUser } from "./microsoft";
import { requestRecruiterLogin, verifyRecruiterLogin } from "./recruiter";
import { env } from "../config/env";
import { audit } from "../lib/audit";
import { BadRequest, Forbidden, Unauthorized } from "../middleware/errorHandler";
import type { Role } from "../middleware/auth";

const STATE_COOKIE = "tpc_oauth_state";
/** Non-httpOnly role hint for the Next router guard — UX routing only, never authz. */
const ROLE_COOKIE = "tpc-role";

/** Cross-origin session cookie options (SameSite=None requires Secure). */
const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
};

/** Same attributes but readable by the frontend (role hint). */
const ROLE_COOKIE_OPTS = { ...SESSION_COOKIE_OPTS, httpOnly: false };

/** Where each role lands after login (must mirror the frontend routes). */
const POST_LOGIN_PATH: Record<Role, string> = {
  student: "/student-dashboard",
  company: "/company-dashboard",
  coordinator: "/coordinator-dashboard",
  admin: "/admin-dashboard",
  super_admin: "/super-admin-dashboard",
};

const dashboardUrl = (role: Role) => `${env.frontendOrigin}${POST_LOGIN_PATH[role]}`;

/** The frontend uses hyphenated role slugs (super-admin); the API uses enums. */
const toFrontendRole = (role: Role) => role.replace(/_/g, "-");

async function startSession(
  reply: FastifyReply,
  user: { id: string; role: Role; email: string }
) {
  const token = await reply.jwtSign({ id: user.id, role: user.role, email: user.email });
  reply.setCookie(env.sessionCookie, token, SESSION_COOKIE_OPTS);
  reply.setCookie(ROLE_COOKIE, toFrontendRole(user.role), ROLE_COOKIE_OPTS);
}

/**
 * Two sign-in paths ending at the same session JWT cookie:
 *   - institute users → Microsoft (Outlook) SSO
 *   - company recruiters → email magic link (provisioned, invite-only)
 */
export async function authRoutes(app: FastifyInstance) {
  // --- Microsoft SSO ---------------------------------------------------------

  // 1. Start sign-in. Random `state` round-trips via a short-lived cookie (CSRF).
  app.get("/auth/login", async (_req, reply) => {
    const state = randomBytes(16).toString("hex");
    reply.setCookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
      path: "/",
      maxAge: 600,
    });

    const url = await msal.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: env.azure.redirectUri,
      state,
    });
    return reply.redirect(url);
  });

  // 2. OAuth callback — verify state, exchange the code, set the session.
  app.get("/auth/callback", async (req, reply) => {
    const { code, state } = req.query as { code?: string; state?: string };
    const expectedState = req.cookies[STATE_COOKIE];
    reply.clearCookie(STATE_COOKIE, { path: "/" });

    if (!state || !expectedState || state !== expectedState) {
      throw Forbidden("Invalid OAuth state");
    }
    if (!code) throw BadRequest("Missing authorization code");

    const result = await msal.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: env.azure.redirectUri,
    });

    const email = result.account?.username;
    const name = result.account?.name ?? email ?? "User";
    if (!email) throw Unauthorized("Microsoft did not return an email");

    const user = await resolveUser(email, name);
    await startSession(reply, user as { id: string; role: Role; email: string });
    audit({ id: user.id, role: user.role as Role, email: user.email }, "login", {
      details: "microsoft",
      ip: req.ip,
    });
    return reply.redirect(dashboardUrl(user.role as Role));
  });

  // --- Recruiter magic-link login -------------------------------------------

  // Request a one-time sign-in link. Always 200 (no account enumeration).
  app.post(
    "/auth/recruiter/request",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req) => {
      const { email } = (req.body ?? {}) as { email?: string };
      if (!email) throw BadRequest("Email is required");
      await requestRecruiterLogin(email);
      return { ok: true };
    }
  );

  // Verify the magic-link token (clicked from the email) and start the session.
  app.get("/auth/recruiter/verify", async (req, reply) => {
    const { token } = req.query as { token?: string };
    if (!token) throw BadRequest("Missing token");

    const user = await verifyRecruiterLogin(token);
    if (!user) throw Unauthorized("This sign-in link is invalid or has expired");

    await startSession(reply, user as { id: string; role: Role; email: string });
    audit({ id: user.id, role: user.role as Role, email: user.email }, "login", {
      details: "magic-link",
      ip: req.ip,
    });
    return reply.redirect(dashboardUrl(user.role as Role));
  });

  // --- Dev-only impersonation -------------------------------------------------
  // Mint a session for any seeded user by email. FAILS CLOSED: registered only
  // when ENABLE_DEV_LOGIN=true AND NODE_ENV=development (see config/env.ts).
  // An unset/misconfigured NODE_ENV can NEVER expose this route.
  if (env.enableDevLogin) {
    app.get("/auth/dev/login", async (req, reply) => {
      const { email } = req.query as { email?: string };
      if (!email) throw BadRequest("email query param required");
      const { prisma } = await import("../lib/prisma");
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user || user.status !== "active") throw Unauthorized("No such active user");
      await startSession(reply, user as { id: string; role: Role; email: string });
      return reply.redirect(dashboardUrl(user.role as Role));
    });
  }

  // --- Logout ----------------------------------------------------------------

  app.post("/auth/logout", async (_req, reply) => {
    const clearOpts = {
      path: "/",
      sameSite: "none" as const,
      secure: true,
      ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
    };
    reply.clearCookie(env.sessionCookie, clearOpts);
    reply.clearCookie(ROLE_COOKIE, clearOpts);
    return { ok: true };
  });
}
