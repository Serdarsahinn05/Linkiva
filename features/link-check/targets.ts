import type { BlockType } from "@/prisma/generated/enums";
import type { ParsedBlock } from "@/lib/validation/blocks";

/** Block types whose tap leads to an address the owner typed (the others are built on the server or have no target). */
export const CHECKED_TYPES = ["LINK", "PRODUCT", "IMAGE", "SUPPORT", "PROJECT"] as const satisfies readonly BlockType[];

/** Consecutive failed daily checks before the editor flags a block and its owner is mailed. */
export const BROKEN_AFTER = 2;

/** The web address a block's tap opens, when it is one the daily check can try (http/https only). */
export function checkableUrl(block: ParsedBlock): string | null {
  let url: string | undefined;
  switch (block.type) {
    case "LINK":
    case "PRODUCT":
    case "IMAGE":
    case "SUPPORT":
      url = block.data.url;
      break;
    case "PROJECT":
      url = block.data.url ?? block.data.repo;
      break;
    default:
      return null;
  }
  return url && /^https?:\/\//i.test(url) ? url : null;
}
