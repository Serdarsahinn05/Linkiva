import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AUDIT_ACTIONS, isAuditAction } from "@/features/admin/audit-actions";
import { listAudit } from "@/features/admin/queries";
import { requireStaffPage } from "@/lib/admin";
import { cn } from "@/lib/cn";

// Admins only: the log is where staff themselves are held to account. Read-only; the database refuses edits anyway.
export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireStaffPage("ADMIN");
  const params = await searchParams;
  const action = typeof params.action === "string" && isAuditAction(params.action) ? params.action : undefined;
  const before = typeof params.before === "string" ? params.before : undefined;
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const { rows, next } = await listAudit({ action, before });

  const filter = (value?: string) => ({ pathname: "/admin/audit" as const, query: value ? { action: value } : {} });
  const describe = (meta: Record<string, unknown>) =>
    typeof meta.from === "string" && typeof meta.to === "string" ? `${meta.from} → ${meta.to}` : typeof meta.found === "number" ? t("auditLog.found", { count: meta.found }) : null;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-4 sm:px-8 md:py-10">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] lg:text-[2.5rem]">{t("nav.audit")}</h1>
      <nav aria-label={t("auditLog.filter")} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {[undefined, ...AUDIT_ACTIONS].map((value) => (
          <Link
            key={value ?? "all"}
            href={filter(value)}
            aria-current={action === value ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm whitespace-nowrap transition-colors",
              action === value ? "bg-glass-strong font-medium text-ink shadow-[inset_0_1px_0_var(--c-glass-shine)]" : "text-ink-2 hover:bg-glass hover:text-ink",
            )}
          >
            {value ? t(`audit.${value}`) : t("auditLog.all")}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="glass-flat rounded-[var(--radius-card)] px-5 py-10 text-center text-ink-2">{t("overview.recentEmpty")}</p>
      ) : (
        <ol className="glass flex flex-col rounded-[var(--radius-card)] px-5">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 border-t border-glass-edge py-3 first:border-t-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium">{isAuditAction(row.action) ? t(`audit.${row.action}`) : row.action}</span>
                {row.targetLabel && <span className="text-ink-2">{row.targetLabel}</span>}
                {describe(row.meta) && <span className="font-mono text-sm text-ink-2">{describe(row.meta)}</span>}
                <span className="ml-auto flex items-baseline gap-3 text-sm text-ink-3">
                  <span>{row.actorLabel}</span>
                  <time dateTime={row.at}>{format.dateTime(new Date(row.at), { dateStyle: "medium", timeStyle: "medium" })}</time>
                </span>
              </div>
              {row.reason && <p className="text-sm whitespace-pre-wrap text-ink-2">{row.reason}</p>}
            </li>
          ))}
        </ol>
      )}

      {next && (
        <Link href={{ pathname: "/admin/audit", query: { ...(action ? { action } : {}), before: next } }} className="self-center text-sm font-medium underline underline-offset-4">
          {t("auditLog.older")}
        </Link>
      )}
    </div>
  );
}
