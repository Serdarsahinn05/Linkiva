"use client";

import { useEffect } from "react";

/**
 * One delegated listener for the whole page: writes the pointer position into --mx/--my on the
 * `.glass-interactive` element under the pointer. CSS draws the highlight; React never re-renders.
 */
export function Specular() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.<HTMLElement>(".glass-interactive");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      el.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
