import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { listReports } from "@/features/admin/queries";
import { requireStaffPage } from "@/lib/admin";
import { cn } from "@/lib/cn";

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireStaffPage();
  const view = (await searchParams).view === "resolved" ? "resolved" : "open";
  const t = await getTranslations("admin.reports");
  const tr = await getTranslations("report.reasons");
  const format = await getFormatter();
  const rows = await listReports(view);
  const now = new Date();

  const tab = (value: "open" | "resolved") => (
    <Link
      href={value === "open" ? "/admin/reports" : "/admin/reports?view=resolved"}
      aria-current={view === value ? "page" : undefined}
      className={cn(
        "flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
        view === value ? "bg-glass-strong text-ink shadow-[inset_0_1px_0_var(--c-glass-shine)]" : "text-ink-2 hover:bg-glass hover:text-ink",
      )}
    >
      {t(value)}
    </Link>
  );

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-4 py-4 sm:px-8 md:py-10">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] lg:text-[2.5rem]">{t("title")}</h1>
      <nav aria-label={t("title")} className="glass-flat flex self-start rounded-full p-1">
        {tab("open")}
        {tab("resolved")}
      </nav>

      {rows.length === 0 ? (
        <p className="glass-flat rounded-[var(--radius-card)] px-5 py-10 text-center text-ink-2">{view === "open" ? t("emptyOpen") : t("emptyResolved")}</p>
      ) : (
        <ol className="glass flex flex-col rounded-[var(--radius-card)] px-2">
          {rows.map((row) => (
            <li key={row.id} className="border-t border-glass-edge first:border-t-0">
              <Link
                href={`/admin/reports/${row.id}`}
                className="-mx-0 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-control)] px-3 py-3.5 transition-colors hover:bg-glass focus-visible:outline-2 focus-visible:outline-ink"
              >
                <span className="min-w-0 font-medium">@{row.username}</span>
                <span className="text-ink-2">{tr(`${row.reason}.label`)}</span>
                {row.onBlock && <span className="rounded-full border border-glass-edge px-2 text-xs text-ink-2">{t("onBlock")}</span>}
                <span className="ml-auto flex items-center gap-3 text-sm text-ink-3">
                  {view === "open" && row.openOnPage > 1 && <span className="font-medium text-negative">{t("openOnPage", { count: row.openOnPage })}</span>}
                  {view === "resolved" && <span>{t(`status.${row.status}`)}</span>}
                  <time dateTime={row.resolvedAt ?? row.createdAt}>{format.relativeTime(new Date(row.resolvedAt ?? row.createdAt), now)}</time>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
