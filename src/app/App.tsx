import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Lock, LockOpen } from "lucide-react";
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
const MACHINE_H = 1850; // title(608) + body(~884) + ticket-overflow-space; ticket is absolute so body doesn't grow
// The lever's SVG art bleeds further right than MACHINE_W's 160px overhang budget
// (measured: body-left to resting-lever-tip ≈ 2093px) — used only to size the
// mobile viewport-width target so the whole resting lever stays on-screen.
const MACHINE_W_WITH_LEVER = 2100;
const BG = "#000000";

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
function TitleSection() {
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
      {/* Text paths — 30 paths in 464×130 viewBox, centered with +9px vertical offset */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(50% + 29px)",
          transform: "translate(-50%, -50%)",
          width: 1481,
          height: 415,
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<
    "idle" | "spinning" | "done"
  >("idle");
  const [leverPulled, setLeverPulled] = useState(false);
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
    if (locked.every(Boolean)) return;
    clearAll();

    const itemsBySlot = [FORMAT_ITEMS, SPACE_ITEMS, TWIST_ITEMS];
    const finals = finalValues.map((prev, i) =>
      locked[i] ? prev : pick(itemsBySlot[i]),
    );
    setFinalValues(finals);
    setPhase("spinning");
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
            setTimeout(() => setTicketVisible(true), 1500),
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
  }, [phase, clearAll, locked, finalValues]);

  // Scale: machine body ~50% of viewport width, centered with margins.
  // Below 500px (mobile) the 0.2 floor used on desktop would overflow the
  // viewport, so scale directly off a 75%-of-viewport target using
  // MACHINE_W_WITH_LEVER instead, keeping the whole resting lever on-screen.
  // Whatever width-based scale comes out of that, it's then capped so the
  // machine's height never exceeds 75% of viewport height either.
  const [scale, setScale] = useState(0.35);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let s: number;
      if (w < 500) {
        s = (w * 0.75) / MACHINE_W_WITH_LEVER;
      } else {
        s = Math.min(0.75, Math.max(0.2, (w * 0.5) / MACHINE_W));
      }
      const heightCap = (h * 0.75) / MACHINE_H;
      setScale(Math.min(s, heightCap));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <style>{`
        body { overflow-x: hidden; background: ${BG}; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 0",
        }}
      >
        {/* Height placeholder so layout doesn't collapse under the scaled element */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: MACHINE_H * scale,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: MACHINE_W,
              transformOrigin: "top center",
              transform: `translateX(-50%) scale(${scale})`,
            }}
          >
            {/* ── TITLE ─────────────────────────────────────────────────── */}
            <TitleSection />

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
              <LightsRow activeLightGroup={activeLightGroup} />

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
                <Lever
                  pulled={leverPulled}
                  onClick={spin}
                  disabled={allLocked}
                />
              </div>

              {/* Bottom lights */}
              <LightsRow
                activeLightGroup={activeLightGroup}
                variant="bottom"
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
                  {phase === "idle" && (
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
                    Sliding to translateY(0) reveals it downward from the slot opening. */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    marginLeft: -800,
                    top: 70,
                    width: 1600,
                    overflow: "hidden",
                    zIndex: 15,
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
      </div>
    </>
  );
}