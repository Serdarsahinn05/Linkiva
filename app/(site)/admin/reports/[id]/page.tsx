import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { profileLabels } from "@/components/blocks/labels";
import { ProfileView } from "@/components/blocks/profile-view";
import { DismissReport } from "@/features/admin/components/dismiss-report";
import { ModerationActions } from "@/features/admin/components/moderation-actions";
import { getReport } from "@/features/admin/queries";
import { getPublicProfile } from "@/features/profile/public";
import { requireStaffPage } from "@/lib/admin";

/** A block's text fields, shown as plain text: staff read what was reported without opening any of its links. */
function blockFields(data: unknown): [string, string][] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.entries(data).filter((e): e is [string, string] => typeof e[1] === "string" && e[1].trim() !== "");
}

export default async function AdminReportPage({ params }: PageProps<"/admin/reports/[id]">) {
  const staff = await requireStaffPage();
  const report = await getReport((await params).id);
  if (!report) notFound();
  const t = await getTranslations("admin.reports");
  const tr = await getTranslations("report.reasons");
  const root = await getTranslations();
  const format = await getFormatter();
  const page = await getPublicProfile(report.profile.username);
  const when = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-4 sm:px-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
        <Link href="/admin/reports" className="flex items-center gap-2 self-start text-sm text-ink-2 hover:text-ink">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          {t("title")}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em]">{tr(`${report.reason}.label`)}</h1>
          <p className="text-ink-2">
            @{report.profile.username} · {when(report.createdAt)}
            {report.status !== "OPEN" && ` · ${t(`status.${report.status}`)}`}
          </p>
        </div>

        <section className="glass flex flex-col gap-4 rounded-[var(--radius-card)] p-5">
          <h2 className="text-[0.9375rem] font-semibold text-ink-2">{t("report")}</h2>
          <p className="whitespace-pre-wrap">{report.details || <span className="text-ink-3">{t("noDetails")}</span>}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-3">{t("reporter")}</dt>
            <dd className="min-w-0 break-all">{report.email ?? t("anonymous")}</dd>
            <dt className="text-ink-3">{t("pageState")}</dt>
            <dd>{report.profile.isPublished ? t("published") : t("unpublished")}</dd>
            <dt className="text-ink-3">{t("pageSince")}</dt>
            <dd>{format.dateTime(new Date(report.profile.createdAt), { dateStyle: "medium" })}</dd>
          </dl>
        </section>

        {report.block && (
          <section className="glass flex flex-col gap-3 rounded-[var(--radius-card)] p-5">
            <h2 className="text-[0.9375rem] font-semibold text-ink-2">
              {t("reportedBlock")} · {root(`editor.types.${report.block.type}`)}
              {!report.block.isVisible && ` · ${t("hidden")}`}
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {blockFields(report.block.data).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-ink-3">{key}</dt>
                  <dd className="min-w-0 font-mono break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {(report.status === "OPEN" || report.profile.suspended) && (
          <section className="flex flex-col gap-3">
            <h2 className="px-1 text-[0.9375rem] font-semibold text-ink-2">{t("decide")}</h2>
            {report.profile.suspended && <p className="px-1 text-sm font-medium text-negative">{t("suspended")}</p>}
            <div className="flex flex-wrap gap-2">
              <ModerationActions
                reportId={report.id}
                profileId={report.profile.id}
                username={report.profile.username}
                open={report.status === "OPEN"}
                hasBlock={report.block !== null}
                suspended={report.profile.suspended}
                stepUpUntil={staff.steppedUpUntil?.toISOString() ?? null}
              />
              {report.status === "OPEN" && <DismissReport id={report.id} />}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-[0.9375rem] font-semibold text-ink-2">{t("otherReports")}</h2>
          {report.profile.reports.length === 0 ? (
            <p className="px-1 text-sm text-ink-3">{t("noOtherReports")}</p>
          ) : (
            <ol className="glass flex flex-col rounded-[var(--radius-card)] px-2">
              {report.profile.reports.map((r) => (
                <li key={r.id} className="border-t border-glass-edge first:border-t-0">
                  <Link href={`/admin/reports/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-control)] px-3 py-3 hover:bg-glass">
                    <span>{tr(`${r.reason}.label`)}</span>
                    <span className="ml-auto flex gap-3 text-sm text-ink-3">
                      <span>{t(`status.${r.status}`)}</span>
                      <time dateTime={r.createdAt}>{when(r.createdAt)}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* The page as its visitors see it (inert preview: no links open, nothing is counted). */}
      <aside aria-label={t("pagePreview")} className="flex flex-col gap-3">
        <h2 className="px-1 text-[0.9375rem] font-semibold text-ink-2">{t("pagePreview")}</h2>
        {page ? (
          <div className="glass rounded-[44px] p-2.5">
            <div className="relative h-[680px] overflow-y-auto overscroll-contain rounded-[36px] bg-bg [scrollbar-width:none]">
              <div className="relative h-full">
                <ProfileView profile={page} mode="preview" labels={profileLabels(root)} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-3">{t("pageGone")}</p>
        )}
      </aside>
    </div>
  );
}
