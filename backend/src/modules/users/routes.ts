import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { Unauthorized } from "../../middleware/errorHandler";
import { StudentsSelfService } from "../students/self.service";

export async function userRoutes(app: FastifyInstance) {
  /**
   * The current user + their role-specific profile. The Next frontend calls
   * this to populate the RoleProvider (replacing the mock cookie role).
   *
   * Student profile is the serialised shape from the students module:
   * branch {id,code,name}, program {id,code,name}, skills: string[], cpi as
   * number (see API_DESIGN.md "Me / student self-service").
   */
  app.get("/me", { preHandler: requireAuth }, async (req) => {
    const id = req.authUser!.id;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Unauthorized();

    let profile: unknown = null;
    if (user.role === "student") {
      profile = await StudentsSelfService.profileFor(id);
    } else if (user.role === "company") {
      profile = await prisma.recruiter.findUnique({ where: { userId: id } });
    } else if (user.role === "coordinator") {
      profile = await prisma.coordinator.findUnique({ where: { userId: id } });
    }

    return {
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      profile,
    };
  });
}
