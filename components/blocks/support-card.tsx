"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { formatIban } from "@/lib/validation/iban";
import type { ProfileLabels } from "./labels";

type Props = {
  blockId: string;
  /** Present on the public page only; a copy is then counted like a click (docs/ARCHITECTURE.md §7). */
  profileId?: string;
  name: string;
  iban?: string;
  note?: string;
  inert: boolean;
  labels: ProfileLabels;
};

/** SUPPORT block body: name and IBAN, each copyable. Without JS the text is still selectable. */
export function SupportCard({ blockId, profileId, name, iban, note, inert, labels }: Props) {
  const [copied, setCopied] = useState<"name" | "iban" | null>(null);

  async function copy(what: "name" | "iban", text: string) {
    if (inert) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // Clipboard blocked (in-app browsers): the text stays selectable.
    }
    setCopied(what);
    setTimeout(() => setCopied((c) => (c === what ? null : c)), 2000);
    if (profileId) navigator.sendBeacon("/api/e", JSON.stringify({ p: profileId, b: blockId, k: "copy" }));
  }

  const button = (what: "name" | "iban", text: string, label: string) => (
    <button
      type="button"
      onClick={() => void copy(what, text)}
      tabIndex={inert ? -1 : undefined}
      aria-label={copied === what ? labels.supportCopied : label}
      className="glass flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-glass-strong"
    >
      {copied === what ? <Check size={18} className="text-positive" aria-hidden /> : <Copy size={18} strokeWidth={1.75} aria-hidden />}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {note && <p className="text-center text-[0.9375rem] text-pretty">{note}</p>}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-medium select-all">{name}</p>
          {iban && (
            <p lang="en" translate="no" className="font-mono text-[0.9375rem] tabular-nums text-ink-2 select-all">
              {formatIban(iban)}
            </p>
          )}
        </div>
        {iban ? button("iban", iban, labels.supportCopyIban) : button("name", name, labels.supportCopyName)}
      </div>
      <span role="status" className="sr-only">
        {copied ? labels.supportCopied : ""}
      </span>
    </div>
  );
}
