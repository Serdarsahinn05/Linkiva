"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MenuItem = { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean };

/** Overflow menu: Esc and outside click close it, arrow keys move between items, focus returns to the trigger. */
export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const nodes = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
    nodes[(index + (e.key === "ArrowDown" ? 1 : -1) + nodes.length) % nodes.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 items-center justify-center rounded-[var(--radius-panel)] text-ink-2 hover:bg-ground hover:text-ink"
      >
        <MoreHorizontal size={20} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 min-w-52 rounded-[var(--radius-panel)] border border-hairline bg-panel py-1 shadow-[var(--shadow-pop)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 px-3 text-left text-[0.9375rem] hover:bg-ground focus-visible:bg-ground focus-visible:outline-none disabled:opacity-45",
                item.danger ? "text-danger" : "text-ink",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
