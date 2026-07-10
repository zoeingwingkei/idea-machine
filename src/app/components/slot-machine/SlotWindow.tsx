import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { flushSync } from "react-dom";
import svgPaths from "@/imports/SlotMachine/svg-wjwgi5pl1w";

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SLOT_VIEWBOXES = [
  "32 32 572 360",
  "612 32 576 360",
  "1201 32 567 360",
];
const SLOT_BG_PATHS = [
  svgPaths.pd81fd80,
  svgPaths.p6527600,
  svgPaths.p100c1d00,
];

const PLACEHOLDER = "__placeholder__";

function PlaceholderIcon() {
  return (
    <svg
      width="160"
      height="175"
      viewBox="0 0 53 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M52.8 50.28C52.8 52.96 52.28 54.9 51.24 56.1C50.24 57.34 48.38 57.96 45.66 57.96H7.74C5.06 57.96 3.1 57.34 1.86 56.1C0.62 54.9 0 52.96 0 50.28V7.74C0 5.26 0.68 3.36 2.04 2.04C3.4 0.68 5.3 0 7.74 0H43.86C46.58 0 48.74 0.619999 50.34 1.86C51.98 3.06 52.8 5.02 52.8 7.74V50.28ZM7.74 2.16C5.94 2.16 4.56 2.64 3.6 3.6C2.64 4.56 2.16 5.94 2.16 7.74V48.42C2.16 50.22 2.64 51.5 3.6 52.26C4.56 53.02 5.94 53.4 7.74 53.4H42.06C43.86 53.4 45.14 53.02 45.9 52.26C46.66 51.5 47.04 50.22 47.04 48.42V7.74C47.04 5.94 46.66 4.56 45.9 3.6C45.14 2.64 43.86 2.16 42.06 2.16H7.74ZM24.6 15.24C23.36 15.24 22.26 15.68 21.3 16.56C20.38 17.44 19.64 18.4 19.08 19.44L18.48 19.38L17.76 15.96L17.88 15.78C18.44 15.34 19.36 14.78 20.64 14.1C21.92 13.38 23.38 13.02 25.02 13.02C27.3 13.02 29.24 13.64 30.84 14.88C32.48 16.12 33.3 17.76 33.3 19.8C33.3 20.96 32.98 21.98 32.34 22.86C31.7 23.74 30.94 24.5 30.06 25.14C29.18 25.78 28.38 26.36 27.66 26.88C27.02 27.36 26.4 28 25.8 28.8C25.24 29.56 24.96 30.76 24.96 32.4V34.14C24.96 34.3 24.84 34.46 24.6 34.62C24.36 34.78 24.14 34.86 23.94 34.86C23.78 34.86 23.56 34.78 23.28 34.62C23.04 34.46 22.92 34.3 22.92 34.14V32.34C22.92 31.34 23.12 30.22 23.52 28.98C23.96 27.7 24.9 26.4 26.34 25.08C27.26 24.24 27.8 23.44 27.96 22.68C28.12 21.92 28.2 21.02 28.2 19.98C28.2 18.5 27.92 17.34 27.36 16.5C26.8 15.66 25.88 15.24 24.6 15.24ZM21.42 40.38V40.2C21.7 39.52 22.04 38.98 22.44 38.58C22.84 38.14 23.42 37.78 24.18 37.5H24.3C25.02 37.78 25.58 38.12 25.98 38.52C26.42 38.92 26.78 39.48 27.06 40.2V40.38C26.5 41.86 25.58 42.76 24.3 43.08H24.18C23.38 42.88 22.78 42.58 22.38 42.18C21.98 41.78 21.66 41.18 21.42 40.38Z"
        fill="#1E1E1E"
      />
    </svg>
  );
}

const ITEM_H = 360;
const SPIN_SPEED = 8000; // local CSS px/sec at full speed (translateY coordinate space)
export const DECEL_MS = 850; // deceleration window
const DECEL_ITEMS = 12; // extra random items consumed during decel for tactile stop
const BOUNCE_BUFFER_ITEMS = 2; // extra items past final, revealed briefly during overshoot

// Deceleration "spring" shape: the reel overshoots past the final item in the
// spin direction, swings back past it the other way (a smaller distance),
// then settles at rest — mirrors a slot reel's physical stop. Fine-tune the
// feel with these four knobs:
const OVERSHOOT_ITEMS = 0.3; // how far past the final item it overshoots, in item-heights
const RECOIL_ITEMS = 0.15; // how far it swings back the opposite way, in item-heights (keep < OVERSHOOT_ITEMS)
const OVERSHOOT_PEAK_T = 0.3; // fraction of DECEL_MS at which the overshoot peaks (0-1)
const RECOIL_PEAK_T = 0.6; // fraction of DECEL_MS at which the recoil peaks (0-1, must be > OVERSHOOT_PEAK_T)

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Interpolates through three keyframes (overshoot -> recoil -> rest) to
// produce the spring-like stop. `t` is decel progress in [0, 1].
function bounceY(
  t: number,
  from: number,
  overshoot: number,
  recoil: number,
  rest: number,
): number {
  if (t <= OVERSHOOT_PEAK_T) {
    const localT = t / OVERSHOOT_PEAK_T;
    return from + (overshoot - from) * easeOutCubic(localT);
  }
  if (t <= RECOIL_PEAK_T) {
    const localT =
      (t - OVERSHOOT_PEAK_T) / (RECOIL_PEAK_T - OVERSHOOT_PEAK_T);
    return overshoot + (recoil - overshoot) * easeInOutCubic(localT);
  }
  const localT = (t - RECOIL_PEAK_T) / (1 - RECOIL_PEAK_T);
  return recoil + (rest - recoil) * easeInOutCubic(localT);
}

