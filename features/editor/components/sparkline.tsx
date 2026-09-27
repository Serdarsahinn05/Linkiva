/**
 * Last 7 days of clicks on one block, as a 56×16 line (DESIGN.md §6: --positive, no fill, no axes).
 * Pure SVG, no chart library: dozens of rows render at once.
 */
export function Sparkline({ values, label }: { values: number[] | undefined; label: string }) {
  const total = values?.reduce((a, b) => a + b, 0) ?? 0;
  if (!values || total === 0) {
    return (
      <span className="font-mono text-xs text-ink-3" aria-label={label} title={label}>
        —
      </span>
    );
  }
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 54 + 1},${15 - (v / max) * 13}`).join(" ");
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <svg width="56" height="16" viewBox="0 0 56 16" aria-hidden className="text-positive">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-xs text-ink-2 tabular-nums" aria-label={label}>
        {total}
      </span>
    </span>
  );
}
