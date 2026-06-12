import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";

import { env, isProduction } from "./config/env";
import { redis } from "./lib/redis";
import { registerErrorHandler } from "./middleware/errorHandler";
import { registerNotFound } from "./middleware/notFound";
import { registerOriginCheck } from "./middleware/originCheck";
import { authRoutes } from "./auth/routes";
import { apiRoutes } from "./routes";

/** Build and configure the Fastify app (no network side-effects). */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isProduction ? true : { transport: { target: "pino-pretty" } },
    // Behind an ALB/reverse proxy this makes req.ip the real client address
    // (rate-limit keying, audit IPs). Off by default for direct exposure.
    trustProxy: env.trustProxy,
  });

  // Use zod for validation + OpenAPI generation.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, {
    contentSecurityPolicy: false, // JSON API — no HTML to police
  });
  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  await app.register(cookie, { secret: env.cookieSecret });
  await app.register(jwt, {
    secret: env.jwtSecret,
    cookie: { cookieName: env.sessionCookie, signed: false },
  });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute", redis });

  await app.register(swagger, {
    openapi: { info: { title: "CCDC / TPC API", version: "0.1.0" } },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  registerErrorHandler(app);
  registerNotFound(app);
  registerOriginCheck(app); // CSRF defence for SameSite=None cookies

  await app.register(authRoutes); // /auth/*
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
}
