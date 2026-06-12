import { PrismaClient } from "@prisma/client";
import { isProduction } from "../config/env";

/** Single shared Prisma client for the process. */
export const prisma = new PrismaClient({
  log: isProduction ? ["warn", "error"] : ["query", "warn", "error"],
});
