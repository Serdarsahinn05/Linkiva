"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input, inputClass } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { updatePublishing } from "@/features/editor/actions";
import { SaveIndicator } from "@/features/editor/components/save-indicator";
import { useAutosave } from "@/features/editor/components/use-autosave";
import { cn } from "@/lib/cn";

type Values = { isPublished: boolean; seoTitle: string; seoDescription: string };

export function PublishingForm({ initial }: { initial: Values }) {
  const t = useTranslations("publishing");
  const { state, schedule } = useAutosave(600);
  const [values, setValues] = useState(initial);

  function change(patch: Partial<Values>, immediate = false) {
    const next = { ...values, ...patch };
    setValues(next);
    schedule("publishing", async () => (await updatePublishing(next)).ok, immediate);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{t("published")}</p>
          <p className="text-sm text-ink-3">{t("publishedHint")}</p>
        </div>
        <Switch checked={values.isPublished} label={t("published")} onChange={(isPublished) => change({ isPublished }, true)} />
      </div>
      <Field label={t("seoTitle")} hint={t("seoTitleHint")}>
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} maxLength={70} value={values.seoTitle} onChange={(e) => change({ seoTitle: e.target.value })} />}
      </Field>
      <Field label={t("seoDescription")} hint={t("seoDescriptionHint")}>
        {({ id, describedBy }) => (
          <textarea
            id={id}
            aria-describedby={describedBy}
            maxLength={160}
            rows={2}
            value={values.seoDescription}
            onChange={(e) => change({ seoDescription: e.target.value })}
            className={cn(inputClass, "h-auto resize-y py-3 leading-normal")}
          />
        )}
      </Field>
      <div className="flex justify-end">
        <SaveIndicator state={state} />
      </div>
    </div>
  );
}
