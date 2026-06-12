import { redis } from "./redis";

/**
 * Version-counter cache-aside (see API_DESIGN.md).
 *
 * Reads:  version = GET v:<entity>  →  key = c:<entity>:<version>:<suffix>
 * Writes: bump(entity) just INCRs the version — every key of that entity is
 *         instantly stale without any SCAN/DEL fan-out.
 *
 * The cache must never take a request down: any Redis failure falls through to
 * the loader (DB) and logs at debug level.
 */

async function version(entity: string): Promise<string> {
  const v = await redis.get(`v:${entity}`);
  return v ?? "1";
}

export async function cached<T>(
  entity: string,
  suffix: string,
  ttlSec: number,
  loader: () => Promise<T>
): Promise<T> {
  let key: string | null = null;
  try {
    key = `c:${entity}:${await version(entity)}:${suffix}`;
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch {
    key = null; // Redis unavailable — serve from the DB.
  }

  const value = await loader();

  if (key !== null) {
    // Fire-and-forget; a failed SET must not fail the request.
    redis.set(key, JSON.stringify(value), "EX", ttlSec).catch(() => {});
  }
  return value;
}

/** Invalidate every cached read of an entity (O(1)). */
export function bump(...entities: string[]): void {
  for (const entity of entities) {
    redis.incr(`v:${entity}`).catch(() => {});
  }
}
