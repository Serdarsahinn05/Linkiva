"use client";

import { Check, Copy, Download, ExternalLink, QrCode, Smartphone } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { profileDisplayUrl, profileUrl } from "@/lib/site";
import { STORY_LOOKS, storyPath, type StoryLook } from "@/lib/story";

const iconButton = "flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-glass-strong hover:text-ink";

/** Profile address with copy, open and QR. The QR encodes the configured domain (v1 bug B7). */
export function SharePanel({ username, domain }: { username: string; domain: string | null }) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [story, setStory] = useState<"idle" | "busy" | "failed">("idle");
  const [look, setLook] = useState<StoryLook>("profile");
  const qrWrap = useRef<HTMLDivElement>(null);
  const url = profileUrl(username, domain);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function download(kind: "png" | "svg") {
    const a = document.createElement("a");
    a.download = `linkiva-${username}.${kind}`;
    if (kind === "png") {
      const canvas = qrWrap.current?.querySelector("canvas");
      if (!canvas) return;
      a.href = canvas.toDataURL("image/png");
    } else {
      const svg = qrWrap.current?.querySelector("svg");
      if (!svg) return;
      a.href = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml" }));
    }
    a.click();
  }

  /**
   * The 1080×1920 story image (app/(profile)/[username]/story): handed to the share sheet on touch devices (straight into
   * Instagram), downloaded elsewhere. Desktop Chrome can share files too, but a download is what people expect there.
   */
  async function shareStory() {
    setStory("busy");
    try {
      const res = await fetch(storyPath(username, look));
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], `linkiva-${username}-story.png`, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch((error: unknown) => {
          // Closing the share sheet is not a failure.
          if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
        });
      } else {
        const a = document.createElement("a");
        a.download = file.name;
        a.href = URL.createObjectURL(file);
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setStory("idle");
    } catch {
      setStory("failed");
    }
  }

  return (
    <div className="glass-flat flex flex-col gap-2 rounded-[var(--radius-control)] p-3">
      <span className="text-xs text-ink-3">{t("address")}</span>
      <span lang="en" translate="no" className="truncate text-sm font-medium">
        {profileDisplayUrl(username, domain)}
      </span>
      <div className="-mx-1 flex items-center">
        <button type="button" onClick={copy} className={iconButton} aria-label={copied ? t("copied") : t("copy")} title={t("copy")}>
          {copied ? <Check size={17} strokeWidth={2} className="text-positive" aria-hidden /> : <Copy size={17} strokeWidth={1.75} aria-hidden />}
        </button>
        <a href={url} target="_blank" rel="noopener" className={iconButton} aria-label={t("open")} title={t("open")}>
          <ExternalLink size={17} strokeWidth={1.75} aria-hidden />
        </a>
        <button type="button" onClick={() => setQrOpen(true)} className={iconButton} aria-label={t("qr")} title={t("qr")}>
          <QrCode size={17} strokeWidth={1.75} aria-hidden />
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? t("copied") : ""}
        </span>
      </div>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} title={t("qrTitle")} closeLabel={t("close")}>
        <div className="flex flex-col items-center gap-5 p-6">
          <p className="text-center text-ink-2">{t("qrBody")}</p>
          <div ref={qrWrap} className="rounded-[var(--radius-card)] bg-white p-5 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.4)]">
            <QRCodeSVG value={url} size={208} level="M" marginSize={0} />
            <QRCodeCanvas value={url} size={1024} level="M" marginSize={2} className="hidden" />
          </div>
          <span lang="en" className="text-sm text-ink-2">
            {profileDisplayUrl(username, domain)}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => download("png")} className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
              <Download size={16} aria-hidden />
              {t("downloadPng")}
            </button>
            <button type="button" onClick={() => download("svg")} className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}>
              {t("downloadSvg")}
            </button>
          </div>
          <div className="flex w-full flex-col gap-4 border-t border-glass-edge pt-5">
            <Segmented
              label={t("storyLook")}
              value={look}
              onChange={setLook}
              options={STORY_LOOKS.map((value) => ({ value, label: t(`storyLooks.${value}`) }))}
              className="w-full"
            />
            <div className="flex items-center gap-4">
              {/* The real image, so what is shared is what is seen; it reloads when the look changes. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG of our own route */}
              <img
                key={look}
                src={storyPath(username, look)}
                alt={t("storyPreview")}
                width={1080}
                height={1920}
                className="aspect-[9/16] h-auto w-20 shrink-0 rounded-[var(--radius-control)] border border-glass-edge bg-glass-strong object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <button type="button" onClick={shareStory} disabled={story === "busy"} className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}>
                  {story === "busy" ? <span className="dots" aria-hidden /> : <Smartphone size={16} aria-hidden />}
                  {t("story")}
                </button>
                <p className={cn("text-sm", story === "failed" ? "text-negative" : "text-ink-3")} role={story === "failed" ? "alert" : undefined}>
                  {story === "failed" ? t("storyFailed") : t("storyHint")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
