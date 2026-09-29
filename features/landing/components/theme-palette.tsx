"use client";

import { useEffect, useRef, useState } from "react";
import { clamp01, lerp, readScroll, smooth } from "@/features/landing/scroll-stops";
import { THEME_EVENT, THEME_SHOWN_EVENT, THEME_SWATCH, type ThemeEventDetail } from "@/features/landing/theme-events";
import { cn } from "@/lib/cn";
import { THEME_KEYS, type ThemeKey } from "@/themes";

/** The theme the landing phone shows right now (it changes on a pick and during the scroll tour). */
function useShownTheme() {
  const [active, setActive] = useState<ThemeKey>("cam");
  useEffect(() => {
    const onShown = (e: Event) => setActive((e as CustomEvent<ThemeEventDetail>).detail.theme); // dispatched only by LandingStage
    window.addEventListener(THEME_SHOWN_EVENT, onShown);
    return () => window.removeEventListener(THEME_SHOWN_EVENT, onShown);
  }, []);
  return active;
}

/** The shown theme's name and one-line description, for the theme-tour section. */
export function ThemeCaption({ names, descriptions }: { names: Record<ThemeKey, string>; descriptions: Record<ThemeKey, string> }) {
  const active = useShownTheme();
  return (
    <div aria-live="polite" className="flex min-h-24 flex-col gap-1">
      <p className="text-[2rem] leading-tight font-semibold tracking-[-0.03em]">{names[active]}</p>
      <p className="text-lg text-ink-2">{descriptions[active]}</p>
    </div>
  );
}

/**
 * The theme palette (Faz 17 demo). One element that travels: in the hero it floats beside the phone
 * (following the stage's `data-palette-anchor`), and as the page scrolls into the theme tour it glides
 * into the tour's `data-palette-slot` and scrolls away with it. Beside the phone a swatch dresses the
 * phone; in the tour it scrolls to that theme's stretch, so the scroll and the swatches never disagree.
 * On narrow screens it lives in the slot only.
 */
export function ThemePalette({ label, names }: { label: string; names: Record<ThemeKey, string> }) {
  const active = useShownTheme();
  const ref = useRef<HTMLDivElement>(null);
  const docked = useRef(false);
  // While the pointer or focus is on the palette it holds still: the phone it follows turns toward the
  // pointer, so a following palette would slip away from the cursor.
  const held = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sections: HTMLElement[] = [];
    const collect = () => {
      sections = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]"));
    };
    collect();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const slot = document.querySelector<HTMLElement>("[data-palette-slot]")?.getBoundingClientRect();
      const anchor = document.querySelector<HTMLElement>("[data-palette-anchor]")?.getBoundingClientRect();
      if (!slot) return;
      const wide = window.innerWidth >= 768;
      const e = wide && anchor ? smooth(clamp01(readScroll(sections).p)) : 1;
      if (held.current && e < 1) return;
      const from = wide && anchor ? anchor : slot;
      // Never past the right edge: beside a small phone the anchor sits near it.
      const left = Math.min(lerp(from.left, slot.left, e), window.innerWidth - el.offsetWidth - 16);
      el.style.transform = `translate3d(${left}px, ${lerp(from.top, slot.top, e)}px, 0)`;
      el.style.visibility = "visible";
      docked.current = e > 0.5;
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", collect);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", collect);
    };
  }, []);

  const choose = (theme: ThemeKey) => {
    if (!docked.current) {
      window.dispatchEvent(new CustomEvent<ThemeEventDetail>(THEME_EVENT, { detail: { theme } }));
      return;
    }
    const section = document.querySelector<HTMLElement>("[data-palette-slot]")?.closest<HTMLElement>("[data-stop]");
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const range = section.offsetHeight - window.innerHeight;
    const index = THEME_KEYS.indexOf(theme);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + ((index + 0.3) / THEME_KEYS.length) * range, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      ref={ref}
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onFocus={() => (held.current = true)}
      onBlur={() => (held.current = false)}
      className="glass invisible fixed top-0 left-0 z-10 flex w-72 flex-col gap-2.5 rounded-card p-3.5 text-left will-change-transform">
      <span className="text-xs text-ink-3">
        {label} · <span className="text-ink">{names[active]}</span>
      </span>
      <div role="group" aria-label={label} className="flex gap-1.5">
        {THEME_KEYS.map((theme) => (
          <button
            key={theme}
            type="button"
            aria-label={names[theme]}
            aria-pressed={theme === active}
            onClick={() => choose(theme)}
            className={cn(
              "size-8 rounded-full border border-glass-edge transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              theme === active && "ring-2 ring-ink ring-offset-2 ring-offset-bg",
            )}
            // A preview colour per theme, not a design token: the swatch shows the theme itself.
            style={{ background: THEME_SWATCH[theme] }}
          />
        ))}
      </div>
    </div>
  );
}
