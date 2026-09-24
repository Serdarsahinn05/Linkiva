import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// WCAG contrast of the text tokens in globals.css, computed from their OKLCH values (DESIGN.md §9).
function oklchToLinear(L: number, C: number, h: number): [number, number, number] {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
function tokens(block: string) {
  const out: Record<string, [number, number, number]> = {};
  for (const m of block.matchAll(/--c-([a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g)) {
    out[m[1]!] = oklchToLinear(Number(m[2]) / 100, Number(m[3]), Number(m[4]));
  }
  return out;
}
const light = tokens(css.slice(css.indexOf(":root,\n[data-theme=\"light\"]"), css.indexOf("[data-theme=\"dark\"] {")));
const dark = tokens(css.slice(css.indexOf("[data-theme=\"dark\"] {"), css.indexOf("@media (prefers-color-scheme: dark)")));

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme text tokens", (_name, t) => {
  it.each(["ink", "ink-2", "ink-3", "positive", "negative", "info"])("%s reaches 4.5:1 on the ground", (token) => {
    expect(ratio(t[token]!, t.bg!)).toBeGreaterThanOrEqual(4.5);
  });
});
