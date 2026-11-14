import { useEffect, useRef } from "react";

// ─── Line-art starfield background ──────────────────────────────────────────────
// Upright line-art stars (the five exact source SVGs — a cross, two ray-bursts
// and two concave sparkles) that blink in and out behind the Idea Machine.
// Explored in background-style-exploration/ideas/linestars.html; this is that
// demo with the chosen presets baked in.
//
// Renders into a fixed, full-viewport canvas that sits BETWEEN the page's black
// background and the machine (pointer-events:none so the machine stays
// interactive). The machine body is transparent (only white borders/text on the
// black page), so stars are dimmed inside the machine's live on-screen rect (the
// "shield"), re-measured each frame so it tracks the machine as it scales / when
// the About panel slides it.

// Locked-in presets (from the exploration control panel):
const COUNT = 80;         // star count
const SIZE = 11;          // star size (native-SVG → screen factor is SIZE/22)
const SPACING = 1.0;      // min-distance multiplier used to avoid overlaps
const BLINK_SPEED = 0.5;  // blink speed
const LINE_WEIGHT = 1.2;  // stroke width, uniform across every shape + size
const GLOW = 1.0;         // soft glow amount

// Warm off-white, matching the exploration on a dark background (pairs with the
// app's gold/cream palette). Swap for "#FFFFFF" if you want the pure-white look.
const STROKE = "#FBF3DD";

// The five exact star SVGs (star 01–05): raw path `d` strings + viewBox size.
const SHAPE_DEFS = [
  { w: 10, h: 10, d: [                                   // star 01 · cross
    "M8.55029 1.125L1.2877 8.38759",
    "M1.28906 1.125L8.55155 8.38749",
    "M8.3877 1.5625L1.1251 8.82509",
    "M1.12646 1.5625L8.38895 8.82499",
  ] },
  { w: 42, h: 58, d: [                                   // star 02 · tall burst
    "M40.1455 28.3008H1.28698",
    "M20.7168 1.125V55.4752",
    "M30.6172 18.4004L10.8215 38.1975",
    "M30.6172 38.1975L10.8215 18.4004",
    "M39.9834 28.7383H1.12487",
    "M20.5542 1.5625V55.9127",
    "M30.4541 18.8379L10.6584 38.635",
    "M30.4541 38.635L10.6584 18.8379",
  ] },
  { w: 35, h: 38, d: [                                   // star 03 · sparkle (large)
    "M17.3703 35.7289C17.3703 20.3494 19.1573 18.4269 33.4531 18.4269C19.1573 18.4269 17.3703 16.5045 17.3703 1.125C17.3703 16.5045 15.5833 18.4269 1.28752 18.4269C15.5833 18.4269 17.3703 20.3494 17.3703 35.7289Z",
    "M17.2077 36.1664C17.2077 20.7869 18.9947 18.8644 33.2905 18.8644C18.9947 18.8644 17.2077 16.942 17.2077 1.5625C17.2077 16.942 15.4207 18.8644 1.12492 18.8644C15.4207 18.8644 17.2077 20.7869 17.2077 36.1664Z",
  ] },
  { w: 34, h: 46, d: [                                   // star 04 · burst
    "M32.1118 22.6816H1.28772",
    "M16.7002 1.125V44.2348",
    "M24.5532 14.8301L8.85048 30.5328",
    "M24.5532 30.5328L8.85048 14.8301",
    "M31.9492 23.1191H1.12512",
    "M16.5376 1.5625V44.6723",
    "M24.3906 15.2676L8.68788 30.9703",
    "M24.3906 30.9703L8.68788 15.2676",
  ] },
  { w: 28, h: 31, d: [                                   // star 05 · sparkle (small)
    "M14.0452 28.5723C14.0452 16.3735 15.4627 14.8486 26.8027 14.8486C15.4627 14.8486 14.0452 13.3238 14.0452 1.125C14.0452 13.3238 12.6277 14.8486 1.28773 14.8486C12.6277 14.8486 14.0452 16.3735 14.0452 28.5723Z",
    "M13.8826 29.0098C13.8826 16.811 15.3001 15.2861 26.6401 15.2861C15.3001 15.2861 13.8826 13.7613 13.8826 1.5625C13.8826 13.7613 12.4651 15.2861 1.12513 15.2861C12.4651 15.2861 13.8826 16.811 13.8826 29.0098Z",
  ] },
];

type Shape = { w: number; h: number; path: Path2D };

// One combined Path2D per shape so all of a star's lines stroke in ONE operation:
// that paints their union as a single coverage mask, so the blink's sub-1 alpha
// stays uniform (stroking each line separately would brighten the crossing centre).
const SHAPES: Shape[] = SHAPE_DEFS.map((s) => {
  const path = new Path2D();
  s.d.forEach((d) => path.addPath(new Path2D(d)));
  return { w: s.w, h: s.h, path };
});

// Weighted mix: sparkles common, bursts rarer, cross as a small accent.
// indices → 0:cross 1:tall-burst 2:sparkle-L 3:burst 4:sparkle-S
const SHAPE_MIX = [0, 2, 2, 4, 4, 3, 1];

