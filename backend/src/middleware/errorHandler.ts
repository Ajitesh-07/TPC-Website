import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { isProduction } from "../config/env";

/** Throw to control the HTTP status of a response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const NotFound = (m = "Not found") => new HttpError(404, m, "not_found");
export const Forbidden = (m = "Forbidden") => new HttpError(403, m, "forbidden");
export const Unauthorized = (m = "Unauthorized") => new HttpError(401, m, "unauthorized");
export const BadRequest = (m = "Bad request") => new HttpError(400, m, "bad_request");

/** Centralised error handler. Route handlers can simply `throw`. */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(
    (err: FastifyError | HttpError | ZodError, req: FastifyRequest, reply: FastifyReply) => {
      if (err instanceof ZodError) {
        return reply.status(400).send({ error: "validation_error", issues: err.flatten() });
      }
      if (err instanceof HttpError) {
        return reply.status(err.status).send({ error: err.code ?? "error", message: err.message });
      }
      const status = (err as FastifyError).statusCode ?? 500;
      if (status >= 500) req.log.error(err);
      return reply.status(status).send({
        error: status >= 500 ? "internal_error" : "error",
        message: status >= 500 && isProduction ? "Internal Server Error" : err.message,
      });
    }
  );
}
