"use client";

import { ArrowDownToLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TEMPLATE_KEYS, type TemplateKey } from "../templates";

/** The empty editor's ways in: bring links from another page, or start from a template. The page keeps a single primary button (Add link). */
export function StartOptions({ onImport, onTemplate, busy }: { onImport: () => void; onTemplate: (key: TemplateKey) => void; busy: TemplateKey | null }) {
  const t = useTranslations();
  return (
    <div className="glass-flat flex flex-col items-center gap-5 rounded-[var(--radius-card)] px-6 py-10 text-center">
      <div className="flex flex-col gap-2">
        <p className="font-medium">{t("editor.empty")}</p>
        <p className="max-w-[40ch] text-sm text-ink-2">{t("editor.emptyHint")}</p>
      </div>
      <Button variant="secondary" size="md" onClick={onImport}>
        <ArrowDownToLine size={16} strokeWidth={1.75} aria-hidden />
        {t("import.open")}
      </Button>
      <div className="flex w-full flex-col items-center gap-3 border-t border-glass-edge pt-5">
        <p className="text-sm font-medium text-ink-2">{t("templates.title")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TEMPLATE_KEYS.map((key) => (
            <Button key={key} variant="secondary" size="md" onClick={() => onTemplate(key)} pending={busy === key} pendingLabel={t(`templates.names.${key}`)} disabled={busy !== null}>
              {t(`templates.names.${key}`)}
            </Button>
          ))}
        </div>
        <p className="max-w-[44ch] text-xs text-ink-3">{t("templates.hint")}</p>
      </div>
    </div>
  );
}
