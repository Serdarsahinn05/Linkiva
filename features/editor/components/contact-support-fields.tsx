"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { DESC_MAX, NOTE_MAX, PRICE_MAX, TITLE_MAX } from "@/lib/validation/blocks";
import { normalizeIban } from "@/lib/validation/iban";
import { normalizePhone } from "@/lib/validation/phone";
import { normalizeUrl } from "@/lib/validation/url";
import { fetchLinkCard } from "../actions";
import type { EditorBlock } from "../types";

type Props = { block: EditorBlock; autoFocus: boolean; onChange: (data: Record<string, string>) => void };

/** ISO → <input type="datetime-local"> value in the owner's local time, and back. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : "");

/** A field judged once it has been left (or when it was already stored). */
function useTouched(initial: string) {
  const [touched, setTouched] = useState(Boolean(initial));
  return [touched, () => setTouched(true)] as const;
}

const hint = "text-sm text-ink-3";
const error = "text-sm text-negative";
const url = { inputMode: "url" as const, autoCapitalize: "none", spellCheck: false, maxLength: 2048 };

/** Editor fields of the contact and support blocks (ROADMAP Faz 8). Stored as a draft until complete, like every block. */
export function ContactSupportFields({ block, autoFocus, onChange }: Props) {
  const t = useTranslations("editor");
  const field = (key: string) => block.data[key] ?? "";
  const set = (key: string, value: string) => onChange({ ...block.data, [key]: value });
  const [ibanTouched, touchIban] = useTouched(field("iban"));
  const [phoneTouched, touchPhone] = useTouched(field("phone"));

  switch (block.type) {
    case "SUPPORT": {
      const ibanInvalid = ibanTouched && Boolean(field("iban")) && normalizeIban(field("iban")) === null;
      return (
        <>
          <Input aria-label={t("support.name")} placeholder={t("support.name")} value={field("name")} maxLength={60} autoFocus={autoFocus} onChange={(e) => set("name", e.target.value)} className="font-semibold" />
          <Input
            aria-label={t("support.iban")}
            placeholder={t("support.ibanPlaceholder")}
            value={field("iban")}
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={40}
            aria-invalid={ibanInvalid}
            onChange={(e) => set("iban", e.target.value)}
            onBlur={touchIban}
            className="font-mono tabular-nums"
          />
          {ibanInvalid && <p className={error}>{t("support.ibanInvalid")}</p>}
          <Input aria-label={t("support.note")} placeholder={t("support.notePlaceholder")} value={field("note")} maxLength={NOTE_MAX} onChange={(e) => set("note", e.target.value)} />
          <Input aria-label={t("support.linkLabel")} placeholder={t("support.linkLabelPlaceholder")} value={field("urlLabel")} maxLength={TITLE_MAX} onChange={(e) => set("urlLabel", e.target.value)} />
          <Input aria-label={t("support.link")} placeholder={t("support.linkPlaceholder")} value={field("url")} {...url} onChange={(e) => set("url", e.target.value)} className="text-[0.9375rem] text-ink-2" />
          <p className={hint}>{t("support.publicWarning")}</p>
        </>
      );
    }
    case "WHATSAPP": {
      const phoneInvalid = phoneTouched && Boolean(field("phone")) && normalizePhone(field("phone")) === null;
      return (
        <>
          <Input
            aria-label={t("whatsapp.phone")}
            placeholder={t("whatsapp.phonePlaceholder")}
            value={field("phone")}
            type="tel"
            autoComplete="tel"
            autoFocus={autoFocus}
            maxLength={30}
            aria-invalid={phoneInvalid}
            onChange={(e) => set("phone", e.target.value)}
            onBlur={touchPhone}
          />
          {phoneInvalid && <p className={error}>{t("whatsapp.phoneInvalid")}</p>}
          <Input aria-label={t("whatsapp.message")} placeholder={t("whatsapp.messagePlaceholder")} value={field("message")} maxLength={300} onChange={(e) => set("message", e.target.value)} />
          <Input aria-label={t("whatsapp.title")} placeholder={t("whatsapp.title")} value={field("title")} maxLength={TITLE_MAX} onChange={(e) => set("title", e.target.value)} />
        </>
      );
    }
    case "CONTACT": {
      const phoneInvalid = phoneTouched && Boolean(field("phone")) && normalizePhone(field("phone")) === null;
      const empty = Boolean(field("name")) && !field("phone") && !field("email") && !field("website");
      return (
        <>
          <Input aria-label={t("contact.name")} placeholder={t("contact.name")} value={field("name")} maxLength={60} autoFocus={autoFocus} onChange={(e) => set("name", e.target.value)} className="font-semibold" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={t("contact.title")} placeholder={t("contact.title")} value={field("title")} maxLength={60} onChange={(e) => set("title", e.target.value)} />
            <Input aria-label={t("contact.org")} placeholder={t("contact.org")} value={field("org")} maxLength={60} onChange={(e) => set("org", e.target.value)} />
          </div>
          <Input
            aria-label={t("contact.phone")}
            placeholder={t("contact.phone")}
            value={field("phone")}
            type="tel"
            maxLength={30}
            aria-invalid={phoneInvalid}
            onChange={(e) => set("phone", e.target.value)}
            onBlur={touchPhone}
          />
          {phoneInvalid && <p className={error}>{t("whatsapp.phoneInvalid")}</p>}
          <Input aria-label={t("contact.email")} placeholder={t("contact.email")} value={field("email")} type="email" maxLength={254} onChange={(e) => set("email", e.target.value)} />
          <Input aria-label={t("contact.website")} placeholder={t("contact.website")} value={field("website")} {...url} onChange={(e) => set("website", e.target.value)} />
          {empty && <p className={hint}>{t("contact.needOne")}</p>}
        </>
      );
    }
    case "PRODUCT":
      return <ProductFields block={block} autoFocus={autoFocus} onChange={onChange} />;
    case "COUNTDOWN":
      return (
        <>
          <Input aria-label={t("countdown.title")} placeholder={t("countdown.titlePlaceholder")} value={field("title")} maxLength={TITLE_MAX} autoFocus={autoFocus} onChange={(e) => set("title", e.target.value)} className="font-semibold" />
          <Input aria-label={t("countdown.target")} type="datetime-local" value={toLocalInput(field("target"))} onChange={(e) => set("target", fromLocalInput(e.target.value))} />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">{t("countdown.after")}</p>
            <Segmented
              label={t("countdown.after")}
              value={field("after") === "text" ? "text" : "hide"}
              onChange={(after) => set("after", after)}
              options={[
                { value: "hide", label: t("countdown.hide") },
                { value: "text", label: t("countdown.text") },
              ]}
            />
          </div>
          {field("after") === "text" && (
            <Input aria-label={t("countdown.afterText")} placeholder={t("countdown.afterTextPlaceholder")} value={field("afterText")} maxLength={TITLE_MAX} onChange={(e) => set("afterText", e.target.value)} />
          )}
        </>
      );
    default:
      return null;
  }
}

