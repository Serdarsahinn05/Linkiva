import { z } from "zod";

/**
 * Public profile themes (DESIGN.md §7). A theme is a preset of appearance values; the owner can
 * override any of them. Everything here is free (PRODUCT.md: premium features are not locked).
 */

export const THEME_KEYS = ["cam", "gece", "sade", "kum", "terminal", "afis"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export const FONT_KEYS = ["geist", "serif", "rounded", "grotesk", "mono"] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export const BUTTON_KEYS = ["glass", "solid", "outline"] as const;
export type ButtonKey = (typeof BUTTON_KEYS)[number];

export const MODE_KEYS = ["system", "light", "dark"] as const;
export type ModeKey = (typeof MODE_KEYS)[number];

/** Background "scene": which ambient light sits behind the profile. */
export type SceneKey = "cam" | "gece" | "none" | "kum" | "accent";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const DIM_DEFAULT = 55;
export const DIM_MAX = 90;
const DIM_FLOOR = 30;

/** Stored in Profile.appearance. Every field optional: missing means "use the theme's value". */
export const appearanceSchema = z.object({
  mode: z.enum(MODE_KEYS).optional(),
  font: z.enum(FONT_KEYS).optional(),
  button: z.enum(BUTTON_KEYS).optional(),
  accent: hex.nullable().optional(),
  backgroundUrl: z.string().url().max(2048).nullable().optional(),
  /** How strongly the theme's ground is laid over the background image, in percent (0 = none). */
  backgroundDim: z.number().int().min(0).max(DIM_MAX).optional(),
  /** Average relative luminance of the background image (0 black … 1 white), measured on upload. */
  backgroundTone: z.number().min(0).max(1).optional(),
});
export type AppearanceOverrides = z.infer<typeof appearanceSchema>;

export type ResolvedAppearance = {
  theme: ThemeKey;
  mode: ModeKey;
  font: FontKey;
  button: ButtonKey;
  scene: SceneKey;
  accent: string | null;
  backgroundUrl: string | null;
  backgroundDim: number;
  backgroundTone: number | null;
};

const PRESETS: Record<ThemeKey, Omit<ResolvedAppearance, "theme" | "backgroundUrl" | "backgroundDim" | "backgroundTone">> = {
  cam: { mode: "system", font: "geist", button: "glass", scene: "cam", accent: null },
  gece: { mode: "dark", font: "geist", button: "glass", scene: "gece", accent: null },
  sade: { mode: "light", font: "geist", button: "outline", scene: "none", accent: null },
  kum: { mode: "light", font: "serif", button: "solid", scene: "kum", accent: "#3A2E26" },
  terminal: { mode: "dark", font: "mono", button: "outline", scene: "none", accent: "#7CF5A8" },
  afis: { mode: "light", font: "grotesk", button: "solid", scene: "accent", accent: "#FF5A36" },
};

export const isThemeKey = (value: unknown): value is ThemeKey => typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value);

/** Theme preset + owner overrides → what the profile renders with. Unknown/invalid data falls back safely. */
export function resolveAppearance(theme: string, raw: unknown): ResolvedAppearance {
  const key: ThemeKey = isThemeKey(theme) ? theme : "cam";
  const preset = PRESETS[key];
  const parsed = appearanceSchema.safeParse(raw ?? {});
  const o = parsed.success ? parsed.data : {};
  return {
    theme: key,
    mode: o.mode ?? preset.mode,
    font: o.font ?? preset.font,
    button: o.button ?? preset.button,
    scene: preset.scene,
    accent: o.accent === undefined ? preset.accent : o.accent,
    backgroundUrl: o.backgroundUrl ?? null,
    backgroundDim: o.backgroundDim ?? DIM_DEFAULT,
    backgroundTone: o.backgroundTone ?? null,
  };
}

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hexColor: string): number {
  const channel = (i: number) => {
    const v = parseInt(hexColor.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text colour for an accent fill: whichever of near-black/white reads better (contrast protection). */
export function inkOn(accent: string): string {
  return contrastRatio(accent, "#FFFFFF") >= contrastRatio(accent, "#111318") ? "#FFFFFF" : "#111318";
}

// ─── Readability (contrast protection) ───────────────────────────────────────
// sRGB approximations of the globals.css tokens, for contrast maths only.
export const GROUND = { light: "#F3F5F9", dark: "#07090D" } as const;
/** Secondary text (--c-ink-2): the faintest text a profile shows, so it sets the bar. */
const INK_2 = { light: "#4F5359", dark: "#ADB1B8" } as const;

const toRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

/**
 * The accent as it can be used on the given ground, as text/border *and* as a fill carrying its inkOn text
 * (a highlighted outline button): unchanged when it already reaches `min` both ways, otherwise mixed towards
 * black (light ground) or white (dark ground) until it does.
 */
export function readableAccent(accent: string, ground: string, min = 4.5): string {
  const target = luminance(ground) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  const base = toRgb(accent);
  for (let step = 0; step <= 20; step++) {
    const mixed = toHex(base.map((v, i) => v + (target[i]! - v) * (step / 20)));
    if (contrastRatio(mixed, ground) >= min && contrastRatio(mixed, inkOn(mixed)) >= min) return mixed;
  }
  return toHex(target);
}

/** Relative luminance of the ground laid over an image of average luminance `tone` at `dim` percent. */
function dimmedLuminance(tone: number, mode: "light" | "dark", dim: number): number {
  return (dim / 100) * luminance(GROUND[mode]) + (1 - dim / 100) * tone;
}

/**
 * Smallest dim (in steps of 5) at which secondary text stays readable (≥ 4.5:1) over a background image of
 * average luminance `tone`. An average hides bright and dark spots, so this is a floor, not a guarantee.
 */
export function minDim(tone: number, mode: "light" | "dark"): number {
  const ink = luminance(INK_2[mode]);
  for (let dim = 0; dim <= DIM_MAX; dim += 5) {
    const ground = dimmedLuminance(tone, mode, dim);
    const [hi, lo] = ink > ground ? [ink, ground] : [ground, ink];
    if ((hi + 0.05) / (lo + 0.05) >= 4.5) return dim;
  }
  return DIM_MAX;
}

/** For a freshly uploaded background: the mode that needs the least dimming, and that dim. */
export function suggestForBackground(tone: number): { mode: "light" | "dark"; dim: number } {
  const light = minDim(tone, "light");
  const dark = minDim(tone, "dark");
  const best = light < dark ? { mode: "light" as const, dim: light } : { mode: "dark" as const, dim: dark };
  // Some ground always: photos have bright and dark spots that an average does not show.
  return { ...best, dim: Math.max(best.dim, DIM_FLOOR) };
}
