"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tip = { name: string; views?: string; share?: string };

/**
 * Glass card that follows the pointer over the world map. One delegated listener reads the hovered
 * country's data attributes; the card is positioned imperatively (no re-render per move) and
 * fades and scales in. Touch works too: a tap is a pointer move.
 */
export function MapHover({ children, labels }: { children: ReactNode; labels: { views: string; none: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const active = useRef<Element | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [visible, setVisible] = useState(false);

  function place(clientX: number, clientY: number) {
    const box = root.current?.getBoundingClientRect();
    const el = card.current;
    if (!box || !el) return;
    const gap = 14;
    let x = clientX - box.left + gap;
    let y = clientY - box.top - el.offsetHeight - gap;
    if (x + el.offsetWidth > box.width) x = clientX - box.left - el.offsetWidth - gap;
    if (y < 0) y = clientY - box.top + gap;
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }

  function hide() {
    active.current?.removeAttribute("data-active");
    active.current = null;
    setVisible(false);
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const path = (e.target as Element).closest("path[data-name]");
    if (!(path instanceof SVGElement)) return hide();
    if (path !== active.current) {
      active.current?.removeAttribute("data-active");
      path.setAttribute("data-active", "");
      active.current = path;
      const { name = "", views, share } = path.dataset;
      setTip({ name, views, share });
      setVisible(true);
    }
    place(e.clientX, e.clientY);
  }

  return (
    <div ref={root} className="relative" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={hide}>
      {children}
      <div
        ref={card}
        aria-hidden
        className={cn(
          "glass-float pointer-events-none absolute top-0 left-0 z-10 flex min-w-40 flex-col gap-1.5 rounded-[var(--radius-control)] px-3.5 py-3",
          "transition-[opacity,scale] duration-200 ease-sheet motion-reduce:transition-none",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {tip && (
          <>
            <span className="text-sm font-semibold text-ink">{tip.name}</span>
            {tip.views ? (
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-lg leading-none text-ink tabular-nums">{tip.views}</span>
                <span className="text-xs text-ink-2">{labels.views}</span>
                <span className="neon ml-auto rounded-full px-1.5 py-0.5 font-mono text-xs text-info tabular-nums">{tip.share}</span>
              </span>
            ) : (
              <span className="text-xs text-ink-2">{labels.none}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
