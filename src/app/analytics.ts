// Thin wrapper around the gtag.js snippet loaded in index.html (see the
// GA4 script tag there). Centralizing the 4 launch-spec events here means
// each call site doesn't need to know about window.gtag, dev logging, or
// the exact event/param names — see idea-machine-gtm-metrics.md for the
// spec these implement.

type ReelKey = "space" | "form" | "twist";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: Record<string, string | number>) {
  // Local testing aid: run the app with `npm run dev` and watch the
  // console — every event fired shows up here, with the exact params sent
  // to GA4, whether or not gtag.js itself is reachable (e.g. blocked by an
  // ad blocker, or running in mainland China).
  if (import.meta.env.DEV) {
    console.log(`[analytics] ${event}`, params ?? {});
  }
  window.gtag?.("event", event, params);
}

// 1 & 2 — fire on every lever pull.
export function trackSpin(lockedReels: ReelKey[]) {
  track("spin", {
    locks_active: lockedReels.length,
    locked_reels: lockedReels.join(","),
  });
}

// 2 — fire when a reel is locked (never on unlock).
export function trackReelLock(reel: ReelKey) {
  track("reel_lock", { reel });
}

// 3a — fire when a share image has been generated.
export function trackShareClick() {
  track("share_click");
}

// 7 — fire on language switch, naming the language switched TO.
export function trackLanguageToggle(to: "en" | "zh") {
  track("language_toggle", { to });
}
