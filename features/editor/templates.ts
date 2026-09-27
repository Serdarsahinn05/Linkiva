/**
 * Starter pages: a sequence of block types whose texts live in messages/*.json → templates.blocks.<key>.
 * Links are created with a title and no address: the editor marks them unfinished and the public page skips them
 * until the owner fills the address in, so a template never publishes an empty or fake link. Portfolio blocks start empty
 * (no project name, role or skills) for the same reason: nothing made up reaches the page.
 */
export const TEMPLATES = {
  student: ["LINK", "LINK", "LINK", "HEADER", "LINK"],
  musician: ["LINK", "LINK", "HEADER", "LINK", "EMAIL_CAPTURE"],
  freelancer: ["TEXT", "LINK", "LINK", "LINK"],
  creator: ["LINK", "LINK", "HEADER", "LINK", "EMAIL_CAPTURE"],
  // Portfolio starters (ROADMAP Faz 12): section headers with empty project, experience and skill drafts to fill in.
  developer: ["LINK", "LINK", "HEADER", "PROJECT", "PROJECT", "HEADER", "EXPERIENCE", "HEADER", "SKILLS"],
  designer: ["LINK", "LINK", "HEADER", "PROJECT", "PROJECT", "PROJECT", "HEADER", "EXPERIENCE", "HEADER", "SKILLS"],
} as const satisfies Record<string, readonly ("LINK" | "HEADER" | "TEXT" | "EMAIL_CAPTURE" | "PROJECT" | "EXPERIENCE" | "SKILLS")[]>;

export type TemplateKey = keyof typeof TEMPLATES;
export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as TemplateKey[];
