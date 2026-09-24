"use client";

import { upload } from "@vercel/blob/client";
import { User } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Notice } from "@/components/ui/notice";
import { toWebp } from "@/lib/image";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, userUploadPrefix } from "@/lib/uploads";
import { setAvatar } from "../actions";

type Props = { userId: string; url: string | null; enabled: boolean; onChange: (url: string | null) => void };

export function AvatarUploader({ userId, url, enabled, onChange }: Props) {
  const t = useTranslations("editor.avatar");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function pick(file: File) {
    setError(undefined);
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return setError(t("wrongType"));
    if (file.size > AVATAR_MAX_BYTES) return setError(t("tooBig"));
    setBusy(true);
    try {
      const blob = await upload(`${userUploadPrefix(userId)}avatar.webp`, await toWebp(file, 512, { square: true }), {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "image/webp",
      });
      const saved = await setAvatar(blob.url);
      if (!saved.ok) throw new Error(saved.error);
      onChange(blob.url);
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("label")}</span>
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-full border border-glass-edge bg-glass-strong">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL, already 512px
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-ink-3">
              <User size={28} strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>
        {enabled ? (
          <div className="flex flex-wrap items-center gap-2">
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
              className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-medium disabled:opacity-60"
            >
              {busy && <span className="dots" aria-hidden />}
              {busy ? t("uploading") : t("change")}
            </button>
            {url && !busy && (
              <button
                type="button"
                onClick={async () => {
                  const result = await setAvatar(null);
                  if (result.ok) onChange(null);
                  else setError(t("failed"));
                }}
                className="min-h-11 px-3 text-ink-2 underline underline-offset-4 hover:text-ink"
              >
                {t("remove")}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-2">{t("disabled")}</p>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
