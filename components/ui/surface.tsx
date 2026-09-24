import { cn } from "@/lib/cn";

/** The single ambient light behind every page (DESIGN.md §2). Render once per root layout. */
export function Ambient() {
  return <div className="ambient" aria-hidden />;
}

/**
 * SVG filter used as `backdrop-filter: url(#liquid)` by `.glass-float.liquid`: a gentle displacement
 * that bends what is behind floating glass at its edges. Browsers without support ignore it.
 */
export function LiquidFilter() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <filter id="liquid" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="28" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/** "LINKIVA" wordmark: a small glass pill with a lit dot. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span lang="en" translate="no" className={cn("glass inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.9375rem] font-semibold tracking-[-0.01em]", className)}>
      <span aria-hidden className="size-2 rounded-full bg-ink shadow-[0_0_10px_var(--c-ink)]" />
      Linkiva
    </span>
  );
}
