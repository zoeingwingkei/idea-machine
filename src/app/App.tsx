import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Lock, LockOpen, X, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import ticketSvgPaths from "@/imports/Ticket-1/svg-jkajgizkpe";
import machinePaths from "@/imports/SlotMachine-1/svg-u88248n22q";
import productFormsData from "@/imports/map-of-product-forms.json";
import humanLifeData from "@/imports/map-of-human-life.json";
import twistsData from "@/imports/map-of-twists.json";
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

const FORMAT_ITEMS = productFormsData.categories.flatMap(
  (c) => c.subItems,
);
const SPACE_ITEMS = humanLifeData.domains.flatMap(
  (d) => d.subItems,
);
const TWIST_ITEMS = twistsData.categories.flatMap(
  (c) => c.subItems,
);

const FORMAT_CATEGORIES: SlotCategory[] =
  productFormsData.categories.map((c) => ({
    category: c.category,
    items: c.subItems,
  }));
const SPACE_CATEGORIES: SlotCategory[] = humanLifeData.domains.map(
  (d) => ({ category: d.domain, items: d.subItems }),
);
const TWIST_CATEGORIES: SlotCategory[] = twistsData.categories.map(
  (c) => ({ category: c.category, items: c.subItems }),
);

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

// ─── Golden Ticket ────────────────────────────────────────────────────────────
// Background SVG is 500×187.5 viewBox (perforated ticket shape). Rendered at
// exact 1600×600px (×3.2 scale) so the perforations stay round — never skewed.
// overflow:hidden on the outer div crops whatever background extends below content.

// Picks "a"/"an" by sound, not just spelling — handles the common exceptions
// (silent-h words, "u-" words that start with a consonant sound) since new
// product-form items can be added to the data later.
function articleFor(word: string): "A" | "An" {
  const firstWord = word.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (/^(uni|use|user|one|eu)/.test(firstWord)) return "A";
  if (/^(hour|honest|honor|heir)/.test(firstWord)) return "An";
  return /^[aeiou]/.test(firstWord) ? "An" : "A";
}

