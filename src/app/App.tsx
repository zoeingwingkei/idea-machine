import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Lock, LockOpen, ArrowUpRight, Share2 } from "lucide-react";
import { Link } from "react-router";
import {
  SlotWindow,
  DECEL_MS,
  pick,
  type SlotWindowHandle,
} from "@/app/components/slot-machine/SlotWindow";
import { LightsRow } from "@/app/components/slot-machine/LightsRow";
import { Lever } from "@/app/components/slot-machine/Lever";
import {
  SlotSelectMenu,
  type SlotCategory,
} from "@/app/components/slot-machine/SlotSelectMenu";
import { StarfieldBackground } from "@/app/components/StarfieldBackground";
import {
  LanguageToggle,
  LANGUAGE_TOGGLE_NAV_HEIGHT,
} from "@/app/components/LanguageToggle";
import { GoldenTicket } from "@/app/components/GoldenTicket";
import { TitleSection } from "@/app/components/TitleSection";
import { ShareDialog } from "@/app/components/ShareDialog";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { getStrings } from "@/app/i18n/strings";
import {
  getFormatGroups,
  getSpaceGroups,
  getTwistGroups,
  translateItem,
} from "@/app/i18n/mapData";

// Devices with no hover capability (touchscreens) never fire the
// onMouseEnter that normally reveals the lock icon, so those icons must be
// shown unconditionally there — otherwise touch users have no way to
// discover that a slot can be locked.
function useNoHoverPointer(): boolean {
  const [noHover, setNoHover] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(hover: none)");
    setNoHover(mql.matches);
    const onChange = () => setNoHover(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return noHover;
}

// Below this width the About panel drops the machine's 1800-unit coordinate
// space (which would otherwise shrink its text into illegibility) and
// switches to normal, fixed-size, full-width-minus-margin CSS.
function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Machine natural coordinate space: 1800px wide (matching the slot SVG paths)
const MACHINE_W = 1960; // 1800 body + 160 lever overhang
const MACHINE_BODY_W = 1800;
const MACHINE_H = 1850; // title(608) + body(~884) + ticket-overflow-space; ticket is absolute so body doesn't grow
// The lever's SVG art bleeds further right than the body's edge (measured:
// body-left to resting-lever-tip ≈ 2093px). The white-bordered body — not
// a lever-inclusive box — is what gets centered in its container (see the
// transform comment below), so the binding width constraint for "must fit
// on screen" purposes is double whichever is further from the body's own
// center: the body's left edge (900) or the lever tip (2093 − 900 = 1193).
// The lever tip wins, so it sets the constraint.
const MACHINE_SYMMETRIC_W = 2 * (2093 - MACHINE_BODY_W / 2);
// Below this container width there's no room for the lever's own art plus
// its overhang, so the machine switches to "mobile mode": the real lever
// is replaced by a Start button, and the machine fills the container
// instead of being capped at a fraction of it.
const MACHINE_MOBILE_BREAKPOINT = 500;
const BG = "#000000";
// Desktop About sidebar: shares half the row with the machine by default,
// capped at this reading width so the text column never gets too wide.
// (Was 480 with a 40px right margin baked into the box; the margin was
// removed to give that width straight to the machine, so this shrank by
// the same 40px to keep the actual text-reading width unchanged.)
const ABOUT_SIDEBAR_MAX = 440;
// Must match the ticket slide-in transition duration below (1.6s).
const TICKET_SLIDE_MS = 1600;

// ─── Machine Hint ─────────────────────────────────────────────────────────────
// A small illuminated marquee sign, popping up above whatever it's anchored
// to. Anchor must be `position: relative` (or itself `position: absolute`,
// which also establishes a containing block) so the hint centers correctly.
function MachineHint({
  text,
  visible,
}: {
  text: string;
  visible: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`machine-hint${visible ? " machine-hint--visible" : ""}`}
    >
      {text}
    </div>
  );
}

