"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { profileLabels } from "@/components/blocks/labels";
import { ProfileView } from "@/components/blocks/profile-view";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Field, Input, inputClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { liveBlocks } from "@/lib/schedule";
import { EDITABLE_BLOCK_TYPES, type EditableBlockType } from "@/lib/validation/blocks";
import { displayHost } from "@/lib/validation/url";
import type { AppliedImport } from "@/features/import/actions";
import { ImportDialog } from "@/features/import/components/import-dialog";
import { addBlock, applyTemplate, deleteBlock, reorderBlocks, restoreBlock, setBlockFlags, setBlockSchedule, setSocial, updateBlock, updateProfileBasics } from "../actions";
import { detectBlock, type Detected } from "../detect-block";
import type { TemplateKey } from "../templates";
import type { EditorBlock, EditorProfile, EditorSocials } from "../types";
import { AvatarUploader } from "./avatar-uploader";
import { PageHeader, Section } from "@/features/dashboard/components/page";
import { useRegisterPreview } from "@/features/dashboard/components/preview-context";
import { BLOCK_ICON, BlockRow } from "./block-row";
import { PasteField } from "./paste-field";
import { SocialsEditor } from "./socials-editor";
import { StartOptions } from "./start-options";
import { SaveIndicator } from "./save-indicator";
import { useAutosave } from "./use-autosave";

type Props = { profile: EditorProfile; blocks: EditorBlock[]; socials: EditorSocials; userId: string; uploadsEnabled: boolean };

export function Editor({ profile: initialProfile, blocks: initialBlocks, socials: initialSocials, userId, uploadsEnabled }: Props) {
  const t = useTranslations();
  const toast = useToast();
  const { state: saveState, schedule } = useAutosave();
  const [profile, setProfile] = useState(initialProfile);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [socials, setSocials] = useState(initialSocials);
  // dnd-kit numbers its a11y ids with a module counter that differs between server and client; pin it.
  const dndId = useId();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [adding, setAdding] = useState<EditableBlockType | null>(null);
  const [pasting, setPasting] = useState(false);
  const [templating, setTemplating] = useState<TemplateKey | null>(null);
  // null: closed; a string: open, prefilled with that address.
  const [importUrl, setImportUrl] = useState<string | null>(null);

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

  // ─── Smart paste ───
  async function addDetected(detected: Detected) {
    if (detected.kind === "IMPORT") {
      toast({ tone: "success", message: t("paste.importOffer") });
      return setImportUrl(detected.url);
    }
    setPasting(true);
    const result = await addBlock(detected.kind, detected.kind === "EMBED" ? { url: detected.url } : { title: detected.title, url: detected.url });
    setPasting(false);
    if (!result.ok) return saveError();
    setBlocks((list) => [result.data, ...list]);
    if (detected.kind === "LINK") return toast({ tone: "success", message: t("paste.addedLink") });
    // A player was guessed; one tap turns it back into a plain link.
    toast({
      tone: "success",
      message: t("paste.addedEmbed"),
      action: {
        label: t("paste.asLink"),
        onClick: async () => {
          const link = await addBlock("LINK", { title: displayHost(detected.url), url: detected.url });
          if (!link.ok) return saveError();
          await deleteBlock(result.data.id);
          setBlocks((list) => [link.data, ...list.filter((b) => b.id !== result.data.id)]);
        },
      },
    });
  }

  // A link pasted anywhere on the page (outside a field or dialog) is added the same way.
  const onPaste = useEffectEvent((e: ClipboardEvent) => {
    if (e.target instanceof Element && e.target.closest("input, textarea, [contenteditable], dialog")) return;
    const detected = detectBlock(e.clipboardData?.getData("text") ?? "");
    if (!detected) return;
    e.preventDefault();
    void addDetected(detected);
  });
  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  // ─── Import and templates ───
  function imported(result: AppliedImport) {
    setImportUrl(null);
    setBlocks((list) => [...list, ...result.blocks]);
    setSocials((s) => ({ ...s, ...result.socials }));
    setProfile((p) => ({ ...p, displayName: result.displayName ?? p.displayName, bio: result.bio ?? p.bio }));
    toast({
      tone: "success",
      message: [t("import.done", { count: result.blocks.length }), result.skipped ? t("import.skipped", { count: result.skipped }) : ""].filter(Boolean).join(" "),
    });
  }

  async function startFromTemplate(key: TemplateKey) {
    setTemplating(key);
    const result = await applyTemplate(key);
    setTemplating(null);
    if (!result.ok) return saveError();
    setBlocks((list) => [...list, ...result.data]);
    toast({ tone: "success", message: t("templates.applied") });
  }

  function changeBlock(id: string, data: Record<string, string>) {
    setBlocks((list) => list.map((b) => (b.id === id ? { ...b, data } : b)));
    schedule(`block:${id}`, async () => (await updateBlock(id, data)).ok);
  }

  function flagBlock(id: string, flags: { isVisible?: boolean; isHighlighted?: boolean }) {
    setBlocks((list) => list.map((b) => (b.id === id ? { ...b, ...flags } : b)));
    schedule(`flags:${id}`, async () => (await setBlockFlags(id, flags)).ok, true);
  }

  function scheduleBlock(id: string, sched: { startsAt: string | null; endsAt: string | null }) {
    setBlocks((list) => list.map((b) => (b.id === id ? { ...b, ...sched } : b)));
    schedule(`schedule:${id}`, async () => (await setBlockSchedule(id, sched)).ok, true);
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
    // Same rule as the public page: hidden and out-of-schedule blocks are not shown.
        blocks: liveBlocks(blocks.filter((b) => b.isVisible)),
    socials: Object.entries(socials).map(([platform, handle]) => ({ platform: platform as SocialPlatform, handle: handle ?? "" })),
  };
  const preview = <ProfileView profile={previewProfile} mode="preview" labels={profileLabels(t)} />;
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
          {/* Touch screens swipe the row; wider screens (mouse, no sideways wheel) wrap it instead. */}
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
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

          <PasteField onDetected={addDetected} busy={pasting} />

          {blocks.length === 0 ? (
            <StartOptions onImport={() => setImportUrl("")} onTemplate={startFromTemplate} busy={templating} />
          ) : (
            <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-2.5">
                  {blocks.map((block, index) => (
                    <BlockRow
                      key={block.id}
                      block={block}
                      index={index}
                      count={blocks.length}
                      autoFocus={block.id === focusId}
                      userId={userId}
                      uploadsEnabled={uploadsEnabled}
                      onChange={(data) => changeBlock(block.id, data)}
                      onFlags={(flags) => flagBlock(block.id, flags)}
                      onMove={(direction) => move(block.id, direction)}
                      onDelete={() => remove(block.id)}
                      onSchedule={(sched) => scheduleBlock(block.id, sched)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>

      {importUrl !== null && <ImportDialog open initialUrl={importUrl} onClose={() => setImportUrl(null)} onImported={imported} />}

      {/* Desktop live preview: a glass phone. On mobile the tab bar's Preview opens it. */}
      <aside aria-label={t("editor.previewTitle")} className="hidden lg:block">
        <div className="sticky top-6">
          <div className="glass rounded-[44px] p-2.5">
            <div className="relative h-[760px] overflow-y-auto overscroll-contain rounded-[36px] bg-bg [scrollbar-width:none]">
              <div className="relative h-full">{preview}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
