"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { SiSoundcloud, SiSpotify, SiYoutube } from "react-icons/si";
import type { Embed } from "@/lib/embeds";

const ICONS = { youtube: SiYoutube, spotify: SiSpotify, soundcloud: SiSoundcloud } as const;
const NAMES = { youtube: "YouTube", spotify: "Spotify", soundcloud: "SoundCloud" } as const;

/**
 * Lite embed: nothing from the provider loads until the visitor asks for it (fast page, no third-party
 * cookies). YouTube shows its thumbnail; audio providers show a glass card.
 */
export function EmbedCard({ embed, labels, inert }: { embed: Embed; labels: { play: string; listen: string }; inert?: boolean }) {
  const [active, setActive] = useState(false);
  const Icon = ICONS[embed.provider];

  if (active && !inert) {
    return (
      <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-glass-edge bg-black/20">
        <iframe
          src={embed.src}
          title={NAMES[embed.provider]}
          className="block w-full"
          style={embed.provider === "youtube" ? { aspectRatio: embed.aspect } : { height: embed.height }}
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (embed.provider === "youtube") {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        disabled={inert}
        aria-label={`${labels.play}: ${NAMES.youtube}`}
        className="group relative block w-full overflow-hidden rounded-[var(--radius-card)] border border-glass-edge disabled:cursor-default"
        style={{ aspectRatio: embed.aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail, lazy */}
        <img src={embed.thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="glass-float absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white">
          <Play size={24} className="translate-x-0.5 fill-current" aria-hidden />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      disabled={inert}
      className="p-btn glass-interactive group justify-between gap-3 !px-5 text-left disabled:cursor-default"
    >
      <span className="flex items-center gap-3">
        <Icon size={20} aria-hidden />
        {NAMES[embed.provider]}
      </span>
      <span className="flex items-center gap-1.5 text-sm opacity-70">
        <Play size={14} className="fill-current" aria-hidden />
        {labels.listen}
      </span>
    </button>
  );
}
