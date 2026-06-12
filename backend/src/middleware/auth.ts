import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { Forbidden, Unauthorized } from "./errorHandler";

export type Role = "student" | "company" | "coordinator" | "admin" | "super_admin";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    /** The authenticated user, set by `requireAuth`. */
    authUser?: AuthUser;
  }
}

/**
 * Live account check on every request so revocations and role changes take
 * effect immediately, not when the 7-day JWT expires. Served from the Redis
 * "users" cache entity (bumped by the admin user-management writes), so steady
 * state costs no DB query; TTL is the fallback when Redis is cold.
 */
async function liveAccount(userId: string): Promise<{ role: Role; status: string } | null> {
  return cached(`users`, `live:${userId}`, 300, async () => {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });
    return u ? { role: u.role as Role, status: u.status } : null;
  });
}

/**
 * preHandler: verify the session JWT (read from the httpOnly cookie by
 * @fastify/jwt), confirm the account is still active, and attach the user —
 * with the CURRENT role from the database, not the (possibly stale) JWT claim.
 */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  let payload: AuthUser;
  try {
    payload = await req.jwtVerify<AuthUser>();
  } catch {
    throw Unauthorized("Authentication required");
  }

  const account = await liveAccount(payload.id);
  if (!account) throw Unauthorized("Account no longer exists");
  if (account.status !== "active") throw Forbidden("Your access has been revoked");

  req.authUser = { id: payload.id, role: account.role, email: payload.email };
}

/**
 * preHandler factory for route-level RBAC (mirrors the frontend ROUTE_ACCESS).
 * NOTE: this is only the coarse gate — row-level ownership (a recruiter sees
 * only their company's data, etc.) must still be enforced in each service.
 */
export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(req, reply);
    if (!roles.includes(req.authUser!.role)) {
      throw Forbidden("Insufficient permissions");
    }
  };
}