function GoldenTicket({
  format,
  space,
  twist,
}: {
  format: string;
  space: string;
  twist: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 1600,
        overflow: "hidden",
      }}
    >
      {/* Background at true proportional size — clipped, never stretched */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1600,
          height: 600,
          pointerEvents: "none",
        }}
      >
        <svg
          width={1600}
          height={600}
          viewBox="0 0 500 187.5"
          fill="none"
        >
          <path d={ticketSvgPaths.p4a02280} fill="#EECC6D" />
        </svg>
      </div>
      {/* Content sits above background and drives the container height */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "51px 77px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 13,
        }}
      >
        {/* "YOUR IDEA" row with scroll decors */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 201,
              height: 51,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 62.9243 15.96"
            >
              <path d={ticketSvgPaths.p23e4f00} fill="black" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Limelight', sans-serif",
              fontSize: 48,
              color: "black",
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            YOUR IDEA
          </span>
          <div
            style={{
              width: 201,
              height: 51,
              position: "relative",
              flexShrink: 0,
              transform: "scaleX(-1)",
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 62.9243 15.96"
            >
              <path d={ticketSvgPaths.p23e4f00} fill="black" />
            </svg>
          </div>
        </div>
        {/* Idea text */}
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 64,
            textAlign: "center",
            color: "black",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          <em>{articleFor(format)} </em>
          <strong>{format}</strong>
          <em> for </em>
          <strong>{space}</strong>
          {" — "}
          <strong>{twist}.</strong>
        </p>
      </div>
    </div>
  );
}

// ─── Title Section ───────────────────────────────────────────────────────────
// Figma: h=188px in 564px-wide frame → ×3.192 = 600px. Oval inset -1.06%/-0.36%.
// Text SVG: 464×130px → 1481×415px, vertically centered at 50%+29px (9×3.192).
function TitleSection({ scale }: { scale: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: 1800,
        height: 600,
        flexShrink: 0,
      }}
    >
      {/* Oval arch border — inset from Figma: -1.06% -0.36% */}
      <div
        style={{ position: "absolute", inset: "-1.06% -0.36%" }}
      >
        <svg
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 564 192"
        >
          <path d={machinePaths.p794c270} fill="white" />
        </svg>
      </div>
      {/* Text paths — 30 paths in 464×130 viewBox, centered with +9px vertical offset.
          Glow matches the starfield's warm off-white halo. Blur is divided by
          `scale` since this div sits inside the machine's outer scale(scale)
          transform — that keeps the on-screen glow ~constant regardless of how
          large or small the machine renders. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(50% + 29px)",
          transform: "translate(-50%, -50%)",
          width: 1481,
          height: 415,
          filter: `drop-shadow(0 0 ${5 / scale}px rgba(251, 243, 221, 0.55)) drop-shadow(0 0 ${14 / scale}px rgba(251, 243, 221, 0.32))`,
        }}
      >
        <svg
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 464 130"
        >
          <path d={machinePaths.p14c61700} fill="white" />
          <path d={machinePaths.p2584a800} fill="white" />
          <path d={machinePaths.p19df41a0} fill="white" />
          <path d={machinePaths.pafe9b80} fill="white" />
          <path d={machinePaths.p2c114300} fill="white" />
          <path d={machinePaths.p54de680} fill="white" />
          <path d={machinePaths.p15b52500} fill="white" />
          <path d={machinePaths.p7c56780} fill="white" />
          <path d={machinePaths.p3807d340} fill="white" />
          <path d={machinePaths.p3e69aa00} fill="white" />
          <path d={machinePaths.p21de0ab0} fill="white" />
          <path d={machinePaths.p2917d80} fill="white" />
          <path d={machinePaths.p1c217320} fill="white" />
          <path d={machinePaths.pfee8e40} fill="white" />
          <path d={machinePaths.p218d4300} fill="white" />
          <path d={machinePaths.p37472bb0} fill="white" />
          <path d={machinePaths.p3b0d9a00} fill="white" />
          <path d={machinePaths.p2b029200} fill="white" />
          <path d={machinePaths.p1a177b80} fill="white" />
          <path d={machinePaths.p33779b00} fill="white" />
          <path d={machinePaths.p15e88ff0} fill="white" />
          <path d={machinePaths.p37111e00} fill="white" />
          <path d={machinePaths.p1ad87180} fill="white" />
          <path d={machinePaths.p2e438b80} fill="white" />
          <path d={machinePaths.pac91400} fill="white" />
          <path d={machinePaths.p193dbd00} fill="white" />
          <path d={machinePaths.p9d82e80} fill="white" />
          <path d={machinePaths.p249dac80} fill="white" />
          <path d={machinePaths.p1a755d00} fill="white" />
          <path d={machinePaths.p1cf56b80} fill="white" />
        </svg>
      </div>
    </div>
  );
}

// ─── Slot Title Label ─────────────────────────────────────────────────────────
// Column header (FORMAT / SPACE / TWIST) with a lock/unlock toggle. Only the
// label text is centered in the column — the icon is absolutely positioned
// off the label itself (not laid out in flow), so its presence never shifts
// the title off-center.
function SlotTitleLabel({
  label,
  locked,
  hovered,
  hasValue,
  onToggleLock,
  onMouseEnter,
  onMouseLeave,
}: {
  label: string;
  locked: boolean;
  hovered: boolean;
  hasValue: boolean;
  onToggleLock: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const showIcon = hasValue && (locked || hovered);
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
          aria-label={locked ? `Unlock ${label}` : `Lock ${label}`}
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
        </button>
      </span>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
// Always mounted, always at the same fixed position and size — collapsed and
// expanded states are just this trigger with the close icon faded in/out, so
// the "About" label itself never jumps or resizes when toggling. Sized at
// the design's true 20px (not tied to the machine's scale): on desktop the
// body text now lives in a fixed-max-width reading column rather than
// scaling proportionally with the machine, so there's no ratio to track.
function AboutHeader({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: 24,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="about-toggle-btn"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "'Limelight', sans-serif",
          fontSize: 20,
          color: open ? "white" : "rgba(255,255,255,0.75)",
        }}
      >
        About
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Close about"
        className="about-close-btn"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "white",
          display: "flex",
          opacity: open ? 1 : 0,
          transform: open ? "scale(1)" : "scale(0.5)",
          pointerEvents: open ? "auto" : "none",
          transition:
            "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        <X size={24} />
      </button>
    </div>
  );
}

// Body copy shared by both layout variants. `unit` is the px-per-Figma-px
// multiplier: 3.192 for desktop (rendered inside the machine's scaled
// coordinate space, so the ambient CSS transform shrinks it with the
// machine) or 1 for mobile (rendered unscaled, at true Figma sizes). The
// "About" header itself lives outside this — see AboutHeader above.
// True Figma sizes throughout: on desktop this now sits in a fixed-max-width
// reading column beside the machine rather than scaling proportionally with
// it, and on mobile it always ignored the machine's scale anyway — so there
// is no longer a scaling relationship to track here. `paddingTop` reserves
// room for the fixed AboutHeader sitting above it (both layouts stack them).
function AboutBody() {
  return (
    <div style={{ paddingTop: 24 }}>
      <div
        className="text-body"
        style={{
          marginBottom: 24,
        }}
      >
        <p style={{ margin: "0 0 12px" }}>
          The Idea Machine is a playful generator that combines
          three things: a{" "}
          <Link to="/maps/space" className="about-inline-link">
            human need
          </Link>
          , a{" "}
          <Link to="/maps/format" className="about-inline-link">
            product form
          </Link>
          , and an{" "}
          <Link to="/maps/twist" className="about-inline-link">
            unexpected twist
          </Link>
          .
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Pull the lever to discover one of more than 1,000,000
          possible ideas.
        </p>
        <p style={{ margin: 0 }}>
          Built on a simple belief: good ideas often begin with an
          unlikely combination — and a little serendipity.
        </p>
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
        Github
        <ArrowUpRight size={20} />
      </a>
    </div>
  );
}

// Desktop: a sidebar to the LEFT of the machine (not stacked above it). Its
// width animates between 0 (closed) and min(50vw, 440px) (open); the inner
// content is always rendered at that same open-width so text never
// reflows mid-transition — the outer wrapper's overflow:hidden just wipes
// it in/out. Because the machine sits in a flex:1 sibling column, shrinking
// this sidebar's width smoothly reflows (and re-centers) the machine for
// free, no extra JS needed for that part — see the App() layout below. No
// right padding: the sidebar's box ends right where the machine's column
// begins, so all of its width goes to the machine instead of a dead gap.
function AboutSidebar({ open }: { open: boolean }) {
  const w = `min(50vw, ${ABOUT_SIDEBAR_MAX}px)`;
  return (
    <div
      style={{
        alignSelf: "flex-start",
        flexShrink: 0,
        width: open ? w : 0,
        overflow: "hidden",
        transition: "width 0.45s ease",
      }}
    >
      <div
        style={{
          width: w,
          boxSizing: "border-box",
          paddingLeft: 24,
        }}
      >
        <AboutBody />
      </div>
    </div>
  );
}

// Mobile: stacked above the machine instead of beside it, so it collapses
// via height (grid "0fr → 1fr", which — unlike a max-height cap — always
// animates to the content's true height and so can never clip content
// taller than an estimate, a real bug hit earlier with the GitHub link).
function AboutPanelMobile({ open }: { open: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        marginBottom: open ? 32 : 0,
        opacity: open ? 1 : 0,
        width: "100%",
        transition:
          "grid-template-rows 0.45s ease, margin-bottom 0.45s ease, opacity 0.35s ease",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div style={{ width: "calc(100% - 40px)", margin: "0 auto" }}>
          <AboutBody />
        </div>
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
  const [locked, setLocked] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(
    null,
  );
  const [selectOpenSlot, setSelectOpenSlot] = useState<
    number | null
  >(null);
  const noHoverPointer = useNoHoverPointer();
  const [aboutOpen, setAboutOpen] = useState(false);
  const isMobile = useIsMobile();

  // The machine's own container is the "machine column" div rendered below
  // (ref attached there) — by default it's the screen width minus page
  // margins (flexbox gives it the full row when About is closed), and the
  // right-hand share of the row once About opens as a desktop sidebar. It's
  // measured directly via ResizeObserver rather than re-derived from
  // window.innerWidth plus sidebar math, so the machine always matches
  // what's actually on screen (including mid-transition as About opens).
  const containerRef = useRef<HTMLDivElement>(null);
  // The scaled machine wrapper — measured by the starfield background so its
  // stars fade out over the machine (which is otherwise transparent) and never
  // clutter behind the slot text.
  const machineRef = useRef<HTMLDivElement>(null);
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

  // Stacking About above the machine (instead of beside it) is normally
  // just a narrow-window thing (isMobile). But a desktop-width window with
  // About expanded can still squeeze the machine's own share of the row
  // below the mobile breakpoint — in that case, prefer stacking over
  // rendering the machine in cramped mobile mode next to the sidebar.
  // This must be computed from the *hypothetical* row-layout width (a
  // formula, not the live measured `containerWidth`) rather than from
  // `isMachineMobile` itself: once stacked, the machine column regains the
  // full viewport width, which would flip `isMachineMobile` back to false
  // and immediately undo the stack — an infinite row/column ping-pong.
  const wouldBeRowContainerWidth = aboutOpen
    ? viewportSize.width -
      Math.min(viewportSize.width / 2, ABOUT_SIDEBAR_MAX)
    : viewportSize.width;
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

    const itemsBySlot = [FORMAT_ITEMS, SPACE_ITEMS, TWIST_ITEMS];
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
  // - Otherwise: cap width at 75% of the container and height at 80% of
  //   the viewport, then use whichever is more restrictive — the machine
  //   gets as large as it can while respecting both. Width is measured
  //   against the lever-inclusive symmetric extent (not just the
  //   1800-wide body) since centering is pinned to the body's own center,
  //   so the lever's tip reaches further from that center than the body's
  //   own left edge does — see MACHINE_SYMMETRIC_W above.
  const scale = useMemo(() => {
    if (isMachineMobile) {
      return (containerWidth - 24) / MACHINE_BODY_W;
    }
    const widthCap = (containerWidth * 0.75) / MACHINE_SYMMETRIC_W;
    const heightCap = (viewportSize.height * 0.8) / MACHINE_H;
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
        .about-toggle-btn { transition: color 0.2s ease; }
        .about-toggle-btn:hover { color: rgba(255,255,255,1); }
        .about-close-btn, .about-github-link { transition: opacity 0.2s ease; }
        .about-close-btn:hover, .about-github-link:hover { opacity: 0.6; }
        .about-inline-link { color: inherit; text-decoration: underline; transition: opacity 0.2s ease; }
        .about-inline-link:hover { opacity: 0.6; }
      `}</style>

      {/* Ambient line-art starfield — fixed full-viewport canvas between the
          black page background (body) and the machine. Machine content sits in
          the z-index:1 container below, so it always paints above the stars. */}
      <StarfieldBackground machineRef={machineRef} />

      <AboutHeader
        open={aboutOpen}
        onToggle={() => setAboutOpen((o) => !o)}
      />

      <div
        style={{
          minHeight: "100vh",
          // Background is transparent so the starfield canvas (behind, z-0)
          // shows through; the black base still comes from `body` (see the
          // <style> block above). This container is a z-index:1 stacking
          // context, lifting all machine/About content above the stars.
          position: "relative",
          zIndex: 1,
          display: "flex",
          // Row: About sidebar and machine sit side by side. Column: About
          // stacks above the machine — either because the window itself is
          // narrow (isMobile), or because an expanded About sidebar would
          // otherwise squeeze the machine's own share of the row into
          // mobile territory (see stackAboutAndMachine above).
          flexDirection: stackAboutAndMachine ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 0",
        }}
      >
        {stackAboutAndMachine && (
          <AboutPanelMobile open={aboutOpen} />
        )}
        {!stackAboutAndMachine && (
          <AboutSidebar open={aboutOpen} />
        )}

        {/* Machine column: flex:1 on desktop so it fills whatever width the
            About sidebar leaves it, full-width on mobile as before. This is
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
                  label="FORMAT"
                  locked={locked[0]}
                  hovered={hoveredSlot === 0 || noHoverPointer}
                  hasValue={finalValues[0] !== ""}
                  onToggleLock={() => toggleLock(0)}
                  onMouseEnter={() => setHoveredSlot(0)}
                  onMouseLeave={() =>
                    setHoveredSlot((h) => (h === 0 ? null : h))
                  }
                />
                <SlotTitleLabel
                  label="SPACE"
                  locked={locked[1]}
                  hovered={hoveredSlot === 1 || noHoverPointer}
                  hasValue={finalValues[1] !== ""}
                  onToggleLock={() => toggleLock(1)}
                  onMouseEnter={() => setHoveredSlot(1)}
                  onMouseLeave={() =>
                    setHoveredSlot((h) => (h === 1 ? null : h))
                  }
                />
                <SlotTitleLabel
                  label="TWIST"
                  locked={locked[2]}
                  hovered={hoveredSlot === 2 || noHoverPointer}
                  hasValue={finalValues[2] !== ""}
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
                  {(
                    [
                      {
                        label: "FORMAT",
                        mapHref: "/maps/format",
                        items: FORMAT_ITEMS,
                        ref: slot0Ref,
                        categories: FORMAT_CATEGORIES,
                      },
                      {
                        label: "SPACE",
                        mapHref: "/maps/space",
                        items: SPACE_ITEMS,
                        ref: slot1Ref,
                        categories: SPACE_CATEGORIES,
                      },
                      {
                        label: "TWIST",
                        mapHref: "/maps/twist",
                        items: TWIST_ITEMS,
                        ref: slot2Ref,
                        categories: TWIST_CATEGORIES,
                      },
                    ] as const
                  ).map(({ label, mapHref, items, ref, categories }, i) => (
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
                        onMouseEnter={() => setHoveredSlot(i)}
                        onMouseLeave={() =>
                          setHoveredSlot((h) =>
                            h === i ? null : h,
                          )
                        }
                      >
                        <SlotWindow
                          ref={ref}
                          slotIdx={i}
                          allItems={items}
                          hovered={hoveredSlot === i}
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
                      PULL THE LEVER →
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
                      format={finalValues[0]}
                      space={finalValues[1]}
                      twist={finalValues[2]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isMachineMobile && (
          <button
            type="button"
            onClick={spin}
            disabled={allLocked || roundInProgress}
            style={{
              display: "block",
              width: "calc(100% - 24px)",
              margin: "24px auto 0",
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
            Start
          </button>
        )}
        </div>
      </div>
    </>
  );
}