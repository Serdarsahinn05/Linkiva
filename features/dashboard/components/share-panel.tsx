"use client";

import { Check, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Tape } from "@/components/ui/tape";
import { profileDisplayUrl, profileUrl } from "@/lib/site";

const iconButton = "flex size-11 items-center justify-center rounded-[var(--radius-panel)] text-ink-2 hover:bg-ground hover:text-ink";

/** Profile address with copy, open and QR. The QR encodes the configured domain (v1 bug B7). */
export function SharePanel({ username, compact = false }: { username: string; compact?: boolean }) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const url = profileUrl(username);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function download(kind: "png" | "svg") {
    const a = document.createElement("a");
    a.download = `linkiva-${username}.${kind}`;
    if (kind === "png") {
      const canvas = canvasWrap.current?.querySelector("canvas");
      if (!canvas) return;
      a.href = canvas.toDataURL("image/png");
    } else {
      const svg = canvasWrap.current?.querySelector("svg");
      if (!svg) return;
      a.href = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml" }));
    }
    a.click();
  }

  return (
    <div className="flex flex-col gap-2">
      {!compact && <span className="text-sm text-ink-2">{t("address")}</span>}
      <Tape tone="red" size="sm" lang="en" translate="no" tiltSeed={username} className="max-w-full self-start">
        <span className="truncate">{profileDisplayUrl(username)}</span>
      </Tape>
      <div className="-ml-2 flex items-center">
        <button type="button" onClick={copy} className={iconButton} aria-label={copied ? t("copied") : t("copy")} title={t("copy")}>
          {copied ? <Check size={18} strokeWidth={1.75} className="text-tape-green" aria-hidden /> : <Copy size={18} strokeWidth={1.75} aria-hidden />}
        </button>
        <a href={url} target="_blank" rel="noopener" className={iconButton} aria-label={t("open")} title={t("open")}>
          <ExternalLink size={18} strokeWidth={1.75} aria-hidden />
        </a>
        <button type="button" onClick={() => setQrOpen(true)} className={iconButton} aria-label={t("qr")} title={t("qr")}>
          <QrCode size={18} strokeWidth={1.75} aria-hidden />
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? t("copied") : ""}
        </span>
      </div>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} title={t("qrTitle")} closeLabel={t("close")}>
        <div className="flex flex-col items-center gap-5 p-6">
          <p className="text-center text-ink-2">{t("qrBody")}</p>
          <div ref={canvasWrap} className="rounded-[var(--radius-panel)] border border-hairline bg-white p-5">
            <QRCodeSVG value={url} size={208} level="M" marginSize={0} />
            {/* Hi-res canvas only for the PNG download. */}
            <QRCodeCanvas value={url} size={1024} level="M" marginSize={2} className="hidden" />
          </div>
          <span lang="en" className="text-sm text-ink-2">
            {profileDisplayUrl(username)}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => download("png")} className="tape tape-type min-h-11 px-4" data-tone="red">
              <Download size={16} aria-hidden />
              {t("downloadPng")}
            </button>
            <button type="button" onClick={() => download("svg")} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-panel)] border border-ink px-4">
              {t("downloadSvg")}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
