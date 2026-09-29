"use client";

import { ArrowLeft, Flag, LayoutGrid, ScrollText, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { StaffRole } from "@/lib/admin";
import { StepUp } from "./step-up";

type NavItem = { href: "/admin" | "/admin/reports" | "/admin/users" | "/admin/audit"; key: "overview" | "reports" | "users" | "audit"; icon: LucideIcon; adminOnly?: boolean };
const NAV: NavItem[] = [
  { href: "/admin", key: "overview", icon: LayoutGrid },
  { href: "/admin/reports", key: "reports", icon: Flag },
  // Hidden from moderators; the pages check the role themselves.
  { href: "/admin/users", key: "users", icon: Users, adminOnly: true },
  { href: "/admin/audit", key: "audit", icon: ScrollText, adminOnly: true },
];

/**
 * The admin panel's frame. It says "Yönetim" everywhere it can, so it is never mistaken for one's own dashboard;
 * the step-up state sits where the eye returns to before any sensitive act.
 */
export function AdminShell({ role, stepUpUntil, openReports, children }: { role: StaffRole; stepUpUntil: string | null; openReports: number; children: ReactNode }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const nav = (
    <ul className="flex gap-1 md:flex-col">
      {NAV.filter((item) => !item.adminOnly || role === "ADMIN").map(({ href, key, icon: Icon }) => {
        // A report's own page keeps "Reports" lit.
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-full px-4 font-medium whitespace-nowrap transition-colors duration-150",
                active ? "bg-glass-strong text-ink shadow-[inset_0_1px_0_var(--c-glass-shine)]" : "text-ink-2 hover:bg-glass hover:text-ink",
              )}
            >
              <Icon size={19} strokeWidth={1.75} aria-hidden />
              {t(`nav.${key}`)}
              {key === "reports" && openReports > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 py-0.5 font-mono text-xs text-accent-ink tabular-nums">
                  {openReports}
                  <span className="sr-only"> {t("reports.openCount")}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh p-3 md:block">
        <div className="glass flex h-full flex-col gap-6 rounded-[var(--radius-card)] p-4">
          <div className="flex flex-col gap-3">
            <Wordmark className="self-start" />
            <div className="flex items-baseline justify-between gap-2 px-1">
              <span className="text-lg font-semibold tracking-[-0.02em]">{t("title")}</span>
              <span className="text-xs text-ink-3">{t(`roles.${role}`)}</span>
            </div>
          </div>
          <nav aria-label={t("title")}>{nav}</nav>
          <div className="mt-auto flex flex-col gap-3">
            <StepUp until={stepUpUntil} />
            <Link href="/dashboard" className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-glass hover:text-ink">
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
              {t("back")}
            </Link>
          </div>
        </div>
      </aside>

      {/* Narrow screens: the same parts, stacked at the top. */}
      <header className="flex flex-col gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-[-0.02em]">{t("title")}</span>
            <span className="text-xs text-ink-3">{t(`roles.${role}`)}</span>
          </span>
          <Link href="/dashboard" aria-label={t("back")} className="glass flex size-11 items-center justify-center rounded-full text-ink">
            <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
        <nav aria-label={t("title")} className="-mx-1 overflow-x-auto px-1">
          {nav}
        </nav>
        <StepUp until={stepUpUntil} className="self-start" />
      </header>

      <main id="main" className="min-w-0 pb-16">
        {children}
      </main>
    </div>
  );
}
