"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Check, CircleAlert, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { ProfileView } from "@/components/blocks/profile-view";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, inputClass } from "@/components/ui/field";
import { Tape } from "@/components/ui/tape";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { EDITABLE_BLOCK_TYPES, type EditableBlockType } from "@/lib/validation/blocks";
import { addBlock, deleteBlock, reorderBlocks, restoreBlock, setBlockFlags, setSocial, updateBlock, updateProfileBasics } from "../actions";
import type { EditorBlock, EditorProfile, EditorSocials } from "../types";
import { AvatarUploader } from "./avatar-uploader";
import { BLOCK_TONE, BlockRow } from "./block-row";
import { SocialsEditor } from "./socials-editor";
import { useAutosave, type SaveState } from "./use-autosave";

type Props = { profile: EditorProfile; blocks: EditorBlock[]; socials: EditorSocials; userId: string; uploadsEnabled: boolean };

export function Editor({ profile: initialProfile, blocks: initialBlocks, socials: initialSocials, userId, uploadsEnabled }: Props) {
  const t = useTranslations();
  const toast = useToast();
  const { state: saveState, schedule } = useAutosave();
  const [profile, setProfile] = useState(initialProfile);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [socials, setSocials] = useState(initialSocials);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [adding, setAdding] = useState<EditableBlockType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const saveError = () => toast({ tone: "error", message: t("editor.saveError") });

  // ─── Profile header ───
  function changeBasics(next: Partial<Pick<EditorProfile, "displayName" | "bio">>) {
    const merged = { ...profile, ...next };
    setProfile(merged);
    schedule("basics", async () => (await updateProfileBasics({ displayName: merged.displayName, bio: merged.bio })).ok);
  }

  // ─── Blocks ───
  async function add(type: EditableBlockType) {
    setAdding(type);
    const result = await addBlock(type);
    setAdding(null);
    if (!result.ok) return saveError();
    setBlocks((list) => [result.data, ...list]);
    setFocusId(result.data.id);
  }

  function changeBlock(id: string, data: Record<string, string>) {
    setBlocks((list) => list.map((b) => (b.id === id ? { ...b, data } : b)));
    schedule(`block:${id}`, async () => (await updateBlock(id, data)).ok);
  }

  function flagBlock(id: string, flags: { isVisible?: boolean; isHighlighted?: boolean }) {
    setBlocks((list) => list.map((b) => (b.id === id ? { ...b, ...flags } : b)));
    schedule(`flags:${id}`, async () => (await setBlockFlags(id, flags)).ok, true);
  }

  async function persistOrder(next: EditorBlock[], previous: EditorBlock[]) {
    setBlocks(next);
    schedule(
      "order",
      async () => {
        const result = await reorderBlocks(next.map((b) => b.id));
        if (!result.ok) setBlocks(previous);
        return result.ok;
      },
      true,
    );
  }

  function move(id: string, direction: -1 | 1) {
    const from = blocks.findIndex((b) => b.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= blocks.length) return;
    void persistOrder(arrayMove(blocks, from, to), blocks);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    void persistOrder(arrayMove(blocks, from, to), blocks);
  }

  async function remove(id: string) {
    const index = blocks.findIndex((b) => b.id === id);
    const previous = blocks;
    setBlocks((list) => list.filter((b) => b.id !== id));
    const result = await deleteBlock(id);
    if (!result.ok) {
      setBlocks(previous);
      return saveError();
    }
    // Undo instead of a confirmation dialog (DESIGN.md §5).
    toast({
      tone: "success",
      message: t("editor.deleted"),
      action: {
        label: t("editor.undo"),
        onClick: async () => {
          // Recreated with its original id and position, so no reorder is needed.
          const restored = await restoreBlock(result.data);
          if (!restored.ok) return saveError();
          setBlocks((list) => {
            const next = [...list];
            next.splice(Math.min(index, next.length), 0, restored.data);
            return next;
          });
        },
      },
    });
  }

  // ─── Socials ───
  async function saveSocial(platform: SocialPlatform, value: string) {
    const result = await setSocial(platform, value);
    if (!result.ok) return undefined;
    setSocials((s) => {
      const next = { ...s };
      if (result.data === null) delete next[platform];
      else next[platform] = result.data;
      return next;
    });
    return result.data;
  }

  const previewProfile = {
    ...profile,
    displayName: profile.displayName || null,
    bio: profile.bio || null,
    blocks: blocks.filter((b) => b.isVisible),
    socials: Object.entries(socials).map(([platform, handle]) => ({ platform: platform as SocialPlatform, handle: handle ?? "" })),
  };
  const preview = <ProfileView profile={previewProfile} mode="preview" labels={{ madeWith: t("profile.madeWith") }} />;

  return (
    <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:py-10">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[2.441rem] leading-none font-extrabold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">{t("editor.title")}</h1>
          <SaveIndicator state={saveState} />
        </div>

        {/* Profile header */}
        <section aria-labelledby="profile-heading" className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-hairline bg-panel p-4">
          <h2 id="profile-heading" className="font-semibold">
            {t("editor.profile")}
          </h2>
          <AvatarUploader userId={userId} url={profile.avatarUrl} enabled={uploadsEnabled} onChange={(avatarUrl) => setProfile((p) => ({ ...p, avatarUrl }))} />
          <Field label={t("editor.displayName")}>
            {({ id }) => <Input id={id} value={profile.displayName} maxLength={60} onChange={(e) => changeBasics({ displayName: e.target.value })} />}
          </Field>
          <Field label={t("editor.bio")} hint={t("editor.bioHint")}>
            {({ id, describedBy }) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                value={profile.bio}
                maxLength={160}
                rows={2}
                onChange={(e) => changeBasics({ bio: e.target.value })}
                className={cn(inputClass, "resize-y py-2 leading-normal")}
              />
            )}
          </Field>
        </section>

        <SocialsEditor socials={socials} onSave={saveSocial} />

        {/* Blocks */}
        <section aria-labelledby="blocks-heading" className="flex flex-col gap-4">
          <h2 id="blocks-heading" className="font-semibold">
            {t("editor.blocks")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {EDITABLE_BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                disabled={adding !== null}
                aria-label={t("editor.addBlock", { type: t(`editor.types.${type}`) })}
                className="tape tape-type min-h-11 gap-1.5 pr-5 text-xs"
                data-tone={BLOCK_TONE[type] === "black" ? undefined : BLOCK_TONE[type]}
              >
                {adding === type ? <span className="print-dots" aria-hidden /> : <Plus size={14} aria-hidden />}
                {t(`editor.types.${type}`)}
              </button>
            ))}
          </div>

          {blocks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-panel)] border border-dashed border-hairline px-4 py-12 text-center">
              <Tape tone="grey" size="md" className="opacity-70">
                {t("editor.empty")}
              </Tape>
              <p className="max-w-[40ch] text-sm text-ink-2">{t("editor.emptyHint")}</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-2">
                  {blocks.map((block, index) => (
                    <BlockRow
                      key={block.id}
                      block={block}
                      index={index}
                      count={blocks.length}
                      autoFocus={block.id === focusId}
                      onChange={(data) => changeBlock(block.id, data)}
                      onFlags={(flags) => flagBlock(block.id, flags)}
                      onMove={(direction) => move(block.id, direction)}
                      onDelete={() => remove(block.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>

      {/* Live preview: sticky phone on desktop, full-screen sheet on mobile. */}
      <aside aria-label={t("editor.previewTitle")} className="hidden lg:block">
        <div className="sticky top-8">
          <div className="h-[760px] overflow-y-auto overscroll-contain rounded-[var(--radius-panel)] border border-ink/80 bg-ground shadow-[var(--shadow-pop)]">
            {preview}
          </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="tape tape-type fixed right-4 bottom-4 z-20 min-h-12 gap-2 shadow-[var(--shadow-pop)] lg:hidden"
        data-tone="red"
      >
        <Eye size={16} aria-hidden />
        {t("nav.preview")}
      </button>
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title={t("editor.previewTitle")} closeLabel={t("editor.closePreview")} variant="sheet">
        <div className="h-[80dvh] overflow-y-auto">{preview}</div>
      </Dialog>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations("editor");
  if (state === "idle") return null;
  return (
    <p role="status" className={cn("flex items-center gap-1.5 text-sm", state === "error" ? "text-danger" : "text-ink-2")}>
      {state === "saving" && <span className="print-dots" aria-hidden />}
      {state === "saved" && <Check size={16} strokeWidth={1.75} className="text-tape-green" aria-hidden />}
      {state === "error" && <CircleAlert size={16} strokeWidth={1.75} aria-hidden />}
      {state === "saving" ? t("saving") : state === "saved" ? t("saved") : t("saveError")}
    </p>
  );
}
