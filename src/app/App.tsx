import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
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

const FORMAT_ITEMS = productFormsData.categories.flatMap(
  (c) => c.subItems,
);
const SPACE_ITEMS = humanLifeData.domains.flatMap(
  (d) => d.subItems,
);
const TWIST_ITEMS = twistsData.categories.flatMap(
  (c) => c.subItems,
);

// ─── Constants ────────────────────────────────────────────────────────────────
// Machine natural coordinate space: 1800px wide (matching the slot SVG paths)
const MACHINE_W = 1960; // 1800 body + 160 lever overhang
const MACHINE_H = 1850; // title(608) + body(~884) + ticket-overflow-space; ticket is absolute so body doesn't grow
const BG = "#000000";

// ─── Golden Ticket ────────────────────────────────────────────────────────────
// Background SVG is 500×187.5 viewBox (perforated ticket shape). Rendered at
// exact 1600×600px (×3.2 scale) so the perforations stay round — never skewed.
// overflow:hidden on the outer div crops whatever background extends below content.
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
          <em>A </em>
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<
    "idle" | "spinning" | "done"
  >("idle");
  const [leverPulled, setLeverPulled] = useState(false);
  const [finalValues, setFinalValues] = useState(["", "", ""]);
  const [activeLightGroup, setActiveLightGroup] = useState(-1);
  const [ticketVisible, setTicketVisible] = useState(false);

  const slot0Ref = useRef<SlotWindowHandle>(null);
  const slot1Ref = useRef<SlotWindowHandle>(null);
  const slot2Ref = useRef<SlotWindowHandle>(null);

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

  const spin = useCallback(() => {
    if (phase === "spinning") return;
    clearAll();

    const finals = [
      pick(FORMAT_ITEMS),
      pick(SPACE_ITEMS),
      pick(TWIST_ITEMS),
    ];
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
    const SPIN_TIMES = [1000, 2000, 3000] as const;
    slot0Ref.current?.spin(finals[0], SPIN_TIMES[0]);
    slot1Ref.current?.spin(finals[1], SPIN_TIMES[1]);
    slot2Ref.current?.spin(finals[2], SPIN_TIMES[2]);

    // Lights start after the last slot finishes (spinMs + DECEL_MS + small buffer)
    timers.current.push(
      setTimeout(
        () => {
          setPhase("done");
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
              timers.current.push(
                setTimeout(() => setTicketVisible(true), 300),
              );
            }
          }, STEP_MS);
          intervals.current.push(wave);
        },
        SPIN_TIMES[2] + DECEL_MS + 150,
      ),
    );
  }, [phase, clearAll]);

  // Scale: machine body ~50% of viewport width, centered with margins
  const [scale, setScale] = useState(0.35);
  useEffect(() => {
    const update = () => {
      // Target: machine visible at ~50% of viewport width
      const s = (window.innerWidth * 0.5) / MACHINE_W;
      setScale(Math.min(0.75, Math.max(0.2, s)));
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
                <p
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    margin: 0,
                  }}
                >
                  FORMAT
                </p>
                <p
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    margin: 0,
                  }}
                >
                  SPACE
                </p>
                <p
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    margin: 0,
                  }}
                >
                  TWIST
                </p>
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
                      { items: FORMAT_ITEMS, ref: slot0Ref },
                      { items: SPACE_ITEMS, ref: slot1Ref },
                      { items: TWIST_ITEMS, ref: slot2Ref },
                    ] as const
                  ).map(({ items, ref }, i) => (
                    <SlotWindow
                      key={i}
                      ref={ref}
                      slotIdx={i}
                      allItems={items}
                    />
                  ))}
                </div>
                <Lever pulled={leverPulled} onClick={spin} />
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