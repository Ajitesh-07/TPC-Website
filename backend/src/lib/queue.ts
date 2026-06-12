import { Queue, type ConnectionOptions } from "bullmq";
import { redis } from "./redis";

// BullMQ ships its own copy of ioredis, so our shared client's type doesn't line
// up with BullMQ's ConnectionOptions even though they're runtime-compatible.
// Cast once here and reuse it for every queue and worker.
export const connection = redis as unknown as ConnectionOptions;

/**
 * Background-work queues (processed by src/jobs/worker.ts). Enqueue from request
 * handlers so slow work never blocks a response.
 *   - eligibility: recompute drive_eligibility for a drive / student
 *   - exports:     generate CSV/XLSX, upload to storage, then notify
 *   - email:       outbound mail (auto-mail generator, notifications)
 */
export const queues = {
  eligibility: new Queue("eligibility", { connection }),
  exports: new Queue("exports", { connection }),
  email: new Queue("email", { connection }),
} as const;
