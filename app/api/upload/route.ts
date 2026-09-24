import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, userUploadPrefix } from "@/lib/uploads";

/**
 * Issues short-lived client-upload tokens (the file goes browser → Blob directly).
 * v1 bug S3: the old endpoint accepted any file from anyone. Now: session required, images only,
 * 5 MB max, and the path is pinned to the caller's own folder.
 */
export async function POST(request: Request) {
  if (!env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "uploads-disabled" }, { status: 503 });

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      token: env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${userUploadPrefix(session.user.id)}avatar`)) throw new Error("forbidden path");
        return {
          allowedContentTypes: [...AVATAR_TYPES],
          maximumSizeInBytes: AVATAR_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 5 * 60 * 1000,
        };
      },
      // The client confirms through setAvatar(); nothing to do on the webhook.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "rejected" }, { status: 400 });
  }
}
