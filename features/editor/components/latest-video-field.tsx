"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { youtubeChannel } from "@/lib/embeds";
import { resolveLatestVideo } from "../actions";
import type { EditorBlock } from "../types";

type Props = { block: EditorBlock; onChange: (data: Record<string, string>) => void };

/**
 * Shown under an Embed's address when it is a YouTube channel: "always show the channel's newest video".
 * Turning it on asks the server to find the channel once; the page then follows the channel's feed.
 */
export function LatestVideoField({ block, onChange }: Props) {
  const t = useTranslations("editor.latest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const on = block.data.latest === "1";
  if (!on && !youtubeChannel(block.data.url ?? "")) return null;

  async function turnOn() {
    setError(undefined);
    setBusy(true);
    const result = await resolveLatestVideo(block.id, block.data.url ?? "");
    setBusy(false);
    if (result.ok) onChange(result.data.data);
    else setError(t(result.error === "tooMany" ? "tooMany" : result.error === "unreachable" ? "unreachable" : "failed"));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="-my-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("label")}</p>
          <p className="text-sm text-ink-3">{busy ? t("loading") : t("hint")}</p>
        </div>
        {busy ? (
          <span className="dots mr-3.5 text-ink-2" aria-hidden />
        ) : (
          <Switch checked={on} label={t("label")} onChange={(next) => (next ? void turnOn() : onChange({ url: block.data.url ?? "" }))} />
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
