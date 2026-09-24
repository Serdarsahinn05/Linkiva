"use client";

import { Link2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ToastProvider } from "@/components/ui/toast";
import { Wordmark } from "@/components/ui/tape";
import { LogoutButton } from "@/features/account/components/logout-button";
import { cn } from "@/lib/cn";
import { SharePanel } from "./share-panel";

// Sections appear here as their phases land (appearance: 3, analytics: 4, settings: 5).
const NAV = [{ href: "/dashboard", key: "links", icon: Link2 }] as const;

export function DashboardShell({ username, children }: { username: string; children: ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
        {/* Desktop rail */}
        <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-hairline bg-panel px-4 py-5 lg:flex">
          <Link href="/dashboard" className="self-start">
            <Wordmark />
          </Link>
          <nav aria-label={t("main")}>
            <ul className="flex flex-col gap-1">
              {NAV.map(({ href, key, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-11 items-center gap-3 rounded-[var(--radius-panel)] px-3 font-medium hover:bg-ground",
                        active ? "text-ink" : "text-ink-2",
                      )}
                    >
                      {/* Active marker: a small red tape stub (DESIGN.md §6). */}
                      {active && <span aria-hidden className="tape absolute top-1/2 -left-4 h-4 min-h-0 w-2.5 -translate-y-1/2 p-0" data-tone="red" />}
                      <Icon size={20} strokeWidth={1.75} aria-hidden />
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-4">
            <SharePanel username={username} />
            <LogoutButton />
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-panel/95 px-4 py-2 backdrop-blur-sm lg:hidden">
          <Link href="/dashboard">
            <Wordmark />
          </Link>
          <LogoutButton />
        </header>

        <div className="min-w-0 pb-20 lg:pb-0">{children}</div>
      </div>
    </ToastProvider>
  );
}
