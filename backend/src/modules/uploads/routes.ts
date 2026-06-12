import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { BadRequest, Forbidden } from "../../middleware/errorHandler";
import { presignUpload, presignDownload } from "../../lib/storage";
import { audit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";

type Purpose = "resume" | "jd" | "logo";

/** Allowed content types per purpose (security: never presign arbitrary types). */
const PURPOSE_TYPES: Record<Purpose, string[]> = {
  resume: ["application/pdf"],
  jd: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  logo: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
};

/** Which roles may request which purpose. */
const PURPOSE_ROLES: Record<Purpose, string[]> = {
  resume: ["student"],
  jd: ["company", "coordinator", "admin", "super_admin"],
  logo: ["company", "coordinator", "admin", "super_admin"],
};

const presignBody = z.object({
  purpose: z.enum(["resume", "jd", "logo"]),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
});

const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

export async function uploadRoutes(app: FastifyInstance) {
  // Presigned PUT for a new file. Key is unguessable (uuid) and scoped to the
  // requesting user, so clients can never overwrite someone else's object.
  app.post(
    "/uploads/presign",
    { preHandler: requireAuth, config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req) => {
      const body = presignBody.parse(req.body);
      const user = req.authUser!;

      if (!PURPOSE_ROLES[body.purpose].includes(user.role)) {
        throw Forbidden(`Your role cannot upload ${body.purpose} files`);
      }
      if (!PURPOSE_TYPES[body.purpose].includes(body.contentType)) {
        throw BadRequest(`Content type not allowed for ${body.purpose}`);
      }

      const key = `${body.purpose}/${user.id}/${randomUUID()}-${sanitize(body.fileName)}`;
      const uploadUrl = await presignUpload(key, body.contentType, 300);
      audit(user, "upload", { targetLabel: key, details: body.contentType, ip: req.ip });
      return { uploadUrl, key, expiresIn: 300 };
    }
  );

  // Presigned GET for an existing file, after an authorisation check that
  // depends on the file's purpose (see API_DESIGN.md "Uploads").
  app.get("/files/presign", { preHandler: requireAuth }, async (req) => {
    const { key } = z.object({ key: z.string().min(1).max(500) }).parse(req.query);
    const user = req.authUser!;
    const [purpose, ownerUserId] = key.split("/");

    if (purpose === "resume") {
      const isOwner = ownerUserId === user.id;
      const isStaff = ["coordinator", "admin", "super_admin"].includes(user.role);

      let recruiterAllowed = false;
      if (!isOwner && !isStaff && user.role === "company") {
        // A recruiter may read a resume only when that student applied to one
        // of the recruiter's company drives.
        const recruiter = await prisma.recruiter.findUnique({ where: { userId: user.id } });
        if (recruiter) {
          const application = await prisma.application.findFirst({
            where: {
              drive: { companyId: recruiter.companyId },
              student: { user: { id: ownerUserId } },
            },
            select: { id: true },
          });
          recruiterAllowed = application !== null;
        }
      }

      if (!isOwner && !isStaff && !recruiterAllowed) throw Forbidden();
    }
    // jd/* and logo/* are readable by any authenticated portal user.

    const url = await presignDownload(key, 300);
    return { url, expiresIn: 300 };
  });
}
