import type { ReportReason, ReportStatus } from "@/prisma/generated/enums";
import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Overview figures: counts only, never anyone's content or contact details. */
export async function getOverview(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const [pages, published, newThisWeek, openReports, recent] = await Promise.all([
    db.profile.count(),
    db.profile.count({ where: { isPublished: true } }),
    db.profile.count({ where: { createdAt: { gte: weekAgo } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.adminAudit.findMany({ orderBy: { id: "desc" }, take: 8, select: { id: true, at: true, actorLabel: true, action: true, targetLabel: true } }),
  ]);
  return { pages, published, newThisWeek, openReports, recent: recent.map((r) => ({ ...r, id: r.id.toString(), at: r.at.toISOString() })) };
}

export type AuditRow = Awaited<ReturnType<typeof getOverview>>["recent"][number];

export const countOpenReports = () => db.report.count({ where: { status: "OPEN" } });

export type ReportListRow = {
  id: string;
  reason: ReportReason;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  username: string;
  onBlock: boolean;
  /** Open reports about the same page (the queue shows how loud a page is). */
  openOnPage: number;
};

/** The queue: open reports oldest first, or the latest resolved ones. */
export async function listReports(view: "open" | "resolved"): Promise<ReportListRow[]> {
  const rows = await db.report.findMany({
    where: view === "open" ? { status: "OPEN" } : { status: { not: "OPEN" } },
    orderBy: view === "open" ? { createdAt: "asc" } : { resolvedAt: "desc" },
    take: 100,
    select: { id: true, reason: true, status: true, createdAt: true, resolvedAt: true, blockId: true, profileId: true, profile: { select: { username: true } } },
  });
  const counts = await db.report.groupBy({ by: ["profileId"], where: { status: "OPEN", profileId: { in: [...new Set(rows.map((r) => r.profileId))] } }, _count: true });
  const open = new Map(counts.map((c) => [c.profileId, c._count]));
  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    username: r.profile.username,
    onBlock: r.blockId !== null,
    openOnPage: open.get(r.profileId) ?? 0,
  }));
}

/** One report with what staff need to judge it: the page as visitors see it, the block, the page's other reports. */
export async function getReport(id: string) {
  const report = await db.report.findUnique({
    where: { id },
    select: {
      id: true,
      reason: true,
      details: true,
      email: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      block: { select: { id: true, type: true, data: true, isVisible: true } },
      profile: {
        select: {
          id: true,
          username: true,
          isPublished: true,
          createdAt: true,
          reports: { where: { id: { not: id } }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, reason: true, status: true, createdAt: true } },
        },
      },
    },
  });
  if (!report) return null;
  return {
    ...report,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
    profile: {
      ...report.profile,
      createdAt: report.profile.createdAt.toISOString(),
      reports: report.profile.reports.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    },
  };
}
