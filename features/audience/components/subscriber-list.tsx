"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { removeSubscriber } from "../actions";

type Row = { id: string; email: string; createdAt: string };

export function SubscriberList({ initial }: { initial: Row[] }) {
  const t = useTranslations("audience");
  const format = useFormatter();
  const toast = useToast();
  const [rows, setRows] = useState(initial);

  return (
    <ul className="flex flex-col divide-y divide-glass-edge">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-3 py-2.5">
          <span className="min-w-0 flex-1 truncate">{row.email}</span>
          <span className="shrink-0 font-mono text-sm text-ink-3">{format.dateTime(new Date(row.createdAt), { dateStyle: "medium" })}</span>
          <button
            type="button"
            aria-label={`${t("remove")}: ${row.email}`}
            onClick={async () => {
              const previous = rows;
              setRows((r) => r.filter((x) => x.id !== row.id));
              const result = await removeSubscriber(row.id);
              if (!result.ok) setRows(previous);
              else toast({ tone: "success", message: t("removed") });
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-glass hover:text-negative"
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
