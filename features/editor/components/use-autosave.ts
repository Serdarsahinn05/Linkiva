"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Debounced saving keyed by an id (one pending save per block/field). The latest value always wins;
 * the returned state drives a single "Saved / Saving / Could not save" indicator.
 */
export function useAutosave(delay = 600) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inflight = useRef(0);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const schedule = useCallback(
    (key: string, run: () => Promise<boolean>, immediate = false) => {
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      setState("saving");
      const fire = async () => {
        timers.current.delete(key);
        inflight.current += 1;
        const ok = await run().catch(() => false);
        inflight.current -= 1;
        if (!ok) setState("error");
        else if (inflight.current === 0 && timers.current.size === 0) setState("saved");
      };
      if (immediate) void fire();
      else timers.current.set(key, setTimeout(fire, delay));
    },
    [delay],
  );

  return { state, schedule };
}
