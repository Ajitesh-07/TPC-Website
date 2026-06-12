import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { msal, SCOPES, resolveUser } from "./microsoft";
import { requestRecruiterLogin, verifyRecruiterLogin } from "./recruiter";
import { env } from "../config/env";
import { BadRequest, Forbidden, Unauthorized } from "../middleware/errorHandler";

/** Cross-origin session cookie options (SameSite=None requires Secure). */
const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const STATE_COOKIE = "tpc_oauth_state";

/**
 * Microsoft (Outlook) OAuth login. The frontend (a different origin) calls these
 * with `credentials: "include"`. The session is an httpOnly JWT cookie; because
 * the API and the SPA are on separate origins it must be SameSite=None; Secure.
 */
export async function authRoutes(app: FastifyInstance) {
  // 1. Start sign-in. A random `state` is stored in a short-lived cookie and
  //    echoed back by Microsoft, then verified on the callback (CSRF defence).
  app.get("/auth/login", async (_req, reply) => {
    const state = randomBytes(16).toString("hex");
    reply.setCookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax", // sent on the top-level redirect back to this same origin
      secure: env.nodeEnv === "production",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    const url = await msal.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: env.azure.redirectUri,
      state,
    });
    return reply.redirect(url);
  });

  // 2. OAuth callback — verify state, exchange the code, resolve the user, set
  //    the cross-origin session cookie.
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
    const token = await reply.jwtSign({ id: user.id, role: user.role, email: user.email });

    // Cross-origin (SPA on :3000, API on :4000): SameSite=None requires Secure.
    // Browsers allow Secure cookies over http://localhost for local dev.
    reply.setCookie(env.sessionCookie, token, SESSION_COOKIE_OPTS);
    return reply.redirect(env.frontendOrigin);
  });

  // --- Recruiter magic-link login (external users, no institute SSO) ---------

  // Request a one-time sign-in link by email. Always 200 (no account enumeration).
  app.post("/auth/recruiter/request", async (req) => {
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email) throw BadRequest("Email is required");
    await requestRecruiterLogin(email);
    return { ok: true };
  });

  // Verify a magic-link token (clicked from the email) and start the session.
  app.get("/auth/recruiter/verify", async (req, reply) => {
    const { token } = req.query as { token?: string };
    if (!token) throw BadRequest("Missing token");

    const user = await verifyRecruiterLogin(token);
    if (!user) throw Unauthorized("This sign-in link is invalid or has expired");

    const jwt = await reply.jwtSign({ id: user.id, role: user.role, email: user.email });
    reply.setCookie(env.sessionCookie, jwt, SESSION_COOKIE_OPTS);
    return reply.redirect(env.frontendOrigin);
  });

  // Logout — clear the session cookie (same attributes used to set it).
  app.post("/auth/logout", async (_req, reply) => {
    reply.clearCookie(env.sessionCookie, { path: "/", sameSite: "none", secure: true });
    return { ok: true };
  });
}
