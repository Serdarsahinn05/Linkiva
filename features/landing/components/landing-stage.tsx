"use client";

import { AtSign, Globe, Mail } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { LandingSample } from "@/features/landing/sample";
import { at, clamp01, easeOut, lerp, orbitAt, readScroll, smooth, tour } from "@/features/landing/scroll-stops";
import type { StageLook } from "@/features/landing/stage-looks";
import { THEME_EVENT, THEME_SHOWN_EVENT, type ThemeEventDetail } from "@/features/landing/theme-events";
import { sanitizeUsernameInput } from "@/lib/validation/username";
import { THEME_KEYS, type ThemeKey } from "@/themes";

/**
 * The landing's sample phone (Faz 17, DESIGN.md §7 Landing): HTML glass layers in CSS 3D, moved by the
 * scroll. The page sections marked `data-stop` are the stops: on a wide screen the phone crosses the
 * page and turns between them, the held theme section turns it once per theme, and its blocks lift
 * off, then orbit it. On a narrow screen it sits in the room the hero and the theme section keep for
 * it (`data-stage-slot`). The screen and blocks wear the real profile theme CSS (.profile-scene + data
 * attributes); the typed username renames it. No library: transforms are written to the elements every
 * frame, React renders only when the name or theme changes. Reduced motion: no turning, orbit or ripple.
 */

/** Stage box (the A design's coordinates, px). The phone is 300 × 620 at (160, 70). */
const W = 620;
const H = 760;
/** Per stop: side (-1 left, 0 centre, 1 right), height (share of the screen, up is negative), turn and tilt (deg), scale, lift, orbit. */
// Stops: hero, theme tour, features, more features (orbit), questions, sign-up.
const STOPS = {
  side: [1, 1, -1, 1, 1, 0],
  y: [0, 0, 0, 0, 0, -0.2],
  turn: [-12, -8, 360 + 18, 720 - 14, 720 - 20, 720],
  tilt: [6, 4, -4, 6, 4, 0],
  scale: [1, 1, 1, 0.95, 0.9, 0.52],
  lift: [1, 0.45, 1.6, 1, 0.5, 0.5],
  orbit: [0, 0, 0, 1, 0, 0],
};
const TOUR_STOP = 1;

type Layer = { key: string; left: number; top: number; width: number; height?: number; z: number; themed: boolean; node: ReactNode };

