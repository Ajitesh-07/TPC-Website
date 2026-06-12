import type { FastifyReply, FastifyRequest } from "fastify";
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
 * preHandler: verify the session JWT (read from the httpOnly cookie by
 * @fastify/jwt) and attach the user to the request.
 */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const payload = await req.jwtVerify<AuthUser>();
    req.authUser = { id: payload.id, role: payload.role, email: payload.email };
  } catch {
    throw Unauthorized("Authentication required");
  }
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
