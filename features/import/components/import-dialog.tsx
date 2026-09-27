"use client";

import { Heading, Link2, Play } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import { applyImport, readImport, type AppliedImport } from "../actions";
import type { ImportedPage } from "../types";

const KIND_ICON = { LINK: Link2, HEADER: Heading, EMBED: Play } as const;

const KNOWN_ERRORS = ["unsupported", "unreachable", "unreadable", "empty", "tooMany", "invalid"] as const;
const isKnownError = (code: string): code is (typeof KNOWN_ERRORS)[number] => (KNOWN_ERRORS as readonly string[]).includes(code);

type Props = { open: boolean; initialUrl?: string; onClose: () => void; onImported: (result: AppliedImport) => void };

/** Two steps: read the page (writes nothing), then add only what the owner kept ticked. */
export function ImportDialog({ open, initialUrl = "", onClose, onImported }: Props) {
  const t = useTranslations("import");
  const tc = useTranslations("common");
  const te = useTranslations("editor");
  const [url, setUrl] = useState(initialUrl);
  const [page, setPage] = useState<ImportedPage | null>(null);
  const [kept, setKept] = useState<boolean[]>([]);
  const [keepProfile, setKeepProfile] = useState(true);
  const [keepSocials, setKeepSocials] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const errorText = (code: string) => (isKnownError(code) ? t(`errors.${code}`) : tc("genericError"));

  function read() {
    setError(null);
    start(async () => {
      const result = await readImport(url);
      if (!result.ok) return setError(errorText(result.error));
      setPage(result.data);
      setKept(result.data.items.map(() => true));
    });
  }

  function apply() {
    if (!page) return;
    setError(null);
    start(async () => {
      const result = await applyImport({
        displayName: keepProfile ? page.displayName : undefined,
        bio: keepProfile ? page.bio : undefined,
        items: page.items.filter((_, i) => kept[i]),
        socials: keepSocials ? page.socials : [],
      });
      if (!result.ok) return setError(errorText(result.error));
      onImported(result.data);
    });
  }

  const hasProfile = Boolean(page?.displayName || page?.bio);
  const selected = kept.filter(Boolean).length;

  return (
    <Dialog open={open} onClose={onClose} title={t("title")} closeLabel={t("close")} variant="sheet">
      {!page ? (
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            read();
          }}
        >
          <p className="text-sm text-ink-2">{t("hint")}</p>
          <Field label={t("urlLabel")}>
            {({ id }) => (
              <Input
                id={id}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("urlPlaceholder")}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
              />
            )}
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex justify-end">
            <Button type="submit" size="md" pending={pending} pendingLabel={t("reading")} disabled={!url.trim()}>
              {t("read")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex max-h-[calc(94dvh-4rem)] flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto p-5">
            <p className="text-sm text-ink-2">{t("found", { items: page.items.length, socials: page.socials.length })}</p>

            {hasProfile && (
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={keepProfile} onChange={(e) => setKeepProfile(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-ink" />
                <span className="min-w-0 text-sm">
                  <span className="block font-medium">{t("nameAndBio")}</span>
                  <span className="block truncate text-ink-2">{[page.displayName, page.bio].filter(Boolean).join(" · ")}</span>
                </span>
              </label>
            )}

            {page.socials.length > 0 && (
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={keepSocials} onChange={(e) => setKeepSocials(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-ink" />
                <span className="min-w-0 text-sm">
                  <span className="block font-medium">{t("socials")}</span>
                  <span className="block text-ink-2">{page.socials.map((s) => SOCIAL_PLATFORMS[s.platform].label).join(", ")}</span>
                </span>
              </label>
            )}

            {page.items.length > 0 && (
              <ul className="flex flex-col divide-y divide-glass-edge rounded-[var(--radius-control)] border border-glass-edge">
                {page.items.map((item, i) => {
                  const Icon = KIND_ICON[item.kind];
                  const label = item.kind === "HEADER" ? item.text : item.kind === "LINK" ? item.title : item.url;
                  return (
                    <li key={i}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={kept[i] ?? false}
                          onChange={(e) => setKept((list) => list.map((v, j) => (j === i ? e.target.checked : v)))}
                          className="size-5 shrink-0 accent-ink"
                        />
                        <Icon size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-label={te(`types.${item.kind}`)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{label}</span>
                          {item.kind === "LINK" && <span className="block truncate text-xs text-ink-3">{item.url}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {error && <Notice tone="error">{error}</Notice>}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-glass-edge px-5 py-3">
            <Button variant="ghost" size="md" onClick={() => setPage(null)} disabled={pending}>
              {t("back")}
            </Button>
            <Button
              size="md"
              onClick={apply}
              pending={pending}
              pendingLabel={t("applying")}
              disabled={selected === 0 && !(hasProfile && keepProfile) && !(page.socials.length > 0 && keepSocials)}
            >
              {t("apply")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
