"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, ArrowDown, ArrowUp, CircleAlert, GripVertical, Heading, Link2, Mail, Minus, PlayCircle, Star, StarOff, Trash2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input, inputClass } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { parseBlock, TEXT_MAX, TITLE_MAX } from "@/lib/validation/blocks";
import { normalizeUrl } from "@/lib/validation/url";
import type { EditorBlock } from "../types";

/** Block types are told apart by icon, never by colour (DESIGN.md §6). */
export const BLOCK_ICON: Record<EditorBlock["type"], LucideIcon> = {
  LINK: Link2,
  HEADER: Heading,
  TEXT: AlignLeft,
  EMBED: PlayCircle,
  EMAIL_CAPTURE: Mail,
  DIVIDER: Minus,
};

type RowProps = {
  block: EditorBlock;
  index: number;
  count: number;
  autoFocus: boolean;
  onChange: (data: Record<string, string>) => void;
  onFlags: (flags: { isVisible?: boolean; isHighlighted?: boolean }) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
};

export function BlockRow({ block, index, count, autoFocus, onChange, onFlags, onMove, onDelete }: RowProps) {
  const t = useTranslations("editor");
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  // A stored (reloaded) address is judged immediately; a fresh one only after the field is left.
  const [urlTouched, setUrlTouched] = useState(Boolean(block.data.url));

  const complete = parseBlock(block.type, block.data) !== null;
  const urlInvalid = block.type === "LINK" && urlTouched && Boolean(block.data.url) && normalizeUrl(block.data.url ?? "") === null;
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
          {block.type === "DIVIDER" && <hr className="my-3 border-glass-edge" aria-hidden />}

          {!complete && block.type !== "DIVIDER" && !urlInvalid && (
            <p className="flex items-center gap-1.5 text-sm text-ink-2">
              <CircleAlert size={14} strokeWidth={1.75} aria-hidden />
              {t("incomplete")}
            </p>
          )}
        </div>

      </div>
    </li>
  );
}