type Star = {
  x: number;
  y: number;
  shape: number;
  mul: number;
  r: number;
  phase: number;
  rate: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function StarfieldBackground({
  machineRef,
  shieldRefs = [],
}: {
  // The scaled machine wrapper, used to compute the shield rectangle so stars
  // fade out over the machine and never clutter behind its text.
  machineRef: React.RefObject<HTMLElement | null>;
  // Additional elements (e.g. the About button and its text panel) that get
  // the same treatment: stars fully hidden behind them, fading back in just
  // outside their edges. Skipped while an element is unmounted or collapsed
  // to zero size (e.g. the About panel while closed).
  shieldRefs?: React.RefObject<HTMLElement | null>[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const K = SIZE / 22; // native-SVG-size → screen-size factor
    let W = 0;
    let H = 0;
    let dpr = 1;
    let stars: Star[] = [];

    // Rejection-sampled placement: each star is kept only if it's at least
    // (r + otherR) * SPACING from every star already placed (retry, then place
    // anyway if it can't clear — so COUNT is always honoured).
    function build() {
      stars = [];
      for (let i = 0; i < COUNT; i++) {
        const big = Math.random() < 0.06;
        const shape = SHAPE_MIX[(Math.random() * SHAPE_MIX.length) | 0];
        const mul = rand(0.75, 1.25) * (big ? 1.5 : 1);
        const shp = SHAPES[shape];
        // Footprint radius; 0.62 discounts the empty corners of these spiky shapes.
        const r = K * mul * (Math.max(shp.w, shp.h) / 2) * 0.62;

        const tries = SPACING > 0 ? 26 : 1;
        let x = Math.random() * W;
        let y = Math.random() * H;
        for (let a = 0; a < tries; a++) {
          const cx = Math.random() * W;
          const cy = Math.random() * H;
          let ok = true;
          for (const q of stars) {
            const dx = cx - q.x;
            const dy = cy - q.y;
            const md = (r + q.r) * SPACING;
            if (dx * dx + dy * dy < md * md) { ok = false; break; }
          }
          if (ok) { x = cx; y = cy; break; }
        }

        stars.push({
          x, y, shape, mul, r,
          phase: Math.random() * Math.PI * 2,
          rate: rand(0.4, 1.5),
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    // Shields: fully hide stars anywhere over a live element's box (plus a
    // margin), fading them back in over ~80px just outside it. Re-measured
    // each frame so each shield tracks its element as it scales / slides /
    // opens. The machine gets a proportional margin (for its border + lever
    // overhang) — an earlier version *inset* the covered zone by 6%/12%,
    // which left the title at top and the output/ticket at bottom exposed,
    // only the centre was protected. The extra shields (About button, About
    // text panel) are small fixed-size UI elements, so a flat pixel margin
    // fits them better than a percentage of their own box.
    type Rect = { x: number; y: number; w: number; h: number };
    let shields: Rect[] = [];
    function measure() {
      const rects: Rect[] = [];
      const mEl = machineRef.current;
      if (mEl) {
        const r = mEl.getBoundingClientRect();
        const mx = r.width * 0.05;
        const my = r.height * 0.04;
        rects.push({
          x: r.left - mx,
          y: r.top - my,
          w: r.width + mx * 2,
          h: r.height + my * 2,
        });
      }
      for (const ref of shieldRefs) {
        const el = ref.current;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // collapsed/closed
        const margin = 16;
        rects.push({
          x: r.left - margin,
          y: r.top - margin,
          w: r.width + margin * 2,
          h: r.height + margin * 2,
        });
      }
      shields = rects;
    }
    function mask(x: number, y: number): number {
      let result = 1;
      for (const rect of shields) {
        const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
        const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
        const d =
          dx === 0 && dy === 0
            ? 0 // fully hidden inside this shield
            : Math.min(Math.hypot(dx, dy) / 80, 1);
        result = Math.min(result, d);
        if (result === 0) break;
      }
      return result;
    }

    function drawFrame(t: number) {
      measure();
      ctx!.clearRect(0, 0, W, H);
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      for (const st of stars) {
        const tw = 0.5 + 0.5 * Math.sin(st.phase + t * st.rate * BLINK_SPEED * 2);
        const blink = tw * tw; // sharper on/off than a plain sine
        const a = (0.05 + 0.95 * blink) * mask(st.x, st.y);
        if (a <= 0.02) continue;
        const bs = 0.72 + 0.38 * blink; // small pop as it brightens
        const scale = K * st.mul * bs;
        const shp = SHAPES[st.shape];
        ctx!.save();
        ctx!.translate(st.x, st.y);
        ctx!.scale(scale, scale);
        ctx!.translate(-shp.w / 2, -shp.h / 2);
        ctx!.globalAlpha = a;
        ctx!.strokeStyle = STROKE;
        ctx!.lineWidth = LINE_WEIGHT / scale; // constant visual stroke across sizes
        if (GLOW > 0) {
          ctx!.shadowBlur = (GLOW * 6) / scale;
          ctx!.shadowColor = STROKE;
        }
        ctx!.stroke(shp.path); // single stroke → uniform alpha, no bright centre
        ctx!.restore();
      }
      ctx!.shadowBlur = 0;
      ctx!.globalAlpha = 1;
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let t = 0;

    if (reduceMotion) {
      drawFrame(0); // honour reduced-motion: one calm static frame
    } else {
      const loop = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        t += dt;
        drawFrame(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [machineRef, shieldRefs]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