export interface SlotWindowHandle {
  spin: (final: string, spinMs: number) => Promise<void>;
  setStatic: (value: string) => void;
}

export const SlotWindow = forwardRef<
  SlotWindowHandle,
  { allItems: string[]; slotIdx: number; hovered?: boolean }
>(({ allItems, slotIdx, hovered = false }, ref) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [items, setItems] = useState<string[]>(() => [
    PLACEHOLDER,
  ]);

  useEffect(
    () => () => {
      if (rafRef.current != null)
        cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  useImperativeHandle(ref, () => ({
    spin(final, spinMs) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      return new Promise<void>((resolve) => {
        const windowEl = windowRef.current;
        const trackEl = trackRef.current;
        if (!windowEl || !trackEl) {
          resolve();
          return;
        }

        // Use the element's local CSS px height (not getBoundingClientRect, which
        // returns scaled screen px — translateY operates in local px, not screen px)
        const itemHeight = ITEM_H;
        const spinItems = Math.round(
          (SPIN_SPEED * (spinMs / 1000)) / itemHeight,
        );
        const finalIndex = spinItems + DECEL_ITEMS;

        const strip = Array.from({ length: finalIndex }, () =>
          pick(allItems),
        );
        strip.push(final);
        // Buffer items past final so the overshoot bounce has content to
        // reveal instead of blank space.
        for (let i = 0; i < BOUNCE_BUFFER_ITEMS; i++) {
          strip.push(pick(allItems));
        }

        // flushSync so React commits the new strip before the rAF reads the DOM
        flushSync(() => setItems(strip));

        requestAnimationFrame(() => {
          trackEl.style.transition = "";
          trackEl.style.transform = "translateY(0px)";
          void trackEl.offsetHeight; // force reflow before animating

          const targetY = -finalIndex * itemHeight;
          const startTime = performance.now();
          let phase: "spin" | "decel" = "spin";
          let decelStart = 0;
          let decelFromY = 0;

          const tick = (now: number) => {
            if (phase === "spin") {
              const elapsed = now - startTime;
              const y = -((elapsed / 1000) * SPIN_SPEED);
              trackEl.style.transform = `translateY(${y}px)`;
              trackEl.style.filter = "blur(3px)";
              if (elapsed >= spinMs) {
                phase = "decel";
                decelStart = now;
                decelFromY = y;
              }
              rafRef.current = requestAnimationFrame(tick);
            } else {
              const t = Math.min(
                1,
                (now - decelStart) / DECEL_MS,
              );
              const y = bounceY(
                t,
                decelFromY,
                targetY - OVERSHOOT_ITEMS * itemHeight,
                targetY + RECOIL_ITEMS * itemHeight,
                targetY,
              );
              trackEl.style.transform = `translateY(${y}px)`;
              trackEl.style.filter = `blur(${Math.max(0, (1 - t) * 3).toFixed(2)}px)`;
              if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
              } else {
                trackEl.style.filter = "blur(0px)";
                resolve();
              }
            }
          };
          rafRef.current = requestAnimationFrame(tick);
        });
      });
    },
    setStatic(value) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setItems([value]);
      const trackEl = trackRef.current;
      requestAnimationFrame(() => {
        if (!trackEl) return;
        trackEl.style.transition = "";
        trackEl.style.transform = "translateY(0px)";
        trackEl.style.filter = "blur(0px)";
      });
    },
  }));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <svg
        style={{
          position: "absolute",
          display: "block",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        fill="none"
        preserveAspectRatio="none"
        viewBox={SLOT_VIEWBOXES[slotIdx]}
      >
        <path
          d={SLOT_BG_PATHS[slotIdx]}
          fill="white"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        {/* Inner golden glow — hover affordance indicating the slot can be clicked to pick an exact item.
            strokeWidth is 2x the intended visible band: the clip-path (same shape as the ticket) cuts
            away the outer half, so the glow hugs the inside edge instead of bleeding past the ticket. */}
        <defs>
          <clipPath id={`slot-glow-clip-${slotIdx}`}>
            <path
              d={SLOT_BG_PATHS[slotIdx]}
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </clipPath>
        </defs>
        <path
          d={SLOT_BG_PATHS[slotIdx]}
          fill="none"
          stroke="#EECC6D"
          strokeWidth={56}
          fillRule="evenodd"
          clipRule="evenodd"
          clipPath={`url(#slot-glow-clip-${slotIdx})`}
          style={{
            opacity: hovered ? 0.5 : 0,
            transition: "opacity 0.2s ease",
            filter:
              "drop-shadow(0 0 10px rgba(238,204,109,0.9))",
            pointerEvents: "none",
          }}
        />
      </svg>
      <div
        ref={windowRef}
        style={{
          position: "absolute",
          inset: "0 48px",
          overflow: "hidden",
        }}
      >
        <div
          ref={trackRef}
          style={{ display: "flex", flexDirection: "column" }}
        >
          {items.map((text, i) => (
            <p
              key={i}
              style={{
                height: ITEM_H,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Arvo', sans-serif",
                fontWeight: 700,
                fontSize: 64,
                lineHeight: 1.2,
                color: "#1e1e1e",
                textAlign: "center",
                wordBreak: "break-word",
                margin: 0,
                padding: "0 16px",
              }}
            >
              {text === PLACEHOLDER ? <PlaceholderIcon /> : text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
});
