type Scheduled = { startsAt: string | null; endsAt: string | null };

/** Scheduled blocks are filtered at render time, so a cached profile still respects the clock. */
export function isLive(block: Scheduled, now = Date.now()): boolean {
  if (block.startsAt && Date.parse(block.startsAt) > now) return false;
  if (block.endsAt && Date.parse(block.endsAt) <= now) return false;
  return true;
}

/** Blocks visible right now (request time). */
export function liveBlocks<T extends Scheduled>(blocks: T[]): T[] {
  const now = Date.now();
  return blocks.filter((b) => isLive(b, now));
}
