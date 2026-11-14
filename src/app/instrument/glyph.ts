// Per-idea glyph: every idea gets its own symmetric picture on a round
// 25 × 25 dot grid, seeded by its serial number, so the same idea always
// draws the same glyph.
//
// Values per dot: 0 = off, 0–1 = brightness, 2 = accent dot.

import { rng } from "./util";

export type Glyph = Float32Array;

export interface GlyphTheme {
  /** "r,g,b" for lit dots */
  on: string;
  /** CSS colour for unlit dots */
  off: string;
  /** "r,g,b" for accent dots */
  accent: string;
}

/** Light dots on the dark dial, with orange accents — the instrument's look. */
export const DIAL_THEME: GlyphTheme = { on: "242,238,230", off: "#2B2B29", accent: "255,90,31" };

const N = 25;
const C = (N - 1) / 2;
const R = 12.2;
const ACCENT = 2;
const inCircle = (x: number, y: number) => Math.hypot(x - C, y - C) <= R;

export const blankGlyph = (): Glyph => new Float32Array(N * N);

/** Build the glyph for a serial number. accent: some dots become accent dots. */
export function makeGlyph(serial: number, { accent = false } = {}): Glyph {
  const rand = rng(Math.imul(serial, 2654435761));
  let g = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x <= C; x++) {
      const d = Math.hypot(x - C, y - C) / R;
      const on = rand() < 0.62 - d * 0.42 ? 1 : 0;
      g[y * N + x] = g[y * N + (N - 1 - x)] = on;
    }
  }
  // Two passes of cellular smoothing → blobby, readable shapes (symmetry is preserved).
  for (let pass = 0; pass < 2; pass++) {
    const n = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const xx = x + dx;
            const yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < N && yy < N) s += g[yy * N + xx];
          }
        }
        const v = g[y * N + x];
        n[y * N + x] = s >= 5 ? 1 : s <= 2 ? 0 : v;
      }
    }
    g = n;
  }
  // Mask to the circle, leave the outer ring dark, add a little texture.
  for (let y = 0; y < N; y++) {
    for (let x = 0; x <= C; x++) {
      const i = y * N + x;
      const j = y * N + (N - 1 - x);
      if (Math.hypot(x - C, y - C) > R - 1.4) {
        g[i] = g[j] = 0;
        continue;
      }
      if (g[i] && rand() < 0.12) g[i] = g[j] = accent ? ACCENT : 0.38;
    }
  }
  return g;
}

export function drawGlyph(
  canvas: HTMLCanvasElement,
  values: Glyph,
  size: number,
  t: GlyphTheme,
  /** Canvas pixels per CSS pixel; defaults to the screen's (capped at 2). */
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2),
): void {
  const dpr = pixelRatio;
  const px = Math.max(1, Math.round(size * dpr));
  if (canvas.width !== px) {
    canvas.width = px;
    canvas.height = px;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, px, px);
  const cell = px / N;
  const r = cell * 0.36;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!inCircle(x, y)) continue;
      const v = values[y * N + x];
      if (v === ACCENT) ctx.fillStyle = `rgb(${t.accent})`;
      else if (v > 0) ctx.fillStyle = `rgba(${t.on},${0.12 + 0.88 * Math.min(1, v)})`;
      else ctx.fillStyle = t.off;
      ctx.beginPath();
      ctx.arc((x + 0.5) * cell, (y + 0.5) * cell, v > 0 ? r : r * 0.82, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Dissolve from one glyph into another: dots flicker, then settle one by one.
 * alive() lets the caller cancel (return false and it resolves straight away).
 */
export function animateGlyph(
  canvas: HTMLCanvasElement,
  from: Glyph,
  to: Glyph,
  opts: {
    dur: number;
    size: number;
    theme: GlyphTheme;
    alive: () => boolean;
    reduced: boolean;
  },
): Promise<void> {
  const { dur, size, theme, alive, reduced } = opts;
  return new Promise((resolve) => {
    if (reduced) {
      drawGlyph(canvas, to, size, theme);
      return resolve();
    }
    const settleAt = new Float32Array(N * N).map(() => 0.2 + Math.random() * 0.8);
    const cur = new Float32Array(N * N);
    let t0: number | null = null;
    let last = 0;
    function frame(now: number) {
      if (!alive()) return resolve();
      if (t0 === null) t0 = now;
      const p = Math.min(1, (now - t0) / dur);
      if (now - last > 50 || p >= 1) {
        last = now;
        for (let i = 0; i < cur.length; i++) {
          if (p >= settleAt[i]) cur[i] = to[i];
          else if (p < 0.15)
            cur[i] =
              Math.min(1, from[i]) * (1 - p / 0.15) +
              (Math.random() < 0.25 ? Math.random() : 0);
          else cur[i] = Math.random() < 0.22 ? 0.25 + Math.random() * 0.75 : 0;
        }
        drawGlyph(canvas, cur, size, theme);
      }
      if (p >= 1) return resolve();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
