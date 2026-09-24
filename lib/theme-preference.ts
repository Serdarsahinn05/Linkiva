export const THEME_COOKIE = "linkiva-theme";
export type ThemePreference = "light" | "dark" | "system";

export function parseThemePreference(value: string | undefined): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
