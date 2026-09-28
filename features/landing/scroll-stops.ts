/**
 * Scroll "stops" for the landing's travelling phone (Faz 17). Sections marked `data-stop` are the
 * stops. A section holds from when its top reaches the top of the screen until its bottom reaches
 * the bottom (a point for a one-screen section, a stretch for a taller one): p = i while section i
 * holds, and runs from i to i + 1 between holds. `local` is how far through the held stretch we are.
 */
export type ScrollState = { p: number; hold: { index: number; local: number } };

export function readScroll(sections: HTMLElement[]): ScrollState {
  const y = window.scrollY;
  const holds = sections.map((s) => {
    const top = s.getBoundingClientRect().top + y;
    return { start: top, end: top + Math.max(0, s.offsetHeight - window.innerHeight) };
  });
  const first = holds[0];
  if (!first) return { p: 0, hold: { index: -1, local: 0 } };
  if (y <= first.start) return { p: 0, hold: { index: 0, local: 0 } };
  for (let i = 0; i < holds.length; i++) {
    const h = holds[i];
    const next = holds[i + 1];
    if (!h) break;
    if (y <= h.end) return { p: i, hold: { index: i, local: h.end > h.start ? (y - h.start) / (h.end - h.start) : 0 } };
    if (next && y < next.start) return { p: i + (y - h.end) / (next.start - h.end), hold: { index: -1, local: 0 } };
  }
  return { p: holds.length - 1, hold: { index: holds.length - 1, local: 1 } };
}

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Value of a per-stop list at scroll position p (index + fraction), eased between stops. */
export const at = (values: number[], p: number) => {
  const i = Math.min(Math.floor(p), values.length - 1);
  const next = values[Math.min(i + 1, values.length - 1)] ?? 0;
  return lerp(values[i] ?? 0, next, smooth(p - i));
};

/**
 * Theme tour over a held stretch: one stretch per theme; over the second half of each the subject
 * makes one slow full turn and the next theme is shown while its back faces the viewer (spin 0.5 = back).
 */
export function tour(local: number, count: number): { index: number; spin: number } {
  const step = Math.min(count - 1, Math.floor(local * count));
  const frac = local * count - step;
  const last = step >= count - 1;
  const spin = last ? 0 : smooth(clamp01((frac - 0.35) / 0.6));
  return { index: !last && frac > 0.65 ? step + 1 : step, spin };
}

/**
 * Where block i of n sits on its orbit (radians, 0–2π) and which way it faces (radians, -π–π). Both stay
 * bounded however long the page has been open: the facing is blended in by the orbit amount, so an
 * ever-growing angle would spin the blocks faster and faster as they leave the screen.
 */
export function orbitAt(time: number, i: number, n: number): { angle: number; face: number } {
  const TAU = Math.PI * 2;
  const angle = (((time * 0.45) % TAU) + (i / n) * TAU) % TAU;
  const face = Math.PI / 2 - angle;
  return { angle, face: face - TAU * Math.round(face / TAU) };
}
