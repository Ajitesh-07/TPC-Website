import { z } from "zod";

/** Zod schemas for the logistics module (parsed in routes, typed into the service). */

/**
 * Upsert body for the company's singleton logistics request. Booleans carry
 * sensible defaults; everything else is optional and nullable (clearing a value
 * is meaningful). `roomsRequired` / `systemsRequired` map to @db.SmallInt.
 */
export const logisticsUpsertBody = z.object({
  accommodationRequired: z.boolean().default(false),
  roomsRequired: z.number().int().min(0).max(10_000).nullable().optional(),
  checkIn: z.coerce.date().nullable().optional(),
  checkOut: z.coerce.date().nullable().optional(),
  dietaryPreference: z.string().trim().max(2_000).nullable().optional(),
  specialRequests: z.string().trim().max(5_000).nullable().optional(),
  venuePreference: z.string().trim().max(2_000).nullable().optional(),
  systemsRequired: z.number().int().min(0).max(10_000).nullable().optional(),
  projectorRequired: z.boolean().default(false),
  internetRequired: z.boolean().default(false),
  technicalNotes: z.string().trim().max(5_000).nullable().optional(),
});
export type LogisticsUpsertInput = z.infer<typeof logisticsUpsertBody>;

export const teamMemberBody = z.object({
  name: z.string().trim().min(1).max(200),
  designation: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().email().max(320).optional(),
});
export type TeamMemberInput = z.infer<typeof teamMemberBody>;

export const idParam = z.object({ id: z.string().uuid() });
