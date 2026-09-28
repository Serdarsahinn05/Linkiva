import type { CSSProperties } from "react";
import { sceneVars } from "@/components/blocks/profile-view";
import { resolveAppearance, THEME_KEYS, type ThemeKey } from "@/themes";

/** A theme as the profile scene's data attributes and CSS variables, so the landing phone wears the real theme CSS. */
export type StageLook = { mode?: "light" | "dark"; scene: string; font: string; button: string; vars: CSSProperties };

export function stageLooks(): Record<ThemeKey, StageLook> {
  const entries = THEME_KEYS.map((key) => {
    const look = resolveAppearance(key, {});
    const stage: StageLook = {
      mode: look.mode === "system" ? undefined : look.mode,
      scene: look.scene,
      font: look.font,
      button: look.button,
      vars: sceneVars(look),
    };
    return [key, stage] as const;
  });
  return Object.fromEntries(entries) as Record<ThemeKey, StageLook>; // one entry per THEME_KEYS key
}
