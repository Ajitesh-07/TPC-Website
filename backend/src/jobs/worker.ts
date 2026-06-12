import { Worker } from "bullmq";
import { connection } from "../lib/queue";
import { prisma } from "../lib/prisma";

/**
 * Background worker — run separately from the API: `npm run worker`.
 * Add real processors as features land; these are wired stubs.
 */

// Recompute drive_eligibility for a drive (or a single student×drive).
new Worker(
  "eligibility",
  async (job) => {
    // job.data = { driveId, studentId? }
    // TODO: load the drive's rules (min_cpi, branches, programs, backlog) and the
    // candidate students, then upsert drive_eligibility rows.
    void prisma;
    console.log("[eligibility]", job.id, job.data);
  },
  { connection }
);

// Generate an export (global export / company-wise applicant CSV), upload to S3.
new Worker(
  "exports",
  async (job) => {
    // TODO: build CSV/XLSX -> presignUpload -> store key -> notify requester.
    console.log("[exports]", job.id, job.data);
  },
  { connection }
);

console.log("👷 Worker started — listening on eligibility/exports queues");
