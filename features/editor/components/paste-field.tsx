"use client";

import { ClipboardPaste } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { detectBlock, type Detected } from "../detect-block";

/** One field that takes any link and lets the editor decide what it becomes (link, player, or an import). */
export function PasteField({ onDetected, busy }: { onDetected: (detected: Detected) => Promise<void>; busy: boolean }) {
  const t = useTranslations("paste");
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  async function submit(text: string) {
    const detected = detectBlock(text);
    if (!detected) return setInvalid(true);
    setInvalid(false);
    await onDetected(detected);
    setValue("");
  }

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(value);
      }}
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <ClipboardPaste size={18} strokeWidth={1.75} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            aria-label={t("label")}
            aria-invalid={invalid}
            aria-describedby={invalid ? "paste-error" : undefined}
            value={value}
            placeholder={t("placeholder")}
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            className="pl-10"
            onChange={(e) => {
              setValue(e.target.value);
              setInvalid(false);
            }}
            // A paste into the empty field is taken as-is, no extra tap.
            onPaste={(e) => {
              if (value) return;
              e.preventDefault();
              void submit(e.clipboardData.getData("text"));
            }}
          />
        </div>
        <Button type="submit" variant="secondary" size="md" pending={busy} pendingLabel={t("add")} disabled={!value.trim()}>
          {t("add")}
        </Button>
      </div>
      {invalid && (
        <p id="paste-error" className="px-1 text-sm text-negative">
          {t("invalid")}
        </p>
      )}
    </form>
  );
}
