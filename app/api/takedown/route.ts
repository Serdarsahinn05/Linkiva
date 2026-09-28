import { revalidateTag } from "next/cache";
import { takedown, takedownSchema } from "@/features/moderation/takedown";
import { profileTag } from "@/features/profile/public";
import { hasBearer } from "@/lib/bearer";
import { env } from "@/lib/env";

/**
 * Removes reported content (Kullanım Koşulları → bildirim). Operator-only: a Bearer token from TAKEDOWN_SECRET, sent
 * by scripts/takedown.mjs; off (404) without it. The profile's cache is dropped at once (no stale copy is served), so
 * the removal is visible on the next request. Every action is logged for the record.
 */
export async function POST(request: Request) {
  if (!env.TAKEDOWN_SECRET) return new Response("Not found", { status: 404 });
  if (!hasBearer(request.headers.get("authorization"), env.TAKEDOWN_SECRET)) return new Response("Unauthorized", { status: 401 });

  const parsed = takedownSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const result = await takedown(parsed.data);
  if (!result.ok) return Response.json(result, { status: 404 });
  revalidateTag(profileTag(result.username), { expire: 0 });
  console.info("[takedown]", { ...parsed.data, ...result, at: new Date().toISOString() });
  return Response.json(result);
}
