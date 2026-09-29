import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Overview figures: counts only, never anyone's content or contact details. */
export async function getOverview(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const [pages, published, newThisWeek, pendingDeletions, recent] = await Promise.all([
    db.profile.count(),
    db.profile.count({ where: { isPublished: true } }),
    db.profile.count({ where: { createdAt: { gte: weekAgo } } }),
    db.accountDeletion.count(),
    db.adminAudit.findMany({ orderBy: { id: "desc" }, take: 8, select: { id: true, at: true, actorLabel: true, action: true, targetLabel: true } }),
  ]);
  return { pages, published, newThisWeek, pendingDeletions, recent: recent.map((r) => ({ ...r, id: r.id.toString(), at: r.at.toISOString() })) };
}

export type AuditRow = Awaited<ReturnType<typeof getOverview>>["recent"][number];
