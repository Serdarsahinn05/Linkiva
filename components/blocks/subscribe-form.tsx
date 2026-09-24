"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/features/audience/actions";
import type { ProfileLabels } from "./labels";

/** EMAIL_CAPTURE block. A real form with a server action, so it also works before/without JS. */
export function SubscribeForm({ blockId, title, labels, inert }: { blockId: string; title?: string; labels: ProfileLabels; inert?: boolean }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: "idle" });

  const message =
    state.status === "invalid"
      ? labels.subscribeInvalid
      : state.status === "tooMany"
        ? labels.subscribeTooMany
        : state.status === "error"
          ? labels.subscribeError
          : null;

  return (
    <div className="glass flex w-full flex-col gap-3 rounded-[var(--radius-card)] p-4">
      <p className="text-center text-[0.9375rem] font-semibold">{title || labels.subscribeTitle}</p>
      {state.status === "done" ? (
        <p role="status" className="flex items-center justify-center gap-2 py-2 text-[0.9375rem]">
          <CircleCheck size={18} className="text-positive" aria-hidden />
          {labels.subscribeDone}
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="blockId" value={blockId} />
          {/* Honeypot: hidden from people and assistive tech, filled by naive bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
          <div className="flex items-center gap-1 rounded-full border border-glass-edge bg-glass p-1 pl-4 focus-within:border-ink">
            <input
              type="email"
              name="email"
              required
              disabled={inert}
              autoComplete="email"
              inputMode="email"
              aria-label={labels.subscribePlaceholder}
              placeholder={labels.subscribePlaceholder}
              className="h-10 min-w-0 flex-1 bg-transparent text-[0.9375rem] placeholder:text-ink-3 focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={pending || inert}
              aria-label={labels.subscribeButton}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[var(--p-accent,var(--c-accent))] px-4 text-sm font-medium text-[var(--p-accent-ink,var(--c-accent-ink))] disabled:opacity-60"
            >
              {pending ? <span className="dots" aria-hidden /> : <ArrowRight size={16} aria-hidden />}
              <span className="max-[380px]:sr-only">{labels.subscribeButton}</span>
            </button>
          </div>
          {message && (
            <p role="alert" className="px-2 text-center text-sm text-negative">
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
