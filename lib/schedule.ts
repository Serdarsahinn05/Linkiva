type Scheduled = { startsAt: string | null; endsAt: string | null };

/** Scheduled blocks are filtered at render time, so a cached profile still respects the clock. */
export function isLive(block: Scheduled, now = Date.now()): boolean {
  if (block.startsAt && Date.parse(block.startsAt) > now) return false;
  if (block.endsAt && Date.parse(block.endsAt) <= now) return false;
  return true;
}

/** A countdown set to disappear when it ends has ended. */
function countdownOver(block: { type?: string; data?: unknown }, now: number): boolean {
  if (block.type !== "COUNTDOWN" || typeof block.data !== "object" || block.data === null) return false;
  const { target, after } = block.data as { target?: unknown; after?: unknown }; // Block.data is JSON; only these two fields are read.
  return (after ?? "hide") === "hide" && typeof target === "string" && Date.parse(target) <= now;
}

/** Blocks visible right now (request time). */
export function liveBlocks<T extends Scheduled & { type?: string; data?: unknown }>(blocks: T[]): T[] {
  const now = Date.now();
  return blocks.filter((b) => isLive(b, now) && !countdownOver(b, now));
}
