"use client";

import { useEffect, useState } from "react";
import type { ProfileLabels } from "./labels";

type Props = { title: string; target: string; after: "hide" | "text"; afterText?: string; locale: string; timeZone?: string; labels: ProfileLabels };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * COUNTDOWN block. The server renders the target date as text (works without JS and in a cached page); once the page is
 * running, the numbers count down. Nothing moves but the digits, and with reduced motion they update once a minute.
 */
export function Countdown({ title, target, after, afterText, locale, timeZone, labels }: Props) {
  const end = Date.parse(target);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const slow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, slow ? 60_000 : 1000);
    return () => clearInterval(timer);
  }, []);

  const left = now === null ? null : end - now;
  if (left !== null && left <= 0) {
    if (after === "hide") return null;
    return afterText ? <p className="glass w-full rounded-[var(--radius-card)] p-4 text-center font-semibold">{afterText}</p> : null;
  }

  // A fixed zone keeps the server and browser renders identical (no hydration mismatch).
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: timeZone ?? "Europe/Istanbul" }).format(end);
  const parts =
    left === null
      ? null
      : [
          [Math.floor(left / 86_400_000), labels.countdownDays],
          [Math.floor(left / 3_600_000) % 24, labels.countdownHours],
          [Math.floor(left / 60_000) % 60, labels.countdownMinutes],
          [Math.floor(left / 1000) % 60, labels.countdownSeconds],
        ] as const;

  return (
    <div className="glass flex w-full flex-col items-center gap-3 rounded-[var(--radius-card)] p-4 text-center">
      <p className="text-[0.9375rem] font-semibold">{title}</p>
      {parts ? (
        <p className="flex gap-4" aria-label={date}>
          {parts.map(([value, unit], i) => (
            <span key={i} className="flex flex-col items-center">
              <span className="font-mono text-2xl font-semibold tabular-nums">{i === 0 ? value : pad(value)}</span>
              <span className="text-xs text-ink-3">{unit}</span>
            </span>
          ))}
        </p>
      ) : (
        <time dateTime={target} className="text-ink-2">
          {date}
        </time>
      )}
    </div>
  );
}
