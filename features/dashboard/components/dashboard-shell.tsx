"use client";

import { BarChart3, Eye, Link2, Palette, Settings, Share2, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Wordmark } from "@/components/ui/surface";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/features/account/components/logout-button";
import { PreviewProvider, usePreview } from "./preview-context";
import { SharePanel } from "./share-panel";

type NavKey = "links" | "appearance" | "analytics" | "audience" | "settings";
type NavItem = { href: "/dashboard" | "/dashboard/appearance" | "/dashboard/analytics" | "/dashboard/audience" | "/dashboard/settings"; key: NavKey; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/dashboard", key: "links", icon: Link2 },
  { href: "/dashboard/appearance", key: "appearance", icon: Palette },
  { href: "/dashboard/analytics", key: "analytics", icon: BarChart3 },
  { href: "/dashboard/settings", key: "settings", icon: Settings },
];

// The mobile tab bar keeps Instagram's five slots; Audience is reached from the sidebar (desktop) and the Email block.
const SIDEBAR: NavItem[] = [...NAV.slice(0, 3), { href: "/dashboard/audience", key: "audience", icon: Users }, NAV[3]!];

export function DashboardShell({ username, children }: { username: string; children: ReactNode }) {
  return (
    <ToastProvider>
      <PreviewProvider>
        <ShellFrame username={username}>{children}</ShellFrame>
      </PreviewProvider>
    </ToastProvider>
  );
}

function ShellFrame({ username, children }: { username: string; children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const livePreview = usePreview();
  const activeIndex = NAV.findIndex((item) => item.href === pathname);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop: glass sidebar */}
      <aside className="sticky top-0 hidden h-dvh p-3 lg:block">
        <div className="glass flex h-full flex-col gap-8 rounded-[var(--radius-card)] p-4">
          <Link href="/dashboard" className="self-start">
            <Wordmark />
          </Link>
          <nav aria-label={t("nav.main")}>
            <ul className="flex flex-col gap-1">
              {SIDEBAR.map(({ href, key, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-full px-4 font-medium transition-colors duration-150",
                        active ? "bg-glass-strong text-ink shadow-[inset_0_1px_0_var(--c-glass-shine)]" : "text-ink-2 hover:bg-glass hover:text-ink",
                      )}
                    >
                      <Icon size={19} strokeWidth={1.75} aria-hidden />
                      {t(`nav.${key}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <SharePanel username={username} />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Mobile: top bar */}
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 lg:hidden">
        <Link href="/dashboard">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label={t("share.share")}
          className="glass flex size-11 items-center justify-center rounded-full text-ink"
        >
          <Share2 size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </header>

      <div className="min-w-0 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>

      {/* Mobile: Instagram-style floating glass tab bar with a liquid active indicator. */}
      <nav
        aria-label={t("nav.main")}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
      >
        <div className="glass-float liquid relative grid h-16 grid-cols-5 items-center rounded-full px-1.5">
          {activeIndex >= 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/5)] rounded-full bg-glass-strong shadow-[inset_0_1px_0_var(--c-glass-shine),0_4px_14px_-6px_rgb(0_0_0/0.35)] transition-transform duration-500 ease-[var(--ease-sheet)]"
              style={{ transform: `translateX(${(activeIndex >= 2 ? activeIndex + 1 : activeIndex) * 100}%)` }}
            />
          )}
          {NAV.slice(0, 2).map((item) => (
            <TabLink key={item.href} item={item} active={pathname === item.href} label={t(`nav.${item.key}`)} />
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label={t("nav.preview")}
              className="relative flex size-12 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_6px_20px_-6px_rgb(0_0_0/0.5)] transition-transform duration-150 active:scale-95"
            >
              <Eye size={22} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          {NAV.slice(2).map((item) => (
            <TabLink key={item.href} item={item} active={pathname === item.href} label={t(`nav.${item.key}`)} />
          ))}
        </div>
      </nav>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title={t("editor.previewTitle")} closeLabel={t("editor.closePreview")} variant="sheet">
        <div className="h-[80dvh] overflow-y-auto">
          {livePreview ?? <iframe src={`/${username}`} title={t("editor.previewTitle")} className="size-full border-0" />}
        </div>
      </Dialog>
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} title={t("share.share")} closeLabel={t("share.close")} variant="sheet">
        <div className="p-5">
          <SharePanel username={username} />
        </div>
      </Dialog>
    </div>
  );
}

function TabLink({ item, active, label }: { item: NavItem; active: boolean; label: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative z-10 flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] font-medium transition-colors duration-200",
        active ? "text-ink" : "text-ink-3",
      )}
    >
      <Icon size={22} strokeWidth={active ? 2 : 1.75} aria-hidden />
      {label}
    </Link>
  );
}
