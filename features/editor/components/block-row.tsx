"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, ArrowDown, ArrowUp, CalendarClock, CircleAlert, GripVertical, Heading, ImageIcon, Link2, Mail, Minus, PlayCircle, Star, StarOff, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Input, inputClass } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { ALT_MAX, parseBlock, TEXT_MAX, TITLE_MAX } from "@/lib/validation/blocks";
import { parseEmbed } from "@/lib/embeds";
import { normalizeUrl } from "@/lib/validation/url";
import { ImageField } from "./image-field";
import { ScheduleDialog } from "./schedule-dialog";
import type { EditorBlock } from "../types";

/** Block types are told apart by icon, never by colour (DESIGN.md §6). */
export const BLOCK_ICON: Record<EditorBlock["type"], LucideIcon> = {
  LINK: Link2,
  HEADER: Heading,
  TEXT: AlignLeft,
  IMAGE: ImageIcon,
  EMBED: PlayCircle,
  EMAIL_CAPTURE: Mail,
  DIVIDER: Minus,
};

type RowProps = {
  block: EditorBlock;
  index: number;
  count: number;
  autoFocus: boolean;
  userId: string;
  uploadsEnabled: boolean;
  onChange: (data: Record<string, string>) => void;
  onFlags: (flags: { isVisible?: boolean; isHighlighted?: boolean }) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onSchedule: (schedule: { startsAt: string | null; endsAt: string | null }) => void;
};

