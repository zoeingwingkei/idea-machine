// Small DOM/browser helpers shared by the instrument modules.

/** Web Storage with JSON values; never throws (private mode, blocked storage). */
function jsonStorage(backing: () => Storage) {
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const v = backing().getItem(key);
        return v == null ? fallback : (JSON.parse(v) as T);
      } catch {
        return fallback;
      }
    },
    set(key: string, value: unknown): void {
      try {
        backing().setItem(key, JSON.stringify(value));
      } catch {
        /* it just won't persist */
      }
    },
  };
}

/** Kept across visits: preferences (sound, "lock after choosing"). */
export const store = jsonStorage(() => localStorage);

/** Kept for this browser session only: the Recent history. */
export const sessionStore = jsonStorage(() => sessionStorage);

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for use inside innerHTML templates. */
export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const reducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Small seeded PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Copy text to the clipboard, with a textarea fallback for older browsers. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText =
        "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
