import { getFormatter, getTranslations } from "next-intl/server";
import { isAuditAction } from "@/features/admin/audit-actions";
import { getOverview } from "@/features/admin/queries";
import { requireStaffPage } from "@/lib/admin";

export default async function AdminOverviewPage() {
  // The layout checks too; each page checks again so a page never relies on where it is mounted.
  await requireStaffPage();
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const data = await getOverview();

  const figures = [
    { key: "openReports", value: data.openReports },
    { key: "pages", value: data.pages },
    { key: "published", value: data.published },
    { key: "newThisWeek", value: data.newThisWeek },
  ] as const;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-4 sm:px-8 md:py-10">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] lg:text-[2.5rem]">{t("nav.overview")}</h1>

      <dl className="glass grid grid-cols-2 rounded-[var(--radius-card)] sm:grid-cols-4">
        {figures.map(({ key, value }, i) => (
          <div key={key} className={i > 0 ? "border-glass-edge p-5 max-sm:odd:border-t sm:border-l max-sm:even:border-l" : "p-5"}>
            <dt className="text-sm text-ink-2">{t(`overview.${key}`)}</dt>
            <dd className="mt-1 font-mono text-[1.75rem] font-medium tracking-[-0.02em] tabular-nums">{format.number(value)}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <h2 id="recent-heading" className="px-1 text-[0.9375rem] font-semibold text-ink-2">
          {t("overview.recent")}
        </h2>
        {data.recent.length === 0 ? (
          <p className="glass-flat rounded-[var(--radius-card)] px-5 py-8 text-center text-ink-2">{t("overview.recentEmpty")}</p>
        ) : (
          <ol className="glass flex flex-col rounded-[var(--radius-card)] px-5">
            {data.recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-glass-edge py-3 first:border-t-0">
                <span className="font-medium">{isAuditAction(row.action) ? t(`audit.${row.action}`) : row.action}</span>
                {row.targetLabel && <span className="text-ink-2">{row.targetLabel}</span>}
                <span className="ml-auto flex items-baseline gap-3 text-sm text-ink-3">
                  <span>{row.actorLabel}</span>
                  <time dateTime={row.at}>{format.dateTime(new Date(row.at), { dateStyle: "medium", timeStyle: "short" })}</time>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
