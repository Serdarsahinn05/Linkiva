import type { ReactNode } from "react";

/** Centered glass message used by 404 and error pages. */
export function StatusPage({ code, title, body, actions }: { code: string; title: string; body: string; actions: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass flex max-w-md flex-col items-center gap-4 rounded-[28px] px-8 py-12 text-center">
        <span className="font-mono text-sm text-ink-3">{code}</span>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance">{title}</h1>
        <p className="text-ink-2">{body}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>
      </div>
    </main>
  );
}
