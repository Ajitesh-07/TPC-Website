import Redis from "ioredis";
import { env } from "../config/env";

/**
 * Shared Redis connection (cache, rate-limit store, BullMQ broker).
 * `maxRetriesPerRequest: null` is required for BullMQ-compatible connections.
 */
export const redis = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
