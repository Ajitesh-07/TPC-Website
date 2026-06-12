import type { FastifyInstance } from "fastify";

/** Consistent 404 JSON shape for unmatched routes. */
export function registerNotFound(app: FastifyInstance) {
  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      error: "not_found",
      message: `Cannot ${req.method} ${req.url}`,
    });
  });
}
