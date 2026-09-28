import { asLocale } from "@/features/digest/format";
import { db } from "@/lib/db";
import { probeUrl, type Probe } from "@/lib/link-preview";
import { sendBatch, type OutgoingMail } from "@/lib/mail/send";
import { renderBrokenLinks } from "@/lib/mail/templates";
import { displayHost } from "@/lib/validation/url";
import { parseBlock, type ParsedBlock } from "@/lib/validation/blocks";
import { Prisma } from "@/prisma/generated/client";
import type { LinkStatus } from "@/prisma/generated/enums";
import { BROKEN_AFTER, CHECKED_TYPES, checkableUrl } from "./targets";

/** Blocks tried per daily run, least recently checked first; the rest wait for the following days. */
export const LINK_CHECK_BATCH = 120;
/** Requests in flight at once (each is capped at 8 s, so a run stays well inside the cron's time limit). */
const PARALLEL = 20;
/** A block is tried at most once in this window, even if the cron runs twice. */
const RECHECK_AFTER_MS = 20 * 60 * 60 * 1000;

export type LinkCheckRun = { checked: number; ok: number; broken: number; skipped: number; mailed: number };

const label = (block: ParsedBlock, url: string) => {
  const data = block.data as { title?: string; name?: string; urlLabel?: string };
  return data.title || data.urlLabel || data.name || displayHost(url);
};

/**
 * The daily broken link check, called by the cron. Every destination goes through lib/link-preview.ts (SSRF guard: a
 * private address is never contacted). Only the result of a real request is stored as ok/broken; a block whose
 * destination changed starts over. After BROKEN_AFTER failures in a row, its owner gets one mail (claimed with a
 * conditional update first, so overlapping runs cannot mail twice; released again when the send fails).
 */
export async function runLinkCheck({
  now = new Date(),
  profileIds,
  probe = probeUrl,
}: { now?: Date; profileIds?: string[]; probe?: (url: string) => Promise<Probe> } = {}): Promise<LinkCheckRun> {
  const due = new Date(now.getTime() - RECHECK_AFTER_MS);
  // profileIds narrows a run to some profiles (integration tests share the local database).
  const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT b.id FROM "block" b
    JOIN "profile" p ON p.id = b."profileId"
    LEFT JOIN "link_check" c ON c."blockId" = b.id
    WHERE b.type::text IN (${Prisma.join(CHECKED_TYPES)}) AND b."isVisible" AND p."isPublished"
      AND (c."checkedAt" IS NULL OR c."checkedAt" < ${due})
      ${profileIds ? Prisma.sql`AND p.id IN (${Prisma.join(profileIds)})` : Prisma.empty}
    ORDER BY c."checkedAt" ASC NULLS FIRST
    LIMIT ${LINK_CHECK_BATCH}`);
  const blocks = await db.block.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: { id: true, type: true, data: true, linkCheck: true },
  });

  const run: LinkCheckRun = { checked: 0, ok: 0, broken: 0, skipped: 0, mailed: 0 };
  for (let i = 0; i < blocks.length; i += PARALLEL) {
    await Promise.all(
      blocks.slice(i, i + PARALLEL).map(async (block) => {
        const parsed = parseBlock(block.type, block.data);
        const url = parsed ? checkableUrl(parsed) : null;
        const { outcome } = url ? await probe(url) : { outcome: "skipped" as const };
        // The previous result only carries over while the destination is the same.
        const previous = block.linkCheck && block.linkCheck.url === (url ?? "") ? block.linkCheck : null;
        const next: { status: LinkStatus | null; failCount: number; notifiedAt: Date | null } =
          outcome === "ok"
            ? { status: "OK", failCount: 0, notifiedAt: null }
            : outcome === "broken"
              ? { status: "BROKEN", failCount: (previous?.status === "BROKEN" ? previous.failCount : 0) + 1, notifiedAt: previous?.notifiedAt ?? null }
              : { status: previous?.status ?? null, failCount: previous?.failCount ?? 0, notifiedAt: previous?.notifiedAt ?? null };
        const data = { url: url ?? "", checkedAt: now, ...next };
        await db.linkCheck.upsert({ where: { blockId: block.id }, create: { blockId: block.id, ...data }, update: data });
        run.checked++;
        run[outcome]++;
      }),
    );
  }

  run.mailed = await notifyOwners(now, profileIds);
  return run;
}

/** One mail per owner listing the links that just crossed the threshold. Returns the number of mails sent. */
async function notifyOwners(now: Date, profileIds?: string[]): Promise<number> {
  const pending = await db.linkCheck.findMany({
    where: {
      status: "BROKEN",
      failCount: { gte: BROKEN_AFTER },
      notifiedAt: null,
      block: { isVisible: true, profile: { isPublished: true, user: { emailVerified: true }, ...(profileIds ? { id: { in: profileIds } } : {}) } },
    },
    select: { blockId: true, url: true, block: { select: { type: true, data: true, profileId: true, profile: { select: { locale: true, user: { select: { email: true } } } } } } },
    take: 500,
  });

  const byProfile = new Map<string, { email: string; locale: string; links: { title: string; url: string }[]; blockIds: string[] }>();
  for (const check of pending) {
    const { count } = await db.linkCheck.updateMany({ where: { blockId: check.blockId, notifiedAt: null }, data: { notifiedAt: now } });
    if (count === 0) continue; // another run claimed it
    const parsed = parseBlock(check.block.type, check.block.data);
    const entry = byProfile.get(check.block.profileId) ?? { email: check.block.profile.user.email, locale: check.block.profile.locale, links: [], blockIds: [] };
    entry.links.push({ title: parsed ? label(parsed, check.url) : displayHost(check.url), url: check.url });
    entry.blockIds.push(check.blockId);
    byProfile.set(check.block.profileId, entry);
  }

  const owners = [...byProfile.values()];
  let sent = 0;
  for (let i = 0; i < owners.length; i += 100) {
    const chunk = owners.slice(i, i + 100);
    const mails: OutgoingMail[] = chunk.map((o) => ({ ...renderBrokenLinks(asLocale(o.locale), o.links), to: o.email }));
    try {
      await sendBatch("brokenLinks", mails);
      sent += mails.length;
    } catch (error) {
      await db.linkCheck.updateMany({ where: { blockId: { in: chunk.flatMap((o) => o.blockIds) }, notifiedAt: now }, data: { notifiedAt: null } });
      console.error("[link-check] notification batch failed", error);
    }
  }
  return sent;
}
