import { z } from "zod";
import { SocialPlatform } from "@/prisma/generated/enums";

/** What an importer read from another bio-link page. Nothing is written until the owner confirms (features/import/actions.ts). */
export const importedItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("LINK"), title: z.string().max(200), url: z.string().max(2048) }),
  z.object({ kind: z.literal("HEADER"), text: z.string().max(200) }),
  z.object({ kind: z.literal("EMBED"), url: z.string().max(2048) }),
  // A GitHub repository as a portfolio project card (Faz 12).
  z.object({
    kind: z.literal("PROJECT"),
    title: z.string().max(200),
    desc: z.string().max(1000).optional(),
    repo: z.string().max(2048),
    url: z.string().max(2048).optional(),
    tags: z.string().max(1000).optional(),
    stars: z.string().max(10).optional(),
  }),
]);

export const importedPageSchema = z.object({
  displayName: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  items: z.array(importedItemSchema).max(100),
  socials: z.array(z.object({ platform: z.enum(SocialPlatform), value: z.string().max(2048) })).max(20),
});

export type ImportedItem = z.infer<typeof importedItemSchema>;
export type ImportedPage = z.infer<typeof importedPageSchema>;
