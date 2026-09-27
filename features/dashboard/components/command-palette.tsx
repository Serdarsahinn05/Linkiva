"use client";

import { ArrowDownToLine, BarChart3, Copy, ExternalLink, Palette, Plus, QrCode, Search, Settings, Users, Link2, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { profileUrl } from "@/lib/site";
import { EDITABLE_BLOCK_TYPES } from "@/lib/validation/blocks";

type Command = { id: string; group: "add" | "go" | "page"; label: string; icon: LucideIcon; run: () => void };

/**
 * ⌘K / Ctrl+K on desktop (DESIGN.md §6): add any block, jump to a page, share. Keyboard first: type to filter,
 * arrows to move, Enter to run. Block commands go through /dashboard?add=<type>, so they work from every page.
 */
export function CommandPalette({
  username,
  domain,
  open,
  onOpenChange,
  onShare,
}: {
  username: string;
  domain: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // ⌘K / Ctrl+K toggles it anywhere in the dashboard.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const commands = useMemo<Command[]>(() => {
    const go = (href: Parameters<typeof router.push>[0]) => () => router.push(href);
    return [
      ...EDITABLE_BLOCK_TYPES.map((type) => ({
        id: `add-${type}`,
        group: "add" as const,
        label: t("editor.addBlock", { type: t(`editor.types.${type}`) }),
        icon: Plus,
        run: go(`/dashboard?add=${type}`),
      })),
      { id: "import", group: "add", label: t("import.open"), icon: ArrowDownToLine, run: go("/dashboard?import=1") },
      { id: "go-links", group: "go", label: t("nav.links"), icon: Link2, run: go("/dashboard") },
      { id: "go-appearance", group: "go", label: t("nav.appearance"), icon: Palette, run: go("/dashboard/appearance") },
      { id: "go-analytics", group: "go", label: t("nav.analytics"), icon: BarChart3, run: go("/dashboard/analytics") },
      { id: "go-audience", group: "go", label: t("nav.audience"), icon: Users, run: go("/dashboard/audience") },
      { id: "go-settings", group: "go", label: t("nav.settings"), icon: Settings, run: go("/dashboard/settings") },
      { id: "open", group: "page", label: t("palette.openPage"), icon: ExternalLink, run: () => window.open(profileUrl(username, domain), "_blank", "noopener") },
      {
        id: "copy",
        group: "page",
        label: t("palette.copyAddress"),
        icon: Copy,
        run: () => {
          void navigator.clipboard.writeText(profileUrl(username, domain)).then(() => toast({ tone: "success", message: t("palette.copied") }));
        },
      },
      { id: "share", group: "page", label: t("palette.share"), icon: QrCode, run: onShare },
    ];
  }, [t, router, username, domain, toast, onShare]);

  const needle = query.trim().toLocaleLowerCase(locale);
  const shown = needle ? commands.filter((c) => c.label.toLocaleLowerCase(locale).includes(needle)) : commands;
  const current = Math.min(active, Math.max(shown.length - 1, 0));

  function close() {
    onOpenChange(false);
    setQuery("");
    setActive(0);
  }

  function run(command: Command | undefined) {
    if (!command) return;
    close();
    command.run();
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <Dialog open={open} onClose={close} title={t("palette.title")} closeLabel={t("import.close")} className="max-w-lg">
      <div className="flex flex-col">
        <div className="relative border-b border-glass-edge">
          <Search size={18} strokeWidth={1.75} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            data-autofocus
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={shown[current] ? `palette-${shown[current].id}` : undefined}
            aria-label={t("palette.placeholder")}
            placeholder={t("palette.placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => (i + 1) % Math.max(shown.length, 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => (i - 1 + shown.length) % Math.max(shown.length, 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(shown[current]);
              }
            }}
            className="h-12 w-full bg-transparent pr-5 pl-12 text-[0.9375rem] outline-none placeholder:text-ink-3"
          />
        </div>
        <ul ref={listRef} id="palette-list" role="listbox" aria-label={t("palette.title")} className="max-h-[min(60dvh,420px)] overflow-y-auto p-2">
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-3">{t("palette.empty")}</li>}
          {shown.map((command, index) => {
            const Icon = command.icon;
            return (
              <li
                key={command.id}
                id={`palette-${command.id}`}
                data-index={index}
                role="option"
                aria-selected={index === current}
                onMouseMove={() => setActive(index)}
                onClick={() => run(command)}
                className={cn("flex h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.9375rem]", index === current ? "bg-glass-strong text-ink" : "text-ink-2")}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden className="shrink-0" />
                <span className="truncate">{command.label}</span>
                {index === 0 && !needle && <kbd className="ml-auto font-mono text-xs text-ink-3">↵</kbd>}
              </li>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}