// ─── Slot Title Label ─────────────────────────────────────────────────────────
// Column header (SPACE / FORM / TWIST) with a lock/unlock toggle. Only the
// label text is centered in the column — the icon is absolutely positioned
// off the label itself (not laid out in flow), so its presence never shifts
// the title off-center.
function SlotTitleLabel({
  label,
  locked,
  hovered,
  hasValue,
  ariaLabel,
  onToggleLock,
  onMouseEnter,
  onMouseLeave,
}: {
  label: string;
  locked: boolean;
  hovered: boolean;
  hasValue: boolean;
  ariaLabel: string;
  onToggleLock: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const showIcon = hasValue && (locked || hovered);
  const [iconHovered, setIconHovered] = useState(false);
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        flex: "1 0 0",
        minWidth: 0,
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ position: "relative" }}>
        {label}
        <button
          type="button"
          onClick={onToggleLock}
          onMouseEnter={() => setIconHovered(true)}
          onMouseLeave={() => setIconHovered(false)}
          aria-label={ariaLabel}
          aria-pressed={locked}
          style={{
            position: "absolute",
            left: "100%",
            top: "50%",
            marginLeft: 10,
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            padding: 0,
            lineHeight: 0,
            cursor: "pointer",
            color: locked ? "#EECC6D" : "white",
            opacity: showIcon ? 1 : 0,
            pointerEvents: showIcon ? "auto" : "none",
            transition: "opacity 0.2s ease, color 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          {locked ? <Lock size={44} /> : <LockOpen size={44} />}
          <MachineHint text={ariaLabel} visible={showIcon && iconHovered} />
        </button>
      </span>
    </div>
  );
}

// ─── Intro ────────────────────────────────────────────────────────────────────
// Body copy shared by both layout variants. True Figma sizes throughout: on
// desktop this sits in a fixed-max-width reading column beside the machine
// rather than scaling proportionally with it, and on mobile it always
// ignored the machine's scale anyway — so there is no scaling relationship
// to track here. Always visible (no collapse/expand toggle).
function AboutBody({ t }: { t: Strings }) {
  return (
    <div>
      <div
        className="text-body"
        style={{
          marginBottom: 24,
        }}
      >
        <p style={{ margin: "0 0 12px" }}>
          {t.aboutP1Pre}
          <Link to="/maps/space" className="about-inline-link">
            {t.aboutHumanNeed}
          </Link>
          {t.aboutP1Mid1}
          <Link to="/maps/format" className="about-inline-link">
            {t.aboutProductForm}
          </Link>
          {t.aboutP1Mid2}
          <Link to="/maps/twist" className="about-inline-link">
            {t.aboutTwist}
          </Link>
          {t.aboutP1End}
        </p>
        <p style={{ margin: "0 0 12px" }}>{t.aboutP2}</p>
        <p style={{ margin: 0 }}>{t.aboutP3}</p>
      </div>
      <a
        href="https://github.com/zoeingwingkei/idea-machine"
        target="_blank"
        rel="noopener noreferrer"
        className="about-github-link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          color: "white",
          textDecoration: "none",
        }}
      >
        {t.github}
        <ArrowUpRight size={20} />
      </a>
    </div>
  );
}

// Desktop: a column to the LEFT of the machine (not stacked above it),
// always visible. Because the machine sits in a flex:1 sibling column, this
// column's own width reflows (and re-centers) the machine for free, no
// extra JS needed for that part — see the App() layout below. No right
// padding: this column's box ends right where the machine's column begins,
// so all of its width goes to the machine instead of a dead gap. It shares
// the row's own alignItems:center (no alignSelf override), so its vertical
// center lines up with the machine's.
function AboutSidebar({
  panelRef,
  t,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  t: Strings;
}) {
  const w = `min(50vw, ${ABOUT_SIDEBAR_MAX}px)`;
  return (
    <div
      ref={panelRef}
      style={{
        flexShrink: 0,
        width: w,
        boxSizing: "border-box",
        paddingLeft: 24,
      }}
    >
      <AboutBody t={t} />
    </div>
  );
}

