import type { ThemeKey } from "@/themes";

/**
 * The landing's theme demo talks through window events, so the 3D phone and the (server-rendered)
 * page around it need no shared React tree. Development demo for Faz 17.
 */
export const THEME_EVENT = "linkiva:theme"; // ask the phone to show a theme
export const THEME_SHOWN_EVENT = "linkiva:theme-shown"; // the phone now shows this theme (click or scroll)
export type ThemeEventDetail = { theme: ThemeKey };

/** One preview colour per theme for the swatches (the theme's ground or accent, DESIGN.md §7 table). */
export const THEME_SWATCH: Record<ThemeKey, string> = {
  cam: "oklch(30% 0.03 265)",
  gece: "oklch(40% 0.1 280)",
  sade: "oklch(99% 0.002 270)",
  kum: "oklch(86% 0.06 70)",
  terminal: "#7CF5A8",
  afis: "#FF5A36",
  portfolyo: "oklch(90% 0.006 265)",
};
