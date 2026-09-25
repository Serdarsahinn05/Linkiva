"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Switch } from "@/components/ui/switch";
import { DESC_MAX } from "@/lib/validation/blocks";
import { normalizeUrl } from "@/lib/validation/url";
import { fetchLinkCard } from "../actions";
import type { EditorBlock } from "../types";

type Props = { block: EditorBlock; onChange: (data: Record<string, string>) => void };

/** "Preview card" switch of a Link block: the server reads the page once; the owner can edit the text. */
export function LinkCardFields({ block, onChange }: Props) {
  const t = useTranslations("editor.card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const on = block.data.card === "1";
  // The fetch takes a moment; merge its result into whatever the owner typed meanwhile.
  const latest = useRef(block.data);
  useEffect(() => {
    latest.current = block.data;
  }, [block.data]);

  async function load() {
    setError(undefined);
    const url = normalizeUrl(block.data.url ?? "");
    if (!url || !/^https?:/.test(url)) return setError(t("needUrl"));
    setBusy(true);
    const result = await fetchLinkCard(block.id, url);
    setBusy(false);
    if (result.ok) {
      const { card, desc, img, title } = result.data.data;
      onChange({ ...latest.current, card: card ?? "1", desc: desc ?? "", img: img ?? "", title: latest.current.title || (title ?? "") });
    } else {
      setError(t(result.error === "tooMany" ? "tooMany" : result.error === "unreachable" ? "unreachable" : "failed"));
    }
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
          <Switch
            checked={on}
            label={t("label")}
            onChange={(next) => (next ? void load() : onChange({ ...block.data, card: "", desc: "", img: "" }))}
          />
        )}
      </div>
      {on && (
        <div className="flex items-start gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-glass-edge bg-glass-strong">
            {block.data.img && (
              // eslint-disable-next-line @next/next/no-img-element -- copied to our Blob store
              <img src={block.data.img} alt="" className="size-full object-cover" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              aria-label={t("desc")}
              placeholder={t("desc")}
              value={block.data.desc ?? ""}
              maxLength={DESC_MAX}
              onChange={(e) => onChange({ ...block.data, desc: e.target.value })}
              className="text-[0.9375rem]"
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-glass hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
            >
              <RefreshCw size={14} aria-hidden />
              {t("refresh")}
            </button>
          </div>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
