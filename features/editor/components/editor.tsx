"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { ProfileView } from "@/components/blocks/profile-view";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Field, Input, inputClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { EDITABLE_BLOCK_TYPES, type EditableBlockType } from "@/lib/validation/blocks";
import { addBlock, deleteBlock, reorderBlocks, restoreBlock, setBlockFlags, setSocial, updateBlock, updateProfileBasics } from "../actions";
import type { EditorBlock, EditorProfile, EditorSocials } from "../types";
import { AvatarUploader } from "./avatar-uploader";
import { PageHeader, Section } from "@/features/dashboard/components/page";
import { useRegisterPreview } from "@/features/dashboard/components/preview-context";
import { BLOCK_ICON, BlockRow } from "./block-row";
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
  // The mobile tab bar's "Preview" shows this live (unsaved) preview while the editor is open.
  useRegisterPreview(preview);

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:py-10">
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader title={t("editor.title")}>
          <SaveIndicator state={saveState} />
        </PageHeader>

        {/* Profile header */}
        <Section title={t("editor.profile")}>
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
                className={cn(inputClass, "h-auto resize-y py-3 leading-normal")}
              />
            )}
          </Field>
        </Section>

        <SocialsEditor socials={socials} onSave={saveSocial} />

        {/* Blocks */}
        <section aria-labelledby="blocks-heading" className="flex flex-col gap-3">
          <h2 id="blocks-heading" className="px-1 text-[0.9375rem] font-semibold text-ink-2">
            {t("editor.blocks")}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {EDITABLE_BLOCK_TYPES.map((type) => {
              const Icon = BLOCK_ICON[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  disabled={adding !== null}
                  aria-label={t("editor.addBlock", { type: t(`editor.types.${type}`) })}
                  className={cn(buttonBase, buttonVariants[type === "LINK" ? "primary" : "secondary"], buttonSizes.md, "shrink-0 px-4")}
                >
                  {adding === type ? <span className="dots" aria-hidden /> : <Icon size={16} strokeWidth={1.75} aria-hidden />}
                  {t(`editor.types.${type}`)}
                </button>
              );
            })}
          </div>

          {blocks.length === 0 ? (
            <div className="glass-flat flex flex-col items-center gap-2 rounded-[var(--radius-card)] px-6 py-14 text-center">
              <p className="font-medium">{t("editor.empty")}</p>
              <p className="max-w-[40ch] text-sm text-ink-2">{t("editor.emptyHint")}</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-2.5">
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

      {/* Desktop live preview: a glass phone. On mobile the tab bar's Preview opens it. */}
      <aside aria-label={t("editor.previewTitle")} className="hidden lg:block">
        <div className="sticky top-6">
          <div className="glass rounded-[44px] p-2.5">
            <div className="relative h-[760px] overflow-y-auto overscroll-contain rounded-[36px] bg-bg [scrollbar-width:none]">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]" aria-hidden>
                <div className="ambient !absolute" />
              </div>
              <div className="relative">{preview}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations("editor");
  if (state === "idle") return null;
  return (
    <p role="status" className={cn("glass-flat flex h-9 items-center gap-2 rounded-full px-3.5 text-sm", state === "error" ? "text-negative" : "text-ink-2")}>
      {state === "saving" && <span className="dots" aria-hidden />}
      {state === "saved" && <span className="neon size-1.5 rounded-full bg-positive text-positive" aria-hidden />}
      {state === "error" && <CircleAlert size={16} strokeWidth={1.75} aria-hidden />}
      {state === "saving" ? t("saving") : state === "saved" ? t("saved") : t("saveError")}
    </p>
  );
}
