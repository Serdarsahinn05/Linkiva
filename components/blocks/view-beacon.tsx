"use client";

import { useEffect } from "react";

/**
 * Tells /api/e that a person viewed the profile. Runs only in a real browser after load, which
 * already filters most crawlers; the server filters the rest.
 */
export function ViewBeacon({ profileId }: { profileId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({ p: profileId, r: document.referrer || null, u: params.get("utm_source") });
    if (!navigator.sendBeacon?.("/api/e", payload)) {
      void fetch("/api/e", { method: "POST", body: payload, keepalive: true }).catch(() => {});
    }
  }, [profileId]);
  return null;
}
