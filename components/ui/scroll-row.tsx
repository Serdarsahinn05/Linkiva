"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A single row that scrolls sideways. Touch screens swipe it; with a mouse (no sideways wheel) glass arrows appear on
 * the side that has more to show. The arrows are a mouse convenience only: keyboard focus already scrolls a focused
 * item into view, so they stay out of the tab order and the accessibility tree.
 */
export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ before: false, after: false });

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const update = () =>
      setMore({ before: row.scrollLeft > 1, after: row.scrollLeft + row.clientWidth < row.scrollWidth - 1 });
    update();
    const resize = new ResizeObserver(update);
    resize.observe(row);
    row.addEventListener("scroll", update, { passive: true });
    return () => {
      resize.disconnect();
      row.removeEventListener("scroll", update);
    };
  }, []);

  function go(direction: -1 | 1) {
    const row = ref.current;
    if (!row) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: smooth ? "smooth" : "auto" });
  }

  const arrow = "glass-float absolute top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink hover:bg-glass-strong pointer-fine:flex";

  return (
    <div className="relative">
      {/* A sideways-scrolling box clips vertically too: equal padding keeps focus rings whole, the negative margin
          keeps the layout (and the arrows' centre line) where the buttons are. */}
      <div ref={ref} className={cn("-m-1.5 flex gap-2 overflow-x-auto p-1.5 [scrollbar-width:none]", className)}>
        {children}
      </div>
      {more.before && (
        <button type="button" tabIndex={-1} aria-hidden onClick={() => go(-1)} className={cn(arrow, "left-0")}>
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
      )}
      {more.after && (
        <button type="button" tabIndex={-1} aria-hidden onClick={() => go(1)} className={cn(arrow, "right-0")}>
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
