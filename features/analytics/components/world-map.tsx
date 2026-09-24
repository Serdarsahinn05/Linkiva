import { WORLD_PATHS, WORLD_VIEWBOX } from "@/lib/world-map";
import { MapHover } from "./map-hover";

type Props = {
  views: Record<string, number>;
  /** Localised country name for an ISO code. */
  name: (iso: string) => string;
  formatCount: (n: number) => string;
  formatShare: (n: number) => string;
  labels: { map: string; views: string; none: string };
};

/**
 * Views per country as a static SVG (no map library). Colour is info blue, the same meaning as "views"
 * on the traffic chart; intensity is on a square-root scale so one big country does not wash the rest
 * out. Hover details travel as data attributes to a small client wrapper; the ranked list next to the
 * map carries the exact numbers for screen readers.
 */
export function WorldMap({ views, name, formatCount, formatShare, labels }: Props) {
  const counts = Object.values(views);
  const max = Math.max(0, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <MapHover labels={{ views: labels.views, none: labels.none }}>
      <svg viewBox={WORLD_VIEWBOX} role="img" aria-label={labels.map} className="h-auto w-full">
        {WORLD_PATHS.map(([iso, d]) => {
          const count = views[iso] ?? 0;
          return (
            <path
              key={iso}
              d={d}
              data-name={name(iso)}
              {...(count > 0 && { "data-views": formatCount(count), "data-share": formatShare(count / total) })}
              className={
                (count > 0 ? "fill-info" : "fill-ink-3/20") +
                " stroke-glass-edge transition-[stroke,fill-opacity] duration-150 data-active:stroke-ink motion-reduce:transition-none"
              }
              strokeWidth={0.5}
              fillOpacity={count > 0 ? 0.3 + 0.7 * Math.sqrt(count / max) : undefined}
            />
          );
        })}
      </svg>
    </MapHover>
  );
}
