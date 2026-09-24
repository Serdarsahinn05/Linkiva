"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";

/** ISO → value for <input type="datetime-local"> in the viewer's local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

type Schedule = { startsAt: string | null; endsAt: string | null };

export function ScheduleDialog({ open, initial, onClose, onSave }: { open: boolean; initial: Schedule; onClose: () => void; onSave: (s: Schedule) => void }) {
  const t = useTranslations("editor");
  const [start, setStart] = useState(toLocalInput(initial.startsAt));
  const [end, setEnd] = useState(toLocalInput(initial.endsAt));
  const orderError = Boolean(start && end && new Date(start) >= new Date(end));

  return (
    <Dialog open={open} onClose={onClose} title={t("scheduleTitle")} closeLabel={t("closePreview")}>
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (orderError) return;
          onSave({ startsAt: fromLocalInput(start), endsAt: fromLocalInput(end) });
        }}
      >
        <p className="text-sm text-ink-2">{t("scheduleHint")}</p>
        <Field label={t("startsAt")}>{({ id }) => <Input id={id} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
        <Field label={t("endsAt")} error={orderError ? t("scheduleOrder") : undefined}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="datetime-local" value={end} aria-invalid={invalid} aria-describedby={describedBy} onChange={(e) => setEnd(e.target.value)} />
          )}
        </Field>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {(initial.startsAt || initial.endsAt) && (
            <Button variant="ghost" size="md" onClick={() => onSave({ startsAt: null, endsAt: null })}>
              {t("scheduleClear")}
            </Button>
          )}
          <Button type="submit" size="md" disabled={orderError}>
            {t("scheduleSave")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
