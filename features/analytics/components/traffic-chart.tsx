"use client";

import { useEffect, useState } from "react";
import { useFormatter } from "next-intl";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "../queries";

type Colors = { views: string; clicks: string; grid: string; ink: string; muted: string; glow: boolean };

/** Reads the theme tokens once mounted so the chart follows light/dark (SVG attributes cannot take var()). */
function useThemeColors(): Colors | null {
  const [colors, setColors] = useState<Colors | null>(null);
  useEffect(() => {
    const read = () => {
      const css = getComputedStyle(document.documentElement);
      const v = (name: string) => css.getPropertyValue(name).trim();
      setColors({ views: v("--c-info"), clicks: v("--c-positive"), grid: v("--c-glass-edge"), ink: v("--c-ink"), muted: v("--c-ink-3"), glow: v("--c-glow") === "1" });
    };
    read();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      media.removeEventListener("change", read);
      observer.disconnect();
    };
  }, []);
  return colors;
}

/**
 * Views as a soft blue area, clicks as a green line: the only place the UI uses colour for data
 * (DESIGN.md §3 semantic neon; the glow comes from the dark theme's drop shadow filter).
 */
export function TrafficChart({ data, labels }: { data: DayPoint[]; labels: { views: string; clicks: string } }) {
  const colors = useThemeColors();
  const format = useFormatter();
  const dayLabel = (day: string) => format.dateTime(new Date(`${day}T12:00:00Z`), { day: "numeric", month: "short", timeZone: "UTC" });

  if (!colors) return <div className="h-64" aria-hidden />;

  return (
    <div className="h-64 w-full [&_.recharts-cartesian-axis-tick_text]:font-mono" role="img" aria-label={`${labels.views} / ${labels.clicks}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.views} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colors.views} stopOpacity={0} />
            </linearGradient>
            <filter id="neonGlow" x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: colors.grid }}
            labelFormatter={(day) => dayLabel(String(day))}
            contentStyle={{ background: "var(--c-glass-strong)", backdropFilter: "blur(20px)", border: "1px solid var(--c-glass-edge)", borderRadius: 12, color: colors.ink }}
            labelStyle={{ color: colors.muted }}
          />
          <Area type="monotone" dataKey="views" name={labels.views} stroke={colors.views} strokeWidth={2} fill="url(#viewsFill)" style={colors.glow ? { filter: "url(#neonGlow)" } : undefined} />
          <Line type="monotone" dataKey="clicks" name={labels.clicks} stroke={colors.clicks} strokeWidth={2} dot={false} style={colors.glow ? { filter: "url(#neonGlow)" } : undefined} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
