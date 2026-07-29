import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/app/i18n/LanguageContext";

export const LANGUAGE_TOGGLE_NAV_HEIGHT = 64;

// Ignore scroll deltas smaller than this — otherwise trackpad/rubber-band
// jitter around a single scroll position flips the bar visible/hidden.
const SCROLL_DELTA_THRESHOLD = 4;

// How close to y=0 counts as "at the top" (kept small and independent of
// the nav bar's own height — pages whose whole scrollable range is under
// 64px, like the landing page, would otherwise never cross that threshold
// and the bar could never hide).
const AT_TOP_THRESHOLD = 2;

// The landing page (App.tsx) sets `overflow-x: hidden` on both `html` and
// `body` (needed so iOS's real horizontal scroll boundary — the html
// element — is also blocked, see the comment in App.tsx). That has a side
// effect: per the CSS overflow-propagation quirk, an HTML document normally
// forwards `body`'s overflow up to the viewport so `window` does the
// scrolling; explicitly setting overflow on `html` too suppresses that
// propagation, so `body` becomes its own nested auto-scrolling box instead.
// Map pages don't set overflow on `html`, so they scroll `window` normally.
// `scroll` events never bubble, so a bubble-phase listener on `window`
// would silently never fire on the landing page. Reading the max of every
// candidate scroll position, and listening on the capture phase (which
// does reach non-bubbling events on descendants like `body`), covers both.
function getScrollY(): number {
  return Math.max(
    window.scrollY || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0,
  );
}

// Tracks scroll direction and reports whether the nav bar should be hidden:
// hidden while scrolling down, shown again on scroll up or once back at the
// very top of the page.
function useHideOnScrollDown(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = getScrollY();
    const onScroll = () => {
      const y = Math.max(getScrollY(), 0);
      if (y <= AT_TOP_THRESHOLD) {
        setHidden(false);
        lastScrollY.current = y;
        return;
      }
      // Only move the reference point once a direction decision is made —
      // otherwise smooth/momentum scrolling (many small sub-threshold
      // events) drags the reference along with it and the delta never
      // accumulates past the threshold, so the bar never hides.
      const delta = y - lastScrollY.current;
      if (Math.abs(delta) >= SCROLL_DELTA_THRESHOLD) {
        setHidden(delta > 0);
        lastScrollY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    return () =>
      window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return hidden;
}

// Fixed top navigation bar holding the language switcher, mounted on every
// page. The bar's background matches the page background so it reads as a
// solid strip (and doubles as a shield keeping the starfield from blinking
// behind the button — see StarfieldBackground's shieldRefs). Shows the
// language you'd switch TO (not the current one) — matches the common
// pattern for this kind of toggle.
export function LanguageToggle({
  containerRef,
}: {
  // Measured by the starfield background (App page only) so stars never
  // blink behind this button — see StarfieldBackground's shieldRefs.
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { lang, toggleLang } = useLanguage();
  const hidden = useHideOnScrollDown();

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: LANGUAGE_TOGGLE_NAV_HEIGHT,
        // Fades from the page's own background (see BG in App.tsx /
        // MapPage.tsx) at the top down to transparent at the bottom, so
        // content scrolling underneath fades out instead of being clipped
        // by a hard edge.
        background: "linear-gradient(to bottom, #000000 0%, transparent 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 24px",
        zIndex: 20,
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.25s ease",
      }}
    >
      <button
        type="button"
        onClick={toggleLang}
        className="lang-toggle-btn"
        aria-label={lang === "en" ? "切换到中文" : "Switch to English"}
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 999,
          padding: "6px 14px",
          cursor: "pointer",
          fontFamily: "'Limelight', sans-serif",
          fontSize: 16,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {lang === "en" ? "简" : "ENG"}
      </button>
    </div>
  );
}
