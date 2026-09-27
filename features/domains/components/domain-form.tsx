"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { addCustomDomain, checkCustomDomain, removeCustomDomain } from "../actions";
import type { DomainView } from "../view";

/**
 * Settings → Domain (ROADMAP Faz 11): connect the owner's own domain. Three states: none (a field), added but not
 * serving yet (the DNS record to add, and "Verify"), connected (the live address).
 */
export function DomainForm({ initial }: { initial: DomainView | null }) {
  const t = useTranslations("domain");
  const tc = useTranslations("common");
  const [domain, setDomain] = useState(initial);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, start] = useTransition();
  const [action, setAction] = useState<"add" | "check" | "remove" | null>(null);

  const message = (code: string) =>
    ({ invalid: t("invalid"), exists: t("exists"), unavailable: t("unavailable"), tooMany: t("tooMany") })[code] ?? tc("genericError");

  function run(kind: "add" | "check" | "remove") {
    setError(null);
    setAction(kind);
    start(async () => {
      if (kind === "add") {
        const res = await addCustomDomain(value);
        if (res.ok) {
          setDomain(res.data);
          setValue("");
          setChecked(false);
        } else setError(message(res.error));
      } else if (kind === "check") {
        const res = await checkCustomDomain();
        if (res.ok) {
          setDomain(res.data);
          setChecked(true);
        } else setError(message(res.error));
      } else {
        const res = await removeCustomDomain();
        if (res.ok) {
          setDomain(null);
          setConfirmRemove(false);
        } else setError(message(res.error));
      }
    });
  }

  if (!domain) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) run("add");
        }}
      >
        <p className="text-sm text-ink-2">{t("intro")}</p>
        <Field label={t("label")} error={error}>
          {({ id, describedBy, invalid }) => (
            <div className="flex gap-2">
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder={t("placeholder")}
                inputMode="url"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                maxLength={253}
                className="min-w-0 flex-1"
              />
              <Button type="submit" variant="secondary" size="lg" pending={busy} pendingLabel={t("adding")} disabled={!value.trim()}>
                {t("add")}
              </Button>
            </div>
          )}
        </Field>
      </form>
    );
  }

  const records = [domain.record, ...domain.verification.map((v) => ({ type: v.type, name: v.domain, value: v.value }))];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span lang="en" translate="no" className="min-w-0 truncate font-medium">
          {domain.hostname}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-glass-edge px-2.5 py-0.5 text-xs",
            domain.verified ? "text-ink" : "text-ink-3",
          )}
        >
          <span aria-hidden className={cn("size-1.5 rounded-full", domain.verified ? "bg-positive shadow-[0_0_8px_var(--c-positive)]" : "bg-ink-3")} />
          {domain.verified ? t("connected") : t("pending")}
        </span>
      </div>

      {domain.verified ? (
        <p className="text-sm text-ink-2">
          {t("liveHint")}{" "}
          <a href={`https://${domain.hostname}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-ink underline-offset-4 hover:underline">
            {domain.hostname}
            <ExternalLink size={13} aria-hidden />
          </a>
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-2">{t("dnsIntro")}</p>
          {/* One card per record, label above value: DNS values are copied verbatim, so they never wrap mid-word. */}
          <ul className="flex flex-col gap-2">
            {records.map((r) => (
              <li key={`${r.type}:${r.name}:${r.value}`} className="glass-flat grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 rounded-[var(--radius-control)] px-3.5 py-3 text-sm">
                <span className="text-xs text-ink-3">{t("type")}</span>
                <span className="font-mono">{r.type}</span>
                <span className="text-xs text-ink-3">{t("name")}</span>
                <span className="font-mono [overflow-wrap:anywhere]">{r.name}</span>
                <span className="text-xs text-ink-3">{t("value")}</span>
                <CopyValue value={r.value} label={t("copy")} copiedLabel={t("copied")} />
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-3">{t("dnsWait")}</p>
          {checked && <Notice tone="info">{domain.misconfigured ? t("stillDns") : t("stillVerify")}</Notice>}
        </>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {confirmRemove ? (
          <>
            <p className="basis-full text-sm text-ink-2 sm:basis-auto sm:grow">{t("removeHint")}</p>
            <Button variant="ghost" size="md" onClick={() => setConfirmRemove(false)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button variant="danger" size="md" onClick={() => run("remove")} pending={busy && action === "remove"} pendingLabel={t("removing")}>
              {t("removeConfirm")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="md" onClick={() => setConfirmRemove(true)} disabled={busy}>
              {t("remove")}
            </Button>
            {!domain.verified && (
              <Button variant="secondary" size="md" onClick={() => run("check")} pending={busy && action === "check"} pendingLabel={t("checking")}>
                {t("check")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** A DNS value with a copy button: these are long and easy to mistype. */
function CopyValue({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="-my-1.5 flex min-w-0 items-center justify-between gap-2">
      <span className="min-w-0 font-mono [overflow-wrap:anywhere]">{value}</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
        aria-label={copied ? copiedLabel : label}
        title={label}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-glass-strong hover:text-ink"
      >
        {copied ? <Check size={15} className="text-positive" aria-hidden /> : <Copy size={15} aria-hidden />}
      </button>
    </span>
  );
}
