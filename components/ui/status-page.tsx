import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "./surface";

/**
 * 404 and error pages. With a figure (the 404 mascot) the page is open: the words on the left, the figure large
 * on the right (above them on a narrow screen), and the wordmark top left leads home. Without one, a centred glass card.
 */
export function StatusPage({
  code,
  title,
  body,
  actions,
  figure,
  home = "/",
}: {
  code: string;
  title: string;
  body: string;
  actions: ReactNode;
  figure?: ReactNode;
  /** The home page in the visitor's language, for the wordmark. */
  home?: "/" | "/en";
}) {
  if (figure) {
    return (
      <>
        <header className="absolute inset-x-0 top-0 mx-auto w-full max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
          <Link href={home} className="inline-block rounded-full">
            <Wordmark />
          </Link>
        </header>
        <main
          id="main"
          className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-[minmax(0,1fr)] content-center items-center gap-4 px-4 py-10 sm:px-8 md:grid-cols-2 md:gap-12"
        >
          {/* A soft light behind the figure lifts the page a little (above the ambient, below everything else). */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-1"
            style={{
              background:
                "radial-gradient(55% 65% at 68% 45%, var(--c-glass-strong), transparent 75%), radial-gradient(70% 60% at 70% 40%, var(--c-ambient-1), transparent 70%)",
            }}
          />
          <div className="flex justify-center md:order-2 md:justify-start">
            {figure}
          </div>
          <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
            <span className="font-mono text-sm text-ink-3">{code}</span>
            <h1 className="text-[length:var(--text-display)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
              {title}
            </h1>
            {body && (
              <p className="max-w-[40ch] text-lg text-ink-2 text-pretty">
                {body}
              </p>
            )}
            <div className="mt-2 flex w-full max-w-xl flex-wrap items-center justify-center gap-3 md:justify-start">
              {actions}
            </div>
          </div>
        </main>
      </>
    );
  }
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] px-6 py-12 text-center sm:px-8">
        <span className="font-mono text-sm text-ink-3">{code}</span>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h1>
        {body && <p className="text-ink-2">{body}</p>}
        <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
          {actions}
        </div>
      </div>
    </main>
  );
}
