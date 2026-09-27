/**
 * Story image looks (app/(profile)/[username]/story): the profile as it is (theme, background image), or its theme
 * forced dark or light without the photo. Shared by the route and the QR dialog.
 */
export const STORY_LOOKS = ["profile", "dark", "light"] as const;
export type StoryLook = (typeof STORY_LOOKS)[number];

export const isStoryLook = (value: unknown): value is StoryLook => typeof value === "string" && (STORY_LOOKS as readonly string[]).includes(value);

export const storyPath = (username: string, look: StoryLook) => `/${username}/story${look === "profile" ? "" : `?look=${look}`}`;