// Mobile: stacked above the machine instead of beside it, always visible.
function AboutPanelMobile({
  panelRef,
  t,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  t: Strings;
}) {
  return (
    <div
      ref={panelRef}
      style={{ width: "100%", marginBottom: 32 }}
    >
      <div style={{ width: "calc(100% - 40px)", margin: "0 auto" }}>
        <AboutBody t={t} />
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<
    "idle" | "spinning" | "done"
  >("idle");
  const [leverPulled, setLeverPulled] = useState(false);
  const [roundInProgress, setRoundInProgress] = useState(false);
  const [finalValues, setFinalValues] = useState(["", "", ""]);
  const [activeLightGroup, setActiveLightGroup] = useState(-1);
  const [ticketVisible, setTicketVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [locked, setLocked] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(
    null,
  );
  // Separate from `hoveredSlot` (which also fires from the column-label
  // hover, to preview the reel's glow) — this tracks the reel itself, so the
  // "choose" hint doesn't collide with the lock button's own hint when only
  // the label/icon is hovered.
  const [reelHoveredSlot, setReelHoveredSlot] = useState<
    number | null
  >(null);
  const [selectOpenSlot, setSelectOpenSlot] = useState<
    number | null
  >(null);
  const noHoverPointer = useNoHoverPointer();
  const isMobile = useIsMobile();

  const { lang } = useLanguage();
  const t = useMemo(() => getStrings(lang), [lang]);

  const formatGroups = useMemo(() => getFormatGroups(lang), [lang]);
  const spaceGroups = useMemo(() => getSpaceGroups(lang), [lang]);
  const twistGroups = useMemo(() => getTwistGroups(lang), [lang]);

  const FORMAT_ITEMS = useMemo(
    () => formatGroups.flatMap((g) => g.items),
    [formatGroups],
  );
  const SPACE_ITEMS = useMemo(
    () => spaceGroups.flatMap((g) => g.items),
    [spaceGroups],
  );
  const TWIST_ITEMS = useMemo(
    () => twistGroups.flatMap((g) => g.items),
    [twistGroups],
  );

  const FORMAT_CATEGORIES: SlotCategory[] = useMemo(
    () => formatGroups.map((g) => ({ category: g.title, items: g.items })),
    [formatGroups],
  );
  const SPACE_CATEGORIES: SlotCategory[] = useMemo(
    () => spaceGroups.map((g) => ({ category: g.title, items: g.items })),
    [spaceGroups],
  );
  const TWIST_CATEGORIES: SlotCategory[] = useMemo(
    () => twistGroups.map((g) => ({ category: g.title, items: g.items })),
    [twistGroups],
  );

  // The machine's own container is the "machine column" div rendered below
  // (ref attached there) — by default it's the screen width minus page
  // margins (flexbox gives it the full row when the intro is stacked above
  // it), and the right-hand share of the row when the intro sits beside it
  // as a desktop sidebar. It's measured directly via ResizeObserver rather
  // than re-derived from window.innerWidth plus sidebar math, so the
  // machine always matches what's actually on screen.
  const containerRef = useRef<HTMLDivElement>(null);
  // The scaled machine wrapper — measured by the starfield background so its
  // stars fade out over the machine (which is otherwise transparent) and never
  // clutter behind the slot text.
  const machineRef = useRef<HTMLDivElement>(null);
  // Shields the starfield background measures in addition to the machine, so
  // stars never blink behind the (desktop sidebar / mobile stacked) intro
  // text panel. Only one of the two panel refs is ever attached to a
  // mounted element at a time (see stackAboutAndMachine below), and the
  // unattached one's ref.current stays null, which the starfield simply
  // skips.
  const aboutPanelRef = useRef<HTMLDivElement>(null);
  const langToggleRef = useRef<HTMLDivElement>(null);
  // Start/Share sit below the machine's own shielded rect (mobile Start and
  // both the mobile/desktop Share buttons), so they need their own shields
  // too — otherwise stars can blink in right behind their labels/borders.
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const starShieldRefs = useMemo(
    () => [aboutPanelRef, langToggleRef, startButtonRef, shareButtonRef],
    [],
  );
  const [containerWidth, setContainerWidth] = useState(
    () => window.innerWidth,
  );
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const update = () =>
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMachineMobile =
    containerWidth < MACHINE_MOBILE_BREAKPOINT;

  // Stacking the intro above the machine (instead of beside it) is normally
  // just a narrow-window thing (isMobile). But a desktop-width window can
  // still have the intro sidebar squeeze the machine's own share of the row
  // below the mobile breakpoint — in that case, prefer stacking over
  // rendering the machine in cramped mobile mode next to the sidebar.
  // This must be computed from the *hypothetical* row-layout width (a
  // formula, not the live measured `containerWidth`) rather than from
  // `isMachineMobile` itself: once stacked, the machine column regains the
  // full viewport width, which would flip `isMachineMobile` back to false
  // and immediately undo the stack — an infinite row/column ping-pong.
  const wouldBeRowContainerWidth =
    viewportSize.width -
    Math.min(viewportSize.width / 2, ABOUT_SIDEBAR_MAX);
  const stackAboutAndMachine =
    isMobile ||
    wouldBeRowContainerWidth < MACHINE_MOBILE_BREAKPOINT;

  const slot0Ref = useRef<SlotWindowHandle>(null);
  const slot1Ref = useRef<SlotWindowHandle>(null);
  const slot2Ref = useRef<SlotWindowHandle>(null);
  const slotRefs = [slot0Ref, slot1Ref, slot2Ref] as const;

  const intervals = useRef<ReturnType<typeof setInterval>[]>(
    [],
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    intervals.current.forEach(clearInterval);
    timers.current.forEach(clearTimeout);
    intervals.current = [];
    timers.current = [];
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  // Translates any already-picked slot values in place when the language
  // toggles, instead of resetting them to blank. Keyed only on `lang` (not
  // `finalValues`) so this never fires — and never snaps a slot to its
  // final value early — while a spin animation is in flight.
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current === lang) return;
    prevLangRef.current = lang;
    const translated = finalValues.map((v) =>
      v ? (translateItem(v) ?? v) : v,
    );
    setFinalValues(translated);
    translated.forEach((v, i) => {
      if (v) slotRefs[i].current?.setStatic(v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const toggleLock = useCallback((i: number) => {
    setLocked((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[i] = !next[i];
      return next;
    });
  }, []);

  const handleSelect = useCallback((i: number, item: string) => {
    setFinalValues((prev) => {
      const next = [...prev];
      next[i] = item;
      return next;
    });
    setLocked((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[i] = true;
      return next;
    });
    slotRefs[i].current?.setStatic(item);
    setSelectOpenSlot(null);
  }, []);

  const allLocked = locked.every(Boolean);

  const spin = useCallback(() => {
    if (phase === "spinning") return;
    if (roundInProgress) return;
    if (locked.every(Boolean)) return;
    clearAll();

    const itemsBySlot = [SPACE_ITEMS, FORMAT_ITEMS, TWIST_ITEMS];
    const finals = finalValues.map((prev, i) =>
      locked[i] ? prev : pick(itemsBySlot[i]),
    );
    setFinalValues(finals);
    setPhase("spinning");
    setRoundInProgress(true);
    setActiveLightGroup(-1);
    setTicketVisible(false);

    setLeverPulled(true);
    timers.current.push(
      setTimeout(() => setLeverPulled(false), 150),
    );

    // Spin times: full-speed duration per slot. Stops left→right.
    // Each slot also runs DECEL_MS (850ms) of easing after its spinMs.
    // Locked slots skip the reel animation and keep their current value.
    const SPIN_TIMES = [1000, 2000, 3000] as const;
    slotRefs.forEach((ref, i) => {
      if (!locked[i]) ref.current?.spin(finals[i], SPIN_TIMES[i]);
    });

    // Lights start after the last slot finishes (spinMs + DECEL_MS + small buffer)
    timers.current.push(
      setTimeout(
        () => {
          setPhase("done");
          timers.current.push(
            setTimeout(() => {
              setTicketVisible(true);
              timers.current.push(
                setTimeout(
                  () => setRoundInProgress(false),
                  TICKET_SLIDE_MS,
                ),
              );
            }, 1500),
          );
          // Alternating flash: odd indices (0,2,4…) and even indices (1,3,5…) flash in turn, 3 pairs, then off
          const STEP_MS = 320;
          let group = 0; // 0 = odd-indexed lights, 1 = even-indexed lights
          let flashes = 0;
          const wave = setInterval(() => {
            setActiveLightGroup(group);
            group = group === 0 ? 1 : 0;
            flashes++;
            if (flashes >= 8) {
              clearInterval(wave);
              setActiveLightGroup(-1);
            }
          }, STEP_MS);
          intervals.current.push(wave);
        },
        SPIN_TIMES[2] + DECEL_MS + 150,
      ),
    );
  }, [phase, roundInProgress, clearAll, locked, finalValues]);

  // Scale, derived from the measured container (see containerRef/
  // isMachineMobile above):
  // - Mobile mode (container < MACHINE_MOBILE_BREAKPOINT): no lever to
  //   reserve room for, so fill the container width minus a 12px margin
  //   on each side.
  // - Otherwise: cap width at 75% of the container and height at 68% of
  //   the viewport (previously 80% — shrunk to 85% of that so the Share
  //   button fits below the machine without scrolling), then use whichever
  //   is more restrictive — the machine gets as large as it can while
  //   respecting both. Width is measured against the lever-inclusive
  //   symmetric extent (not just the 1800-wide body) since centering is
  //   pinned to the body's own center, so the lever's tip reaches further
  //   from that center than the body's own left edge does — see
  //   MACHINE_SYMMETRIC_W above.
  const scale = useMemo(() => {
    if (isMachineMobile) {
      return (containerWidth - 24) / MACHINE_BODY_W;
    }
    const widthCap = (containerWidth * 0.75) / MACHINE_SYMMETRIC_W;
    const heightCap = (viewportSize.height * 0.68) / MACHINE_H;
    return Math.min(widthCap, heightCap);
  }, [containerWidth, viewportSize.height, isMachineMobile]);

  return (
    <>
      <style>{`
        /* overflow-x must be set on both html and body — on iOS Safari the
           page's real horizontal scroll/swipe boundary is the html element,
           not body, so body-only hidden overflow still lets you rubber-band
           swipe sideways if anything (even a transform-scaled box whose
           unscaled layout size is wider than the viewport) reaches past the
           viewport edge. overscroll-behavior-x is belt-and-suspenders against
           the same class of Safari swipe-past-the-edge behavior. */
        html, body { overflow-x: hidden; overscroll-behavior-x: none; max-width: 100%; }
        body { background: ${BG}; }
        .about-github-link { transition: opacity 0.2s ease; }
        .about-github-link:hover { opacity: 0.6; }
        .about-inline-link { color: inherit; text-decoration: underline; transition: opacity 0.2s ease; }
        .about-inline-link:hover { opacity: 0.6; }
        .lang-toggle-btn { transition: color 0.2s ease, border-color 0.2s ease; }
        .lang-toggle-btn:hover { color: white; border-color: rgba(255,255,255,0.6); }

        /* Marquee-style hover hints for the lock toggle and the slot reels —
           a small illuminated sign that pops up above the trigger, echoing
           the machine's gold-on-black ticket/dialog styling. */
        .machine-hint {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 24px);
          padding: 16px 36px;
          border-radius: 10px;
          background: linear-gradient(180deg, #241c11, #14100a);
          border: 2px solid rgba(238, 204, 109, 0.55);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 0 16px rgba(238, 204, 109, 0.35), 0 10px 24px rgba(0, 0, 0, 0.6);
          font-family: 'Arvo', sans-serif;
          font-size: 34px;
          font-weight: 700;
          line-height: normal;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #EECC6D;
          text-shadow: 0 0 10px rgba(238, 204, 109, 0.65);
          white-space: nowrap;
          pointer-events: none;
          z-index: 40;
          opacity: 0;
          transform: translate(-50%, 8px) scale(0.88);
          transition: opacity 0.2s ease, transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .machine-hint::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          width: 18px;
          height: 18px;
          margin: -9px 0 0 -9px;
          background: #14100a;
          border-right: 2px solid rgba(238, 204, 109, 0.55);
          border-bottom: 2px solid rgba(238, 204, 109, 0.55);
          transform: rotate(45deg);
        }
        .machine-hint--visible {
          opacity: 1;
          transform: translate(-50%, 0) scale(1);
          animation: machine-hint-pulse 1.7s ease-in-out 0.32s infinite;
        }
        @keyframes machine-hint-pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 0 16px rgba(238, 204, 109, 0.35), 0 10px 24px rgba(0, 0, 0, 0.6); }
          50% { box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 0 28px rgba(238, 204, 109, 0.75), 0 10px 24px rgba(0, 0, 0, 0.6); }
        }
      `}</style>

      {/* Ambient line-art starfield — fixed full-viewport canvas between the
          black page background (body) and the machine. Machine content sits in
          the z-index:1 container below, so it always paints above the stars. */}
      <StarfieldBackground
        machineRef={machineRef}
        shieldRefs={starShieldRefs}
      />

      <LanguageToggle containerRef={langToggleRef} />

      <div
        style={{
          minHeight: "100vh",
          // Background is transparent so the starfield canvas (behind, z-0)
          // shows through; the black base still comes from `body` (see the
          // <style> block above). This container is a z-index:1 stacking
          // context, lifting all machine/intro content above the stars.
          position: "relative",
          zIndex: 1,
          display: "flex",
          // Row: intro and machine sit side by side, sharing this row's own
          // alignItems:center so their vertical centers line up. Column: the
          // intro stacks above the machine — either because the window
          // itself is narrow (isMobile), or because the intro sidebar would
          // otherwise squeeze the machine's own share of the row into
          // mobile territory (see stackAboutAndMachine above).
          flexDirection: stackAboutAndMachine ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          // Extra top padding (rather than margin, which would collapse
          // through this div's empty ancestors and overflow the viewport by
          // that amount) reserves room for the fixed language-toggle nav bar.
          padding: `${60 + LANGUAGE_TOGGLE_NAV_HEIGHT}px 0 60px`,
        }}
      >
        {stackAboutAndMachine && (
          <AboutPanelMobile panelRef={aboutPanelRef} t={t} />
        )}
        {!stackAboutAndMachine && (
          <AboutSidebar panelRef={aboutPanelRef} t={t} />
        )}

        {/* Machine column: flex:1 on desktop so it fills whatever width the
            intro sidebar leaves it, full-width on mobile as before. This is
            also the machine's measured "container" (see containerRef). */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            flex: stackAboutAndMachine ? "0 0 auto" : "1 1 0%",
            minWidth: 0,
            width: stackAboutAndMachine ? "100%" : undefined,
          }}
        >
          {/* Height placeholder so layout doesn't collapse under the scaled element */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: MACHINE_H * scale,
              transition: "height 0.45s ease",
            }}
          >
            <div
              ref={machineRef}
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: MACHINE_W,
                // Centers the 1800-wide BODY (not this 1960-wide box, which
                // reserves extra room on the right for the lever's overhang):
                // the origin is pinned to the body's own center (900px from
                // this box's left edge — the body sits flush there) rather
                // than this box's center (980px), and translateX(-900px) is
                // a flat pixel offset that exactly cancels that origin's
                // "+900" term at every scale (leaving only the origin's own
                // -900·scale term) — unlike -50%, whose reference width
                // would still be this box's 1960px, not the body's 1800px.
                // A mismatched origin/translate pair here does NOT cancel
                // proportionally across scales, which is what caused an
                // earlier version of this fix to overshoot off-center.
                transformOrigin: `${MACHINE_BODY_W / 2}px top`,
                transform: `translateX(-${MACHINE_BODY_W / 2}px) scale(${scale})`,
                transition: "transform 0.45s ease",
              }}
            >
              {/* ── TITLE ─────────────────────────────────────────────────── */}
              <TitleSection scale={scale} />

            {/* ── MACHINE BODY ──────────────────────────────────────────── */}
            <div
              style={{
                position: "relative",
                width: 1800,
                flexShrink: 0,
              }}
            >
              {/* White border frame */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: -6,
                  border: "12px solid white",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />

              {/* Top lights */}
              <LightsRow activeLightGroup={activeLightGroup} scale={scale} />

              {/* Column labels */}
              <div
                style={{
                  display: "flex",
                  gap: 13,
                  padding: "51px 39px 0",
                  fontFamily: "'Limelight', sans-serif",
                  fontSize: 48,
                  color: "white",
                  textAlign: "center",
                }}
              >
                <SlotTitleLabel
                  label={t.space}
                  locked={locked[0]}
                  hovered={hoveredSlot === 0 || noHoverPointer}
                  hasValue={finalValues[0] !== ""}
                  ariaLabel={
                    locked[0] ? t.unlock(t.space) : t.lock(t.space)
                  }
                  onToggleLock={() => toggleLock(0)}
                  onMouseEnter={() => setHoveredSlot(0)}
                  onMouseLeave={() =>
                    setHoveredSlot((h) => (h === 0 ? null : h))
                  }
                />
                <SlotTitleLabel
                  label={t.format}
                  locked={locked[1]}
                  hovered={hoveredSlot === 1 || noHoverPointer}
                  hasValue={finalValues[1] !== ""}
                  ariaLabel={
                    locked[1] ? t.unlock(t.format) : t.lock(t.format)
                  }
                  onToggleLock={() => toggleLock(1)}
                  onMouseEnter={() => setHoveredSlot(1)}
                  onMouseLeave={() =>
                    setHoveredSlot((h) => (h === 1 ? null : h))
                  }
                />
                <SlotTitleLabel
                  label={t.twist}
                  locked={locked[2]}
                  hovered={hoveredSlot === 2 || noHoverPointer}
                  hasValue={finalValues[2] !== ""}
                  ariaLabel={
                    locked[2] ? t.unlock(t.twist) : t.lock(t.twist)
                  }
                  onToggleLock={() => toggleLock(2)}
                  onMouseEnter={() => setHoveredSlot(2)}
                  onMouseLeave={() =>
                    setHoveredSlot((h) => (h === 2 ? null : h))
                  }
                />
              </div>

              {/* Slot windows + lever */}
              <div
                style={{
                  height: 437,
                  position: "relative",
                  flexShrink: 0,
                  width: 1800,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    gap: 13,
                    padding: 39,
                  }}
                >
                  {[
                    {
                      label: t.space,
                      mapHref: "/maps/space",
                      items: SPACE_ITEMS,
                      ref: slot0Ref,
                      categories: SPACE_CATEGORIES,
                    },
                    {
                      label: t.format,
                      mapHref: "/maps/format",
                      items: FORMAT_ITEMS,
                      ref: slot1Ref,
                      categories: FORMAT_CATEGORIES,
                    },
                    {
                      label: t.twist,
                      mapHref: "/maps/twist",
                      items: TWIST_ITEMS,
                      ref: slot2Ref,
                      categories: TWIST_CATEGORIES,
                    },
                  ].map(({ label, mapHref, items, ref, categories }, i) => (
                    <SlotSelectMenu
                      key={i}
                      label={label}
                      mapHref={mapHref}
                      categories={categories}
                      open={selectOpenSlot === i}
                      onOpenChange={(o) =>
                        setSelectOpenSlot(o ? i : null)
                      }
                      onSelect={(item) => handleSelect(i, item)}
                    >
                      <div
                        style={{
                          flex: "1 0 0",
                          minWidth: 0,
                          position: "relative",
                          cursor: "pointer",
                        }}
                        onMouseEnter={() => {
                          setHoveredSlot(i);
                          setReelHoveredSlot(i);
                        }}
                        onMouseLeave={() => {
                          setHoveredSlot((h) =>
                            h === i ? null : h,
                          );
                          setReelHoveredSlot((h) =>
                            h === i ? null : h,
                          );
                        }}
                      >
                        <SlotWindow
                          ref={ref}
                          slotIdx={i}
                          allItems={items}
                          hovered={hoveredSlot === i}
                        />
                        <MachineHint
                          text={t.chooseLabel(label)}
                          visible={reelHoveredSlot === i}
                        />
                      </div>
                    </SlotSelectMenu>
                  ))}
                </div>
                {!isMachineMobile && (
                  <Lever
                    pulled={leverPulled}
                    onClick={spin}
                    disabled={allLocked || roundInProgress}
                  />
                )}
              </div>

              {/* Bottom lights */}
              <LightsRow
                activeLightGroup={activeLightGroup}
                variant="bottom"
                scale={scale}
              />

              {/* Output / ticket area — position:relative so ticket can be absolute inside */}
              <div
                style={{ padding: 51, position: "relative" }}
              >
                {/* Slot opening */}
                <div
                  style={{
                    position: "relative",
                    height: 103,
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: -12,
                      border: "12px solid white",
                      pointerEvents: "none",
                    }}
                  />
                  {phase === "idle" && !isMachineMobile && (
                    <div
                      onClick={spin}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Limelight', sans-serif",
                        fontSize: 36,
                        color: "rgba(255,255,255,0.45)",
                        letterSpacing: 4,
                        cursor: "pointer",
                      }}
                    >
                      {t.pullLever}
                    </div>
                  )}
                </div>

                {/* Clip container — anchored at slot-bottom minus overlap (top:96).
                    overflow:hidden clips the ticket above its top edge, so when the ticket
                    is at translateY(-100%) it is fully hidden inside the machine.
                    Sliding to translateY(0) reveals it downward from the slot opening.
                    transform:translateZ(0) forces its own compositing layer — same fix as
                    the reel window (SlotWindow.tsx): without it, iOS Safari can fail to
                    clip a transform-animated child against this overflow:hidden ancestor,
                    so the ticket appears to emerge from partway up the machine instead of
                    fully hidden until it slides out of the opening. */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    marginLeft: -800,
                    top: 70,
                    width: 1600,
                    overflow: "hidden",
                    zIndex: 15,
                    transform: "translateZ(0)",
                  }}
                >
                  <div
                    style={{
                      transform: ticketVisible
                        ? "translateY(0)"
                        : "translateY(-100%)",
                      transition:
                        "transform 1.6s cubic-bezier(0.34, 1.25, 0.64, 1)",
                    }}
                  >
                    <GoldenTicket
                      format={finalValues[1]}
                      space={finalValues[0]}
                      twist={finalValues[2]}
                      lang={lang}
                      t={t}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Always mounted (even before the ticket appears) and just faded
            in/out — so this reserves its layout space from the very first
            render. The machine column's height (and therefore its
            flex-centered position) never changes when the ticket arrives,
            which would otherwise shift the whole machine upward at that
            moment; reserving the space up front means it starts in that
            already-shifted position instead. */}
        {isMachineMobile && (
          <button
            ref={shareButtonRef}
            type="button"
            onClick={() => setShareOpen(true)}
            aria-hidden={!ticketVisible}
            tabIndex={ticketVisible ? 0 : -1}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "calc(100% - 24px)",
              margin: "24px auto 0",
              padding: "10px",
              background: "transparent",
              border: "2px solid #EECC6D",
              borderRadius: 12,
              fontFamily: "'Limelight', sans-serif",
              fontSize: 24,
              letterSpacing: 1,
              color: "#EECC6D",
              cursor: ticketVisible ? "pointer" : "default",
              opacity: ticketVisible ? 1 : 0,
              pointerEvents: ticketVisible ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
          >
            <Share2 size={20} />
            {t.share}
          </button>
        )}

        {isMachineMobile && (
          <button
            ref={startButtonRef}
            type="button"
            onClick={spin}
            disabled={allLocked || roundInProgress}
            style={{
              display: "block",
              width: "calc(100% - 24px)",
              margin: "12px auto 0",
              padding: "10px",
              background: "#EECC6D",
              border: "none",
              borderRadius: 12,
              fontFamily: "'Limelight', sans-serif",
              fontSize: 24,
              color: "black",
              textAlign: "center",
              cursor:
                allLocked || roundInProgress
                  ? "default"
                  : "pointer",
              opacity: allLocked || roundInProgress ? 0.5 : 1,
            }}
          >
            {t.start}
          </button>
        )}

        {!isMachineMobile && (
          <button
            ref={shareButtonRef}
            type="button"
            onClick={() => setShareOpen(true)}
            aria-hidden={!ticketVisible}
            tabIndex={ticketVisible ? 0 : -1}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "fit-content",
              margin: "24px auto 0",
              padding: "7.5px 21px",
              background: "transparent",
              border: "1.5px solid #EECC6D",
              borderRadius: 9,
              fontFamily: "'Limelight', sans-serif",
              fontSize: 16.5,
              letterSpacing: 0.75,
              color: "#EECC6D",
              cursor: ticketVisible ? "pointer" : "default",
              opacity: ticketVisible ? 1 : 0,
              pointerEvents: ticketVisible ? "auto" : "none",
              transition: "opacity 0.3s ease, background-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#EECC6D";
              e.currentTarget.style.color = "black";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#EECC6D";
            }}
          >
            <Share2 size={15} />
            {t.share}
          </button>
        )}
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        format={finalValues[1]}
        space={finalValues[0]}
        twist={finalValues[2]}
      />
    </>
  );
}