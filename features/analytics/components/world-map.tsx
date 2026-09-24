import { WORLD_PATHS, WORLD_VIEWBOX } from "@/lib/world-map";

type Props = {
  views: Record<string, number>;
  label: string;
  /** Hover text for a country with views, e.g. "Türkiye · 1.234". */
  describe: (iso: string, count: number) => string;
};

/**
 * Views per country as a static SVG (no map library, no JS). Colour is info blue, the same meaning as
 * "views" on the traffic chart; intensity is on a square-root scale so one big country does not wash
 * the rest out. The ranked list next to it carries the exact numbers for screen readers.
 */
export function WorldMap({ views, label, describe }: Props) {
  const max = Math.max(0, ...Object.values(views));
  return (
    <svg viewBox={WORLD_VIEWBOX} role="img" aria-label={label} className="h-auto w-full">
      {WORLD_PATHS.map(([iso, d]) => {
        const count = views[iso] ?? 0;
        if (count === 0) return <path key={iso} d={d} className="fill-ink-3/20 stroke-glass-edge" strokeWidth={0.5} />;
        return (
          <path key={iso} d={d} className="fill-info stroke-glass-edge" strokeWidth={0.5} fillOpacity={0.3 + 0.7 * Math.sqrt(count / max)}>
            <title>{describe(iso, count)}</title>
          </path>
        );
      })}
    </svg>
  );
}