export function BlockRow({ block, index, count, autoFocus, userId, uploadsEnabled, onChange, onFlags, onMove, onDelete, onSchedule }: RowProps) {
  const t = useTranslations("editor");
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  // A stored (reloaded) address is judged immediately; a fresh one only after the field is left.
  const [urlTouched, setUrlTouched] = useState(Boolean(block.data.url));
  const [scheduling, setScheduling] = useState(false);
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 }).getTime();
  const when = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });
  const scheduleNote =
    block.endsAt && Date.parse(block.endsAt) <= now
      ? { tone: "text-ink-3", text: t("expired") }
      : block.startsAt && Date.parse(block.startsAt) > now
        ? { tone: "text-info", text: t("scheduledFor", { date: when(block.startsAt) }) }
        : block.endsAt
          ? { tone: "text-ink-2", text: t("activeUntil", { date: when(block.endsAt) }) }
          : null;
  const embedInvalid = block.type === "EMBED" && urlTouched && Boolean(block.data.url) && parseEmbed(block.data.url ?? "") === null;

  const complete = parseBlock(block.type, block.data) !== null;
  const urlInvalid = (block.type === "LINK" || block.type === "IMAGE") && urlTouched && Boolean(block.data.url) && normalizeUrl(block.data.url ?? "") === null;
  const TypeIcon = BLOCK_ICON[block.type];
  const field = (key: string) => block.data[key] ?? "";
  const set = (key: string, value: string) => onChange({ ...block.data, [key]: value });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "glass-flat relative rounded-[var(--radius-card)]",
        isDragging && "glass z-10 scale-[1.02] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]",
        !block.isVisible && "opacity-70",
      )}
    >
      <div className="flex items-start gap-1 p-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("drag")}
          title={t("drag")}
          className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-ink-3 hover:bg-glass hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={20} strokeWidth={1.75} aria-hidden />
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
              <TypeIcon size={16} strokeWidth={1.75} aria-hidden />
              {t(`types.${block.type}`)}
            </span>
            {block.isHighlighted && <Star size={14} className="fill-ink text-ink" aria-label={t("highlight")} />}
            <div className="-my-2 ml-auto flex shrink-0 items-center">
              <Switch checked={block.isVisible} onChange={(isVisible) => onFlags({ isVisible })} label={t("visible")} />
              <Menu
                label={t("more")}
                items={[
                  ...(block.type === "LINK"
                    ? [
                        {
                          label: block.isHighlighted ? t("unhighlight") : t("highlight"),
                          icon: block.isHighlighted ? <StarOff size={18} strokeWidth={1.75} /> : <Star size={18} strokeWidth={1.75} />,
                          onSelect: () => onFlags({ isHighlighted: !block.isHighlighted }),
                        },
                      ]
                    : []),
                  { label: t("schedule"), icon: <CalendarClock size={18} strokeWidth={1.75} />, onSelect: () => setScheduling(true) },
              { label: t("moveUp"), icon: <ArrowUp size={18} strokeWidth={1.75} />, onSelect: () => onMove(-1), disabled: index === 0 },
                  { label: t("moveDown"), icon: <ArrowDown size={18} strokeWidth={1.75} />, onSelect: () => onMove(1), disabled: index === count - 1 },
                  { label: t("delete"), icon: <Trash2 size={18} strokeWidth={1.75} />, onSelect: onDelete, danger: true },
                ]}
              />
            </div>
          </div>

          {block.type === "LINK" && (
            <>
              <Input
                aria-label={t("fields.title")}
                placeholder={t("placeholders.title")}
                value={field("title")}
                maxLength={TITLE_MAX}
                autoFocus={autoFocus}
                onChange={(e) => set("title", e.target.value)}
                className="font-semibold"
              />
              <Input
                aria-label={t("fields.url")}
                placeholder={t("placeholders.url")}
                value={field("url")}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={2048}
                aria-invalid={urlInvalid}
                onChange={(e) => set("url", e.target.value)}
                onBlur={() => setUrlTouched(true)}
                className="text-[0.9375rem] text-ink-2"
              />
              {urlInvalid && <p className="text-sm text-negative">{t("urlInvalid")}</p>}
            </>
          )}
          {block.type === "HEADER" && (
            <Input
              aria-label={t("fields.headerText")}
              placeholder={t("placeholders.headerText")}
              value={field("text")}
              maxLength={TITLE_MAX}
              autoFocus={autoFocus}
              onChange={(e) => set("text", e.target.value)}
              className="font-semibold"
            />
          )}
          {block.type === "TEXT" && (
            <textarea
              aria-label={t("fields.text")}
              placeholder={t("placeholders.text")}
              value={field("text")}
              maxLength={TEXT_MAX}
              rows={3}
              autoFocus={autoFocus}
              onChange={(e) => set("text", e.target.value)}
              className={cn(inputClass, "resize-y py-2 leading-normal")}
            />
          )}
          {block.type === "IMAGE" && (
            <>
              <ImageField userId={userId} blockId={block.id} src={field("src")} enabled={uploadsEnabled} onUploaded={(image) => onChange({ ...block.data, ...image })} />
              <Input
                aria-label={t("image.alt")}
                placeholder={t("image.altPlaceholder")}
                title={t("image.altHint")}
                value={field("alt")}
                maxLength={ALT_MAX}
                onChange={(e) => set("alt", e.target.value)}
              />
              <Input aria-label={t("image.caption")} placeholder={t("image.caption")} value={field("title")} maxLength={TITLE_MAX} onChange={(e) => set("title", e.target.value)} />
              <Input
                aria-label={t("image.link")}
                placeholder={t("image.linkPlaceholder")}
                value={field("url")}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={2048}
                aria-invalid={urlInvalid}
                onChange={(e) => set("url", e.target.value)}
                onBlur={() => setUrlTouched(true)}
                className="text-[0.9375rem] text-ink-2"
              />
              {urlInvalid && <p className="text-sm text-negative">{t("urlInvalid")}</p>}
            </>
          )}
          {block.type === "EMBED" && (
            <>
              <Input
                aria-label={t("embedUrl")}
                placeholder={t("embedPlaceholder")}
                value={field("url")}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={2048}
                autoFocus={autoFocus}
                aria-invalid={embedInvalid}
                onChange={(e) => set("url", e.target.value)}
                onBlur={() => setUrlTouched(true)}
              />
              {embedInvalid && <p className="text-sm text-negative">{t("embedInvalid")}</p>}
            </>
          )}
          {block.type === "EMAIL_CAPTURE" && (
            <>
              <Input aria-label={t("captureTitle")} placeholder={t("captureTitle")} value={field("title")} maxLength={TITLE_MAX} autoFocus={autoFocus} onChange={(e) => set("title", e.target.value)} />
              <p className="text-sm text-ink-3">
                {t("captureHint")}{" "}
                <Link href="/dashboard/audience" className="font-medium text-ink underline underline-offset-4">
                  {t("captureLink")}
                </Link>
              </p>
            </>
          )}
          {block.type === "DIVIDER" && <hr className="my-3 border-glass-edge" aria-hidden />}
          {scheduleNote && (
            <p className={cn("flex items-center gap-1.5 text-sm", scheduleNote.tone)}>
              <CalendarClock size={14} strokeWidth={1.75} aria-hidden />
              {scheduleNote.text}
            </p>
          )}

          {!complete && block.type !== "DIVIDER" && !urlInvalid && !embedInvalid && (
            <p className="flex items-center gap-1.5 text-sm text-ink-2">
              <CircleAlert size={14} strokeWidth={1.75} aria-hidden />
              {t("incomplete")}
            </p>
          )}
        </div>

      </div>
      {scheduling && (
        <ScheduleDialog
          open
          initial={{ startsAt: block.startsAt, endsAt: block.endsAt }}
          onClose={() => setScheduling(false)}
          onSave={(schedule) => {
            setScheduling(false);
            onSchedule(schedule);
          }}
        />
      )}
    </li>
  );
}
