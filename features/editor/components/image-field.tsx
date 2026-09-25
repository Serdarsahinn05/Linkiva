"use client";

import { upload } from "@vercel/blob/client";
import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Notice } from "@/components/ui/notice";
import { toWebp } from "@/lib/image";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, blockImagePrefix } from "@/lib/uploads";

type Props = {
  userId: string;
  blockId: string;
  src: string;
  enabled: boolean;
  /** Called with the uploaded file's URL and pixel size; the block's autosave stores it. */
  onUploaded: (image: { src: string; w: string; h: string }) => void;
};

/** Photo picker of an Image block: resized to WebP in the browser, uploaded straight to the owner's Blob folder. */
export function ImageField({ userId, blockId, src, enabled, onUploaded }: Props) {
  const t = useTranslations("editor.image");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function pick(file: File) {
    setError(undefined);
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return setError(t("wrongType"));
    if (file.size > AVATAR_MAX_BYTES) return setError(t("tooBig"));
    setBusy(true);
    try {
      const webp = await toWebp(file, 1600);
      const bitmap = await createImageBitmap(webp);
      const size = { w: String(bitmap.width), h: String(bitmap.height) };
      bitmap.close();
      const blob = await upload(`${blockImagePrefix(userId)}${blockId}.webp`, webp, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "image/webp",
      });
      onUploaded({ src: blob.url, ...size });
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return <p className="text-sm text-ink-2">{t("disabled")}</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-glass-edge bg-glass-strong text-ink-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL, resized before upload
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon size={24} strokeWidth={1.5} aria-hidden />
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void pick(file);
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-busy={busy || undefined}
          className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-medium transition-colors hover:bg-glass-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          {busy && <span className="dots" aria-hidden />}
          {busy ? t("uploading") : src ? t("replace") : t("choose")}
        </button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
