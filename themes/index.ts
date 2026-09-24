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

/** Stored in Profile.appearance. Every field optional: missing means "use the theme's value". */
export const appearanceSchema = z.object({
  mode: z.enum(MODE_KEYS).optional(),
  font: z.enum(FONT_KEYS).optional(),
  button: z.enum(BUTTON_KEYS).optional(),
  accent: hex.nullable().optional(),
  backgroundUrl: z.string().url().max(2048).nullable().optional(),
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
};

const PRESETS: Record<ThemeKey, Omit<ResolvedAppearance, "theme" | "backgroundUrl">> = {
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
  };
}

export function themePreset(theme: ThemeKey) {
  return PRESETS[theme];
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hexColor: string): number {
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
