import { cn } from "@/lib/cn";

type Props = {
  /** Views by weekday (0 = Monday) × hour. */
  data: number[][];
  locale: string;
  label: string;
  /** "{day} {hour} · {views}" for a cell's tooltip. */
  cellLabel: (day: string, hours: string, views: number) => string;
};

/** Monday-first short weekday names in the page's language (2024-01-01 was a Monday). */
const weekdays = (locale: string) =>
  Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))));

const pad = (h: number) => String(h).padStart(2, "0");

/**
 * Weekday × hour of views (DESIGN.md §7 Analytics): --info at an opacity that grows with the square root of the count,
 * empty cells plain glass. Server-rendered; hover shows the exact figure. On phones hours are grouped by four.
 */
export function Heatmap({ data, locale, label, cellLabel }: Props) {
  const days = weekdays(locale);
  const grouped = data.map((row) => Array.from({ length: 6 }, (_, g) => row.slice(g * 4, g * 4 + 4).reduce((a, b) => a + b, 0)));

  const grid = (rows: number[][], hoursPerCell: number, className: string) => {
    const max = Math.max(1, ...rows.flat());
    const columns = rows[0]?.length ?? 0;
    return (
      <div className={cn("items-center gap-0.5", className)} style={{ gridTemplateColumns: `2.5rem repeat(${columns}, minmax(0, 1fr))` }}>
        {rows.map((row, d) => (
          <div key={d} className="contents">
            <span className="pr-2 text-right text-xs text-ink-3">{days[d]}</span>
            {row.map((views, c) => {
              const from = c * hoursPerCell;
              const hours = hoursPerCell === 1 ? `${pad(from)}:00` : `${pad(from)}–${pad(from + hoursPerCell)}`;
              return (
                <span
                  key={c}
                  title={cellLabel(days[d] ?? "", hours, views)}
                  className={cn("aspect-square", views === 0 ? "bg-glass" : "bg-info")}
                  style={views === 0 ? undefined : { opacity: 0.06 + 0.94 * Math.sqrt(views / max) }}
                />
              );
            })}
          </div>
        ))}
        <span />
        {Array.from({ length: columns }, (_, c) => (
          <span key={c} className="text-center font-mono text-[0.625rem] text-ink-3 tabular-nums">
            {hoursPerCell === 1 ? (c % 6 === 0 ? pad(c) : "") : pad(c * hoursPerCell)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div role="img" aria-label={label}>
      {grid(grouped, 4, "grid sm:hidden")}
      {grid(data, 1, "hidden sm:grid")}
    </div>
  );
}
