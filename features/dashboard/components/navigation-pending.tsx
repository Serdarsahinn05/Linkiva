"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Give up on a navigation that never lands (offline, a server error page) after this long. */
const GIVE_UP_MS = 15_000;
const EVENT = "linkiva:navigate";

/** For navigations that are not link clicks (router.push from the command palette): report them the same way. */
export function announceNavigation(href: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: href }));
}

const key = (url: URL) => `${url.pathname}?${url.searchParams.toString()}`;

/**
 * True from the moment an in-app link is clicked until the address changes. It covers every link on the page (tabs,
 * range switches, "see subscribers") without touching them: a capture-phase click listener notes where the click
 * leads, and the navigation is over as soon as the address changes (to anywhere: a redirect counts). The shell turns
 * this into the slow-navigation cue (DESIGN.md §8); CSS delays it so a fast change shows nothing.
 */
export function useNavigationPending(): boolean {
  const here = `${usePathname()}?${useSearchParams().toString()}`;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // The address changed: whatever was pending has landed (render-time reset, no effect needed).
  const [seen, setSeen] = useState(here);
  if (seen !== here) {
    setSeen(here);
    setStartedAt(null);
  }

  useEffect(() => {
    const begin = (url: URL) => {
      // Another site, or the page already open (a #hash included): nothing will load.
      if (url.origin === location.origin && key(url) !== key(new URL(location.href))) setStartedAt(Date.now());
    };
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      begin(new URL(anchor.href));
    }
    function onAnnounce(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail === "string") begin(new URL(event.detail, location.href));
    }
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener(EVENT, onAnnounce);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener(EVENT, onAnnounce);
    };
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setTimeout(() => setStartedAt(null), GIVE_UP_MS - (Date.now() - startedAt));
    return () => clearTimeout(timer);
  }, [startedAt]);

  return startedAt !== null;
}
