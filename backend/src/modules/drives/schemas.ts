import { z } from "zod";
import {
  ApplicationStatus,
  DriveProcessType,
  DriveStatus,
  StageStatus,
  StageType,
} from "@prisma/client";
import { pageQuery } from "../../lib/pagination";

/** Zod schemas for the drives module (parsed in routes, typed into the service). */

export const driveListQuery = pageQuery.extend({
  status: z.nativeEnum(DriveStatus).optional(),
  processType: z.nativeEnum(DriveProcessType).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(["deadline", "ctc", "company"]).optional(),
});
export type DriveListQuery = z.infer<typeof driveListQuery>;

const stageInput = z.object({
  type: z.nativeEnum(StageType),
  label: z.string().trim().min(1).max(200).optional(),
  sequence: z.number().int().min(1).max(100),
  scheduledAt: z.coerce.date().optional(),
  location: z.string().trim().max(300).optional(),
});

const stagesArray = z
  .array(stageInput)
  .max(20)
  .superRefine((stages, ctx) => {
    if (new Set(stages.map((s) => s.sequence)).size !== stages.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stage sequences must be unique" });
    }
  });

export const driveCreateBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).optional(),
  processType: z.nativeEnum(DriveProcessType),
  location: z.string().trim().max(300).optional(),
  ctcLpa: z.number().min(0).max(99_999).optional(),
  stipendPerMonth: z.number().min(0).max(99_999_999).optional(),
  minCpi: z.number().min(0).max(10).optional(),
  allowBacklog: z.boolean(),
  customRules: z.string().max(5_000).optional(),
  openings: z.number().int().min(1).max(100_000).optional(),
  applicationDeadline: z.coerce.date().optional(),
  branchIds: z.array(z.string().uuid()).max(200).default([]),
  programIds: z.array(z.string().uuid()).max(50).default([]),
  skillNames: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  stages: stagesArray.default([]),
  // Required for staff; recruiters always get their own company regardless.
  companyId: z.string().uuid().optional(),
});
export type DriveCreateInput = z.infer<typeof driveCreateBody>;

/** Partial of the create body; nullable where clearing the value makes sense. */
export const driveUpdateBody = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(10_000).nullable().optional(),
  processType: z.nativeEnum(DriveProcessType).optional(),
  location: z.string().trim().max(300).nullable().optional(),
  ctcLpa: z.number().min(0).max(99_999).nullable().optional(),
  stipendPerMonth: z.number().min(0).max(99_999_999).nullable().optional(),
  minCpi: z.number().min(0).max(10).nullable().optional(),
  allowBacklog: z.boolean().optional(),
  customRules: z.string().max(5_000).nullable().optional(),
  openings: z.number().int().min(1).max(100_000).nullable().optional(),
  applicationDeadline: z.coerce.date().nullable().optional(),
  branchIds: z.array(z.string().uuid()).max(200).optional(),
  programIds: z.array(z.string().uuid()).max(50).optional(),
  skillNames: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  stages: stagesArray.optional(),
  // Only admin / super_admin may move a drive to another company.
  companyId: z.string().uuid().optional(),
});
export type DriveUpdateInput = z.infer<typeof driveUpdateBody>;

export const driveDecisionBody = z.object({
  approve: z.boolean(),
  note: z.string().trim().max(1_000).optional(),
});
export type DriveDecisionInput = z.infer<typeof driveDecisionBody>;

export const stageStatusBody = z.object({
  status: z.nativeEnum(StageStatus),
});

export const applicantsQuery = pageQuery.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
});
export type ApplicantsQuery = z.infer<typeof applicantsQuery>;

export const idParam = z.object({ id: z.string().uuid() });
export const stageParams = z.object({ id: z.string().uuid(), stageId: z.string().uuid() });
