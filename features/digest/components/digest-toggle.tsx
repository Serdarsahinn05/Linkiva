"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { SaveIndicator } from "@/features/editor/components/save-indicator";
import { useAutosave } from "@/features/editor/components/use-autosave";
import { setWeeklyDigest } from "../actions";

/** Settings → Notifications: the weekly summary switch. */
export function DigestToggle({ initial }: { initial: boolean }) {
  const t = useTranslations("settings");
  const { state, schedule } = useAutosave();
  const [on, setOn] = useState(initial);

  function change(next: boolean) {
    setOn(next);
    schedule("digest", async () => (await setWeeklyDigest(next)).ok, true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{t("digest")}</p>
          <p className="text-sm text-ink-3">{t("digestHint")}</p>
        </div>
        <Switch checked={on} label={t("digest")} onChange={change} />
      </div>
      <div className="flex justify-end">
        <SaveIndicator state={state} />
      </div>
    </div>
  );
}