export function LandingStage({
  sample,
  looks,
  labels,
  locale,
}: {
  sample: LandingSample;
  looks: Record<ThemeKey, StageLook>;
  labels: { badge: string; views: string; qr: string; subscribePlaceholder: string; subscribe: string };
  locale: string;
}) {
  const [theme, setTheme] = useState<ThemeKey>("cam");
  const [name, setName] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const themeRef = useRef<ThemeKey>("cam");
  const flipRef = useRef(-1);

  const look = looks[theme];
  // The profile scene on a layer: the theme's mode, light, font and button style, and its accent variables.
  const scene = (style?: CSSProperties) => ({
    className: "profile-scene !min-h-0 !bg-transparent",
    "data-theme": look.mode,
    "data-scene": look.scene,
    "data-font": look.font,
    "data-button": look.button,
    style: { ...look.vars, ...style },
  });

  const yours = name.length > 0;
  const set = yours ? sample.yours : sample;
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", signDisplay: "always" });

  const layers: Layer[] = [
    {
      key: "address",
      left: 0,
      top: 124,
      width: 250,
      z: 170,
      themed: false,
      node: (
        <div className="glass flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium" lang="en" translate="no">
          <span className="size-2 shrink-0 rounded-full bg-positive shadow-[0_0_10px_var(--c-positive)]" />
          <span className="truncate">
            {sample.host}/{name || sample.handle}
          </span>
        </div>
      ),
    },
    {
      key: "avatar",
      left: 270,
      top: 110,
      width: 80,
      z: 55,
      themed: true,
      node: (
        <div className="glass flex size-20 items-center justify-center rounded-full text-[1.625rem] font-semibold tracking-[-0.02em] text-ink">
          {yours ? name.charAt(0).toLocaleUpperCase(locale) : sample.initials}
        </div>
      ),
    },
    {
      key: "name",
      left: 180,
      top: 204,
      width: 260,
      z: 40,
      themed: true,
      node: (
        <div className="flex flex-col items-center gap-0.5 text-center text-ink">
          <span className="max-w-full truncate text-lg font-semibold tracking-[-0.01em]">{name || sample.name}</span>
          <span className="text-[0.8125rem] text-ink-2">{set.bio}</span>
        </div>
      ),
    },
    {
      key: "socials",
      left: 250,
      top: 262,
      width: 120,
      z: 48,
      themed: true,
      node: (
        <div className="flex justify-center gap-2.5 text-ink">
          {[AtSign, Globe, Mail].map((Icon, i) => (
            <span key={i} className="p-btn !size-8.5 !min-h-0 !rounded-full !p-0">
              <Icon size={16} aria-hidden />
            </span>
          ))}
        </div>
      ),
    },
    ...[0, 1, 2].map(
      (i): Layer => ({
        key: `link${i}`,
        left: 180,
        top: 346 + i * 68,
        width: 260,
        z: 95 - i * 15,
        themed: true,
        node: (
          <span className="p-btn !h-14 !min-h-0 !px-4" data-highlight={i === 0 ? "" : undefined}>
            {set.links[i]}
          </span>
        ),
      }),
    ),
    {
      key: "capture",
      left: 180,
      top: 552,
      width: 260,
      z: 50,
      themed: true,
      node: (
        <div className="glass flex flex-col gap-2.5 rounded-card p-3.5 text-ink">
          <span className="text-[0.84375rem] font-medium">{set.capture}</span>
          <div className="flex gap-1.5">
            <span className="flex h-9 min-w-0 flex-1 items-center truncate rounded-control border border-glass-edge px-2.5 text-[0.78125rem] text-ink-3">
              {labels.subscribePlaceholder}
            </span>
            <span
              className="flex h-9 shrink-0 items-center rounded-full px-3 text-[0.78125rem] font-medium"
              style={{ background: "var(--p-accent, var(--c-accent))", color: "var(--p-accent-ink, var(--c-accent-ink))" }}
            >
              {labels.subscribe}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "stats",
      left: 424,
      top: 176,
      width: 186,
      z: 150,
      themed: false,
      node: (
        <div className="glass flex flex-col gap-2 rounded-card p-4">
          <span className="text-xs text-ink-3">{labels.views}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-medium tabular-nums">{number.format(1284)}</span>
            <span className="neon rounded-full px-2 py-0.5 font-mono text-xs font-medium text-positive">{percent.format(0.18)}</span>
          </div>
          <svg width="154" height="40" viewBox="0 0 154 40" aria-hidden className="text-info">
            <path d="M0 32 C 18 31, 28 24, 44 26 S 70 14, 88 18 S 122 7, 154 4 L 154 40 L 0 40 Z" fill="currentColor" opacity="0.14" />
            <path d="M0 32 C 18 31, 28 24, 44 26 S 70 14, 88 18 S 122 7, 154 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
    },
    {
      // Where the theme palette (ThemePalette) sits in the hero: an empty spot that moves with the phone.
      key: "palette",
      left: 392,
      top: 652,
      width: 288,
      z: 110,
      themed: false,
      node: <div data-palette-anchor className="h-[86px]" />,
    },
    {
      key: "qr",
      left: 30,
      top: 468,
      width: 132,
      z: 125,
      themed: false,
      node: (
        <div className="glass flex flex-col items-center gap-2 rounded-card p-3.5">
          <QrMark />
          <span className="text-xs text-ink-3">{labels.qr}</span>
        </div>
      ),
    },
  ];

  // The frame loop: scroll → stop position → transforms. Mounted once; reads the latest theme via themeRef.
  useEffect(() => {
    const stage = stageRef.current;
    const turn = turnRef.current;
    if (!stage || !turn) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let sections: HTMLElement[] = [];
    const collect = () => {
      sections = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]"));
    };
    collect();
    // Each layer's centre relative to the phone's centre, for the orbit.
    const centres = layers.map((l, i) => {
      const el = layerRefs.current[i];
      return { x: l.left + (el?.offsetWidth ?? l.width) / 2 - W / 2, y: l.top + (el?.offsetHeight ?? 40) / 2 - H / 2 };
    });

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    const onInput = (e: Event) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || input.name !== "username") return;
      const next = sanitizeUsernameInput(input.value);
      document.querySelectorAll<HTMLInputElement>('input[name="username"]').forEach((other) => {
        if (other !== input) other.value = next;
      });
      setName(next);
    };
    const show = (next: ThemeKey, flip: boolean) => {
      if (next === themeRef.current) return;
      themeRef.current = next;
      setTheme(next);
      if (flip) flipRef.current = performance.now() / 1000;
      window.dispatchEvent(new CustomEvent<ThemeEventDetail>(THEME_SHOWN_EVENT, { detail: { theme: next } }));
    };
    const onPick = (e: Event) => show((e as CustomEvent<ThemeEventDetail>).detail.theme, true); // dispatched only by ThemePalette
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", collect);
    document.addEventListener("input", onInput);
    window.addEventListener(THEME_EVENT, onPick);

    const first = readScroll(sections);
    let p = first.p;
    let local = first.hold.local;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const time = now / 1000;
      const follow = reduce ? 1 : Math.min(1, dt * 3.5);
      const state = readScroll(sections);
      p += (Math.min(state.p, STOPS.side.length - 1) - p) * follow;
      if (state.hold.index >= 0) local += (state.hold.local - local) * follow;
      pointer.sx = lerp(pointer.sx, pointer.x, 0.08);
      pointer.sy = lerp(pointer.sy, pointer.y, 0.08);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bob = reduce ? 0 : Math.sin(time * 1.6) * 8;
      let x = 0;
      let y = 0;
      let scale = 1;
      let opacity = 1;
      if (vw >= 1024) {
        x = at(STOPS.side, p) * Math.min(vw * 0.21, 320);
        y = at(STOPS.y, p) * vh;
        scale = at(STOPS.scale, p) * Math.min(1, (vh * 0.9) / H);
      } else {
        // No free column on a narrow screen: the phone fills the room the hero keeps for it and scrolls away
        // with it, fading; then it fades in where the theme section keeps room, and leaves with that section.
        const [hero, themes] = sections.slice(0, 2).map((s) => s.querySelector("[data-stage-slot]")?.getBoundingClientRect());
        const e = clamp01(p);
        const slot = e < 0.5 ? hero : themes;
        if (slot) {
          x = slot.left + slot.width / 2 - vw / 2;
          y = slot.top + slot.height / 2 - vh / 2;
          scale = slot.width / W;
          opacity = smooth(clamp01(Math.abs(e - 0.5) * 4)) * (1 - clamp01((p - 1) * 3));
        } else opacity = 0;
      }
      stage.style.transform = `translate3d(${x}px, ${y + bob}px, 0) scale(${scale})`;
      stage.style.opacity = String(opacity);

      // Theme tour: one full turn per theme, the next one shown while the phone's back faces the viewer.
      let spin = 0;
      if (state.hold.index === TOUR_STOP) {
        const step = tour(local, THEME_KEYS.length);
        spin = reduce ? 0 : step.spin * 360;
        const shown = THEME_KEYS[step.index];
        if (shown) show(shown, false);
      }
      const drift = reduce ? 0 : Math.sin(time * 0.45) * 5;
      // Reduced motion keeps a slight angle toward the text instead of the turns between stops.
      const turnY = reduce ? at(STOPS.side, p) * -10 : at(STOPS.turn, p);
      turn.style.transform = `rotateX(${at(STOPS.tilt, p) - pointer.sy * 16}deg) rotateY(${turnY + spin + drift + pointer.sx * 24}deg)`;

      const lift = at(STOPS.lift, p);
      const orbit = reduce ? 0 : at(STOPS.orbit, p);
      const flipAt = flipRef.current;
      layers.forEach((l, i) => {
        const el = layerRefs.current[i];
        const c = centres[i];
        if (!el || !c) return;
        const { angle, face } = orbitAt(reduce ? 0 : time, i, layers.length);
        const ox = Math.cos(angle) * 330 - c.x;
        const oy = c.y * 0.6 - c.y;
        const oz = Math.sin(angle) * 330;
        const z = lerp(l.z * lift, oz, orbit);
        const ry = (orbit * face * 180) / Math.PI;
        // A picked theme ripples down the blocks: each flips once, a little after the one above.
        const f = flipAt < 0 || reduce || l.key === "palette" ? 1 : clamp01((time - flipAt - (c.y + H / 2) / 900) / 0.55);
        const rx = f < 1 ? 360 * easeOut(f) : 0;
        el.style.transform = `translate3d(${ox * orbit}px, ${oy * orbit}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", collect);
      document.removeEventListener("input", onInput);
      window.removeEventListener(THEME_EVENT, onPick);
    };
    // The layer list only changes in content, not in shape; the loop reads refs, so it mounts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-1 overflow-hidden" style={{ perspective: "1800px" }}>
      <div ref={stageRef} className="absolute top-1/2 left-1/2 transform-3d will-change-transform" style={{ width: W, height: H, marginLeft: -W / 2, marginTop: -H / 2 }}>
        <div ref={turnRef} className="absolute inset-0 transform-3d will-change-transform">
          {/* Back of the phone: seen mid-turn, when the theme changes. */}
          <div className="glass absolute top-[70px] left-[160px] flex h-[620px] w-[300px] items-center justify-center rounded-[44px] backface-hidden" style={{ transform: "rotateY(180deg)" }}>
            <span className="glass inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.9375rem] font-semibold tracking-[-0.01em]" lang="en" translate="no">
              <span className="size-2 rounded-full bg-ink shadow-[0_0_10px_var(--c-ink)]" />
              Linkiva
            </span>
          </div>
          {/* Front: glass frame around the theme's own screen (ground + scene light). */}
          <div className="glass absolute top-[70px] left-[160px] h-[620px] w-[300px] rounded-[44px] p-2.5 backface-hidden">
            <div {...scene()} className="profile-scene !min-h-0 h-full overflow-hidden rounded-[36px] transition-colors duration-300">
              <div className="scene-light" />
            </div>
          </div>
          <span className="glass absolute top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-ink-2 backface-hidden">{labels.badge}</span>
          {layers.map((l, i) => {
            const props = l.themed ? scene() : { className: "" };
            return (
              <div
                key={l.key}
                ref={(el) => {
                  layerRefs.current[i] = el;
                }}
                {...props}
                className={`${props.className} absolute backface-hidden will-change-transform`}
                style={{ ...("style" in props ? props.style : {}), left: l.left, top: l.top, width: l.width }}
              >
                {l.node}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A decorative QR-like mark (not a real code). */
function QrMark() {
  const modules: [number, number, number, number][] = [
    [8, 0, 1, 2], [10, 1, 2, 1], [9, 3, 1, 3], [11, 4, 2, 2], [8, 8, 3, 1], [0, 8, 2, 1], [3, 9, 2, 2], [12, 8, 1, 3],
    [14, 8, 3, 1], [18, 9, 2, 2], [9, 10, 2, 2], [6, 11, 2, 1], [15, 11, 1, 3], [17, 13, 3, 1], [8, 13, 1, 3], [10, 14, 3, 1],
    [12, 16, 2, 2], [15, 16, 1, 1], [17, 15, 1, 3], [19, 17, 2, 1], [9, 18, 2, 2], [14, 19, 3, 1], [19, 19, 1, 2],
  ];
  return (
    <svg width="100" height="100" viewBox="0 0 21 21" aria-hidden fill="currentColor" shapeRendering="crispEdges">
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([x = 0, y = 0]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.5} y={y + 0.5} width="6" height="6" fill="none" stroke="currentColor" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
      {modules.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}
