"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input, inputClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { blockDataSchemas, DESC_MAX, splitList, TITLE_MAX } from "@/lib/validation/blocks";
import { normalizeUrl } from "@/lib/validation/url";
import { fetchLinkCard } from "../actions";
import type { EditorBlock } from "../types";

type Props = { block: EditorBlock; autoFocus: boolean; onChange: (data: Record<string, string>) => void };

const hint = "text-sm text-ink-3";
const error = "text-sm text-negative";
const url = { inputMode: "url" as const, autoCapitalize: "none", spellCheck: false, maxLength: 2048 };

/** Editor fields of the portfolio blocks (ROADMAP Faz 12). Drafts are stored as typed; the page shows them once complete. */
export function PortfolioFields({ block, autoFocus, onChange }: Props) {
  const t = useTranslations("editor.portfolio");
  const field = (key: string) => block.data[key] ?? "";
  const set = (key: string, value: string) => onChange({ ...block.data, [key]: value });

  switch (block.type) {
    case "PROJECT":
      return <ProjectFields block={block} autoFocus={autoFocus} onChange={onChange} />;
    case "EXPERIENCE": {
      const dates = blockDataSchemas.EXPERIENCE.safeParse({ ...block.data, role: field("role") || "x" });
      const datesInvalid = !dates.success && dates.error.issues.some((i) => i.message === "dates");
      return (
        <>
          <Input aria-label={t("role")} placeholder={t("role")} value={field("role")} maxLength={TITLE_MAX} autoFocus={autoFocus} onChange={(e) => set("role", e.target.value)} className="font-semibold" />
          <Input aria-label={t("org")} placeholder={t("org")} value={field("org")} maxLength={TITLE_MAX} onChange={(e) => set("org", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm text-ink-2">
              {t("start")}
              <input type="month" value={field("start")} onChange={(e) => set("start", e.target.value)} className={cn(inputClass, "font-mono")} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-2">
              {t("end")}
              <input type="month" value={field("end")} aria-invalid={datesInvalid} onChange={(e) => set("end", e.target.value)} className={cn(inputClass, "font-mono")} />
            </label>
          </div>
          <p className={datesInvalid ? error : hint}>{datesInvalid ? t("datesInvalid") : t("endHint")}</p>
          <textarea
            aria-label={t("expDesc")}
            placeholder={t("expDesc")}
            value={field("desc")}
            maxLength={300}
            rows={2}
            onChange={(e) => set("desc", e.target.value)}
            className={cn(inputClass, "h-auto py-3 text-[0.9375rem] leading-relaxed")}
          />
        </>
      );
    }
    case "SKILLS": {
      const items = splitList(field("items"));
      const invalid = items.length > 30 || items.some((i) => i.length > 32);
      return (
        <>
          <Input aria-label={t("skillsTitle")} placeholder={t("skillsTitle")} value={field("title")} maxLength={40} autoFocus={autoFocus} onChange={(e) => set("title", e.target.value)} className="font-semibold" />
          <Input aria-label={t("skillsItems")} placeholder={t("skillsPlaceholder")} value={field("items")} maxLength={1200} aria-invalid={invalid} onChange={(e) => set("items", e.target.value)} className="font-mono text-[0.9375rem]" />
          <p className={invalid ? error : hint}>{invalid ? t("listInvalid") : t("skillsHint")}</p>
        </>
      );
    }
    default:
      return null;
  }
}

/** Project: name, short description, live and code addresses, tags; the image and description can be read from the page once. */
function ProjectFields({ block, autoFocus, onChange }: Props) {
  const t = useTranslations("editor.portfolio");
  const tc = useTranslations("editor.card");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string>();
  const latest = useRef(block.data);
  useEffect(() => {
    latest.current = block.data;
  }, [block.data]);
  const field = (key: string) => block.data[key] ?? "";
  const set = (key: string, value: string) => onChange({ ...block.data, [key]: value });
  const tags = splitList(field("tags"));
  const tagsInvalid = tags.length > 8 || tags.some((tag) => tag.length > 24);

  async function load() {
    setFailed(undefined);
    const target = normalizeUrl(field("url") || field("repo"));
    if (!target || !/^https?:/.test(target)) return setFailed(tc("needUrl"));
    setBusy(true);
    const result = await fetchLinkCard(block.id, target);
    setBusy(false);
    if (!result.ok) return setFailed(tc(result.error === "tooMany" ? "tooMany" : result.error === "unreachable" ? "unreachable" : "failed"));
    const { desc, img } = result.data.data;
    onChange({ ...latest.current, img: img ?? "", desc: latest.current.desc || (desc ?? "") });
  }

  return (
    <>
      <Input aria-label={t("projectTitle")} placeholder={t("projectTitle")} value={field("title")} maxLength={TITLE_MAX} autoFocus={autoFocus} onChange={(e) => set("title", e.target.value)} className="font-semibold" />
      <Input aria-label={t("projectDesc")} placeholder={t("projectDesc")} value={field("desc")} maxLength={DESC_MAX} onChange={(e) => set("desc", e.target.value)} className="text-[0.9375rem]" />
      <Input aria-label={t("projectUrl")} placeholder={t("projectUrl")} value={field("url")} {...url} onChange={(e) => set("url", e.target.value)} className="text-[0.9375rem] text-ink-2" />
      <Input aria-label={t("projectRepo")} placeholder={t("projectRepo")} value={field("repo")} {...url} onChange={(e) => set("repo", e.target.value)} className="text-[0.9375rem] text-ink-2" />
      <Input aria-label={t("projectTags")} placeholder={t("projectTagsPlaceholder")} value={field("tags")} maxLength={400} aria-invalid={tagsInvalid} onChange={(e) => set("tags", e.target.value)} className="font-mono text-[0.9375rem]" />
      <p className={tagsInvalid ? error : hint}>{tagsInvalid ? t("listInvalid") : t("projectTagsHint")}</p>
      <div className="flex items-center gap-3">
        {field("img") && (
          // eslint-disable-next-line @next/next/no-img-element -- copied to our Blob store
          <img src={field("img")} alt="" className="aspect-[4/3] w-20 shrink-0 rounded-[var(--radius-control)] border border-glass-edge object-cover" />
        )}
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-glass hover:text-ink disabled:opacity-60"
        >
          <RefreshCw size={14} aria-hidden className={busy ? "animate-spin" : undefined} />
          {busy ? tc("loading") : t("projectFetch")}
        </button>
        {field("img") && (
          <button type="button" onClick={() => set("img", "")} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-ink-3 hover:bg-glass hover:text-ink">
            {t("projectImageRemove")}
          </button>
        )}
      </div>
      {failed && <Notice tone="error">{failed}</Notice>}
    </>
  );
}