/** Product: name, link, price, the card read from the page once (same server fetch as link cards), sponsored flag. */
function ProductFields({ block, autoFocus, onChange }: Props) {
  const t = useTranslations("editor");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string>();
  const latest = useRef(block.data);
  useEffect(() => {
    latest.current = block.data;
  }, [block.data]);
  const field = (key: string) => block.data[key] ?? "";
  const set = (key: string, value: string) => onChange({ ...block.data, [key]: value });

  async function load() {
    setFailed(undefined);
    const target = normalizeUrl(field("url"));
    if (!target || !/^https?:/.test(target)) return setFailed(t("card.needUrl"));
    setBusy(true);
    const result = await fetchLinkCard(block.id, target);
    setBusy(false);
    if (!result.ok) return setFailed(t(result.error === "tooMany" ? "card.tooMany" : result.error === "unreachable" ? "card.unreachable" : "card.failed"));
    const { desc, img, title } = result.data.data;
    onChange({ ...latest.current, desc: desc ?? "", img: img ?? "", title: latest.current.title || (title ?? "") });
  }

  return (
    <>
      <Input aria-label={t("product.title")} placeholder={t("product.title")} value={field("title")} maxLength={TITLE_MAX} autoFocus={autoFocus} onChange={(e) => set("title", e.target.value)} className="font-semibold" />
      <Input aria-label={t("product.url")} placeholder={t("placeholders.url")} value={field("url")} {...url} onChange={(e) => set("url", e.target.value)} className="text-[0.9375rem] text-ink-2" />
      <Input aria-label={t("product.price")} placeholder={t("product.pricePlaceholder")} value={field("price")} maxLength={PRICE_MAX} onChange={(e) => set("price", e.target.value)} className="font-mono tabular-nums" />
      <div className="flex items-start gap-3">
        {field("img") && (
          // eslint-disable-next-line @next/next/no-img-element -- copied to our Blob store
          <img src={field("img")} alt="" className="size-16 shrink-0 rounded-[var(--radius-control)] border border-glass-edge object-cover" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {field("img") || field("desc") ? (
            <Input aria-label={t("card.desc")} placeholder={t("card.desc")} value={field("desc")} maxLength={DESC_MAX} onChange={(e) => set("desc", e.target.value)} className="text-[0.9375rem]" />
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-glass hover:text-ink disabled:opacity-60"
          >
            <RefreshCw size={14} aria-hidden className={busy ? "animate-spin" : undefined} />
            {busy ? t("card.loading") : t("product.fetch")}
          </button>
        </div>
      </div>
      {failed && <Notice tone="error">{failed}</Notice>}
      <div className="-my-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("product.sponsored")}</p>
          <p className={hint}>{t("product.sponsoredHint")}</p>
        </div>
        <Switch checked={field("sponsored") === "1"} label={t("product.sponsored")} onChange={(on) => set("sponsored", on ? "1" : "")} />
      </div>
    </>
  );
}
