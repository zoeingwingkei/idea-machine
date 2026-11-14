// Thin wrapper around the gtag.js snippet loaded in index.html (see the
// GA4 script tag there). Centralizing the 4 launch-spec events here means
// each call site doesn't need to know about window.gtag, dev logging, or
// the exact event/param names — see idea-machine-gtm-metrics.md for the
// spec these implement.

// Which machine fired the event: the current Braun-style instrument, or the
// original slot machine kept at /legacy. `mode` is the instrument's
// cartridge ("product" | "hackathon"); the legacy machine is always product.
type Ui = "instrument" | "legacy";

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

// 1 & 2 — fire on every roll / lever pull. Reel names come from the mode
// (product: space/form/twist, hackathon: topic/tech/twist).
export function trackSpin(lockedReels: string[], mode: string, ui: Ui) {
  track("spin", {
    locks_active: lockedReels.length,
    locked_reels: lockedReels.join(","),
    mode,
    ui,
  });
}

// 2 — fire when a reel is locked (never on unlock).
export function trackReelLock(reel: string, mode: string, ui: Ui) {
  track("reel_lock", { reel, mode, ui });
}

// 3a — fire when a share image has been generated.
export function trackShareClick(mode: string, ui: Ui) {
  track("share_click", { mode, ui });
}

// Instrument only — "Copy prompt".
export function trackCopyPrompt(mode: string) {
  track("copy_prompt", { mode });
}

// Switching between Product and Hackathon mode, or between the instrument
// and the legacy slot machine.
export function trackModeSwitch(to: string) {
  track("mode_switch", { to });
}

export function trackUiSwitch(to: Ui) {
  track("ui_switch", { to });
}

// 7 — fire on language switch, naming the language switched TO.
export function trackLanguageToggle(to: "en" | "zh") {
  track("language_toggle", { to });
}
