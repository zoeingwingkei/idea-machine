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
}

export const SlotWindow = forwardRef<
  SlotWindowHandle,
  { allItems: string[]; slotIdx: number }
>(({ allItems, slotIdx }, ref) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [items, setItems] = useState<string[]>(() => [
    pick(allItems),
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
  }));

  return (
    <div
      style={{
        flex: "1 0 0",
        height: ITEM_H,
        minWidth: 0,
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
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
});
