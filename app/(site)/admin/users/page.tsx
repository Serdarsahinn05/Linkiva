import { Search } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Input } from "@/components/ui/field";
import { findUsers } from "@/features/admin/queries";
import { audit, requireStaffPage } from "@/lib/admin";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const staff = await requireStaffPage("ADMIN");
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.slice(0, 120) : "";
  const t = await getTranslations("admin.users");
  const tr = await getTranslations("admin.roles");
  const format = await getFormatter();
  const users = await findUsers(q);

  // Looking someone up by email is personal data use: it is logged (the account found, never the address typed).
  if (q.includes("@")) {
    const found = users[0];
    await audit(staff, { action: "userLookup", target: found ? { type: "user", id: found.id, label: found.username ? `@${found.username}` : found.id } : undefined, meta: { found: users.length } });
  }

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-4 py-4 sm:px-8 md:py-10">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] lg:text-[2.5rem]">{t("title")}</h1>
      <form role="search" className="relative">
        <Search size={18} strokeWidth={1.75} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input name="q" defaultValue={q} aria-label={t("search")} placeholder={t("search")} autoCapitalize="none" spellCheck={false} className="pl-10" />
      </form>
      <p className="-mt-3 px-1 text-sm text-ink-3">{t("searchHint")}</p>

      {users.length === 0 ? (
        <p className="glass-flat rounded-[var(--radius-card)] px-5 py-10 text-center text-ink-2">{t("empty")}</p>
      ) : (
        <ol className="glass flex flex-col rounded-[var(--radius-card)] px-2">
          {users.map((u) => (
            <li key={u.id} className="border-t border-glass-edge first:border-t-0">
              <Link href={`/admin/users/${u.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-control)] px-3 py-3.5 transition-colors hover:bg-glass">
                <span className="font-medium">{u.username ? `@${u.username}` : t("noPage")}</span>
                {u.role !== "USER" && <span className="rounded-full border border-glass-edge px-2 text-xs text-ink-2">{tr(u.role)}</span>}
                {u.suspended && <span className="text-sm text-negative">{t("suspended")}</span>}
                {u.leaving && <span className="text-sm text-ink-3">{t("leaving")}</span>}
                <time dateTime={u.createdAt} className="ml-auto text-sm text-ink-3">
                  {format.dateTime(new Date(u.createdAt), { dateStyle: "medium" })}
                </time>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
