import { Worker } from "bullmq";
import { connection } from "../lib/queue";
import { processEligibilityJob, type EligibilityJob } from "../modules/eligibility/service";

/**
 * Background worker — run separately from the API: `npm run worker`.
 */

new Worker<EligibilityJob>(
  "eligibility",
  async (job) => {
    const count = await processEligibilityJob(job.data);
    console.log(`[eligibility] ${job.id} recomputed ${count} rows`, job.data);
  },
  { connection, concurrency: 2 }
);

// Exports / email queues are phase-2; keep consumers registered so enqueued
// jobs don't pile up unprocessed.
new Worker(
  "exports",
  async (job) => {
    console.log("[exports] (phase 2 stub)", job.id, job.data);
  },
  { connection }
);

new Worker(
  "email",
  async (job) => {
    console.log("[email] (phase 2 stub)", job.id, job.data);
  },
  { connection }
);

console.log("👷 Worker started — eligibility/exports/email queues");
