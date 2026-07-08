import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface ReelHandle {
  spin: (final: string, spinMs: number) => Promise<void>;
}

interface ReelProps {
  pool: string[];
  initial: string;
  clipPathId: string;
}

const SPIN_SPEED = 2200; // px/sec while at full speed
const DECEL_MS = 850;
const DECEL_ITEMS = 7; // extra items travelled while decelerating, for a smooth "click click click" stop

// easeOutQuint: decelerates hard into the final item with no overshoot, so the
// reel never passes its landing word and bounces back onto a different one.
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

const Reel = forwardRef<ReelHandle, ReelProps>(({ pool, initial, clipPathId }, ref) => {
  const [items, setItems] = useState<string[]>([initial]);
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    spin(final: string, spinMs: number) {
      return new Promise<void>((resolve) => {
        const windowEl = windowRef.current;
        const trackEl = trackRef.current;
        if (!windowEl || !trackEl) {
          resolve();
          return;
        }

        // getBoundingClientRect (not clientHeight, which rounds to an
        // integer) so this matches the item's true fractional CSS height —
        // otherwise a fraction-of-a-pixel-per-item error compounds over the
        // dozens of items scrolled per spin and the reel lands off-center.
        const itemHeight = windowEl.getBoundingClientRect().height;
        const spinDistanceItems = Math.round((SPIN_SPEED * (spinMs / 1000)) / itemHeight);
        const finalIndex = spinDistanceItems + DECEL_ITEMS;

        const strip = Array.from({ length: finalIndex }, () => pool[Math.floor(Math.random() * pool.length)]);
        strip.push(final);
        setItems(strip);

        requestAnimationFrame(() => {
          trackEl.style.transform = 'translateY(0px)';
          void trackEl.offsetHeight; // force reflow before animating

          const targetY = -finalIndex * itemHeight;
          const startTime = performance.now();
          let phase: 'spin' | 'decel' = 'spin';
          let decelStart = 0;
          let decelFromY = 0;

          const tick = (now: number) => {
            if (phase === 'spin') {
              const elapsed = now - startTime;
              const y = -((elapsed / 1000) * SPIN_SPEED);
              trackEl.style.transform = `translateY(${y}px)`;
              if (elapsed >= spinMs) {
                phase = 'decel';
                decelStart = now;
                decelFromY = y;
              }
              rafRef.current = requestAnimationFrame(tick);
            } else {
              const t = Math.min(1, (now - decelStart) / DECEL_MS);
              const eased = easeOutQuint(t);
              const y = decelFromY + (targetY - decelFromY) * eased;
              trackEl.style.transform = `translateY(${y}px)`;
              if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
              } else {
                // Land and stay put — the strip already shows `final` at this
                // exact position. Resetting transform/items here would briefly
                // show the wrong word before React's update commits.
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
    <div className="reel-window" ref={windowRef} style={{ clipPath: `url(#${clipPathId})` }}>
      <div className="reel-track" ref={trackRef}>
        {items.map((label, i) => (
          <div className="reel-item" key={i}>
            <span className="reel-item-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

Reel.displayName = 'Reel';

export default Reel;
