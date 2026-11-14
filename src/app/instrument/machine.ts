// The idea machine's state, independent of how it is drawn:
//
//   - balanced picking (category first, then item)
//   - per-reel locks
//   - an idea code that reopens an exact idea:  #012-07-088  (reel indices)
//   - a serial number per idea (seeds its glyph)
//   - a per-mode history of this browser session's ideas (sessionStorage)
//
// The controller listens to its events and renders.

import { sessionStore } from "./util";
import type { Lang, Mode, ReelDef, Texts } from "./modes";

export interface ReelItem {
  en: string;
  zh: string;
  cat: string;
  cat_zh: string;
  /** category index */
  ci: number;
}

export interface Reel {
  def: ReelDef;
  categories: ReelDef["map"]["categories"];
  items: ReelItem[];
  /** index of each category's first item in `items` */
  offsets: number[];
}

/** A full idea: one item index per reel. */
export type Idx = [number, number, number];

export type ChangeSource =
  | "boot"
  | "roll"
  | "pick"
  | "nudge"
  | "memory"
  | "link"
  | "lang";

interface Events {
  change: { prev: Idx; next: Idx; source: ChangeSource };
  lock: { ri: number; locked: boolean };
  history: string[];
  lang: Lang;
}

function buildReel(def: ReelDef): Reel {
  const items: ReelItem[] = [];
  const offsets: number[] = [];
  def.map.categories.forEach((c, ci) => {
    offsets.push(items.length);
    c.subItems.forEach((en, ii) => {
      items.push({
        en,
        zh: c.subItems_zh[ii] || en,
        cat: c.category,
        cat_zh: c.category_zh || c.category,
        ci,
      });
    });
  });
  return { def, categories: def.map.categories, items, offsets };
}

/** Upper bound only, so a very long session can't grow storage forever. */
const HISTORY_SIZE = 200;

export class Machine {
  readonly mode: Mode;
  readonly reels: Reel[];
  readonly sizes: number[];
  idx: Idx;
  locks = [false, false, false];
  lang: Lang;
  history: string[];

  private readonly widths: number[];
  private readonly historyKey: string;
  private fns: { [K in keyof Events]: ((d: Events[K]) => void)[] } = {
    change: [],
    lock: [],
    history: [],
    lang: [],
  };

  /** The idea comes from the URL hash if there is one, otherwise it's random. */
  constructor(mode: Mode, lang: Lang) {
    this.mode = mode;
    this.lang = lang;
    this.reels = mode.reels.map(buildReel);
    this.sizes = this.reels.map((r) => r.items.length);
    this.widths = this.sizes.map((n) => String(n - 1).length);
    this.historyKey = `im.history.${mode.id}`;
    this.history = sessionStore
      .get<unknown[]>(this.historyKey, [])
      .filter((c): c is string => typeof c === "string" && !!this.parse(c));
    this.idx =
      this.parse(location.hash) ??
      [this.randomIndex(0), this.randomIndex(1), this.randomIndex(2)];
    this.pushHistory();
    this.writeHash();
  }

  on<K extends keyof Events>(type: K, fn: (d: Events[K]) => void): void {
    this.fns[type].push(fn);
  }

  private emit<K extends keyof Events>(type: K, detail: Events[K]): void {
    this.fns[type].forEach((fn) => fn(detail));
  }

  /* --- reading --- */

  label(ri: number): string {
    return this.reels[ri].def.label[this.lang];
  }

  text(ri: number, i = this.idx[ri]): string {
    const it = this.reels[ri].items[i];
    return this.lang === "zh" ? it.zh : it.en;
  }

  texts(idx: Idx = this.idx): Texts {
    return [this.text(0, idx[0]), this.text(1, idx[1]), this.text(2, idx[2])];
  }

  categoryName(ri: number, ci: number): string {
    const c = this.reels[ri].categories[ci];
    return this.lang === "zh" ? c.category_zh : c.category;
  }

  sentence(idx: Idx = this.idx): string {
    return this.mode.sentence(this.texts(idx), this.lang);
  }

  prompt(idx: Idx = this.idx): string {
    const [a, b, c] = this.locks;
    return this.mode.prompt(this.texts(idx), this.lang, [a, b, c]);
  }

  /* --- picking --- */

  /** Category first, then item — so a big category can't dominate. */
  randomIndex(ri: number, avoid = -1): number {
    const r = this.reels[ri];
    for (let tries = 0; tries < 24; tries++) {
      const ci = Math.floor(Math.random() * r.categories.length);
      const i = r.offsets[ci] + Math.floor(Math.random() * r.categories[ci].subItems.length);
      if (i !== avoid) return i;
    }
    return (avoid + 1) % this.sizes[ri];
  }

  /** Any item from a reel — used as filler while a reveal is running. */
  randomText(ri: number): string {
    return this.text(ri, Math.floor(Math.random() * this.sizes[ri]));
  }

  roll(): void {
    const next = this.idx.map((i, ri) =>
      this.locks[ri] ? i : this.randomIndex(ri, i),
    ) as Idx;
    this.set(next, "roll");
  }

  /** opts.remember = false skips the history (e.g. while nudging a reel step by step). */
  set(idx: Idx, source: ChangeSource, { remember = true } = {}): void {
    const prev = this.idx;
    this.idx = [...idx];
    if (remember) this.pushHistory();
    this.writeHash();
    this.emit("change", { prev, next: [...this.idx], source });
  }

  setOne(ri: number, i: number, source: ChangeSource, opts?: { remember?: boolean }): void {
    const next: Idx = [...this.idx];
    next[ri] = i;
    this.set(next, source, opts);
  }

  /** Add the current idea to the history without changing anything else. */
  remember(): void {
    this.pushHistory();
    this.emit("history", this.history.slice());
  }

  toggleLock(ri: number, value = !this.locks[ri]): boolean {
    this.locks[ri] = value;
    this.emit("lock", { ri, locked: value });
    return value;
  }

  setLang(lang: Lang): void {
    if (lang === this.lang) return;
    this.lang = lang;
    this.emit("lang", lang);
  }

  /** Search one reel (en + zh). Prefix matches rank above substring matches. */
  search(ri: number, query: string): number[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored: { i: number; s: number }[] = [];
    this.reels[ri].items.forEach((it, i) => {
      const en = it.en.toLowerCase();
      let s = -1;
      if (en === q || it.zh === q) s = 0;
      else if (en.split(/[\s-]+/).some((w) => w.startsWith(q))) s = 1;
      else if (en.includes(q) || it.zh.includes(q)) s = 2;
      else if (it.cat.toLowerCase().includes(q) || it.cat_zh.includes(q)) s = 3;
      if (s >= 0) scored.push({ i, s });
    });
    return scored.sort((a, b) => a.s - b.s || a.i - b.i).map((x) => x.i);
  }

  /* --- numbers, codes and links --- */

  serial(idx: Idx = this.idx): number {
    return (idx[0] * this.sizes[1] + idx[1]) * this.sizes[2] + idx[2] + 1;
  }

  code(idx: Idx = this.idx): string {
    return idx.map((i, ri) => String(i).padStart(this.widths[ri], "0")).join("-");
  }

  parse(str: string): Idx | null {
    const m = /^#?(\d{1,4})-(\d{1,4})-(\d{1,4})$/.exec(str.trim());
    if (!m) return null;
    const idx: Idx = [+m[1], +m[2], +m[3]];
    return idx.every((v, ri) => v < this.sizes[ri]) ? idx : null;
  }

  /* --- internals --- */

  private pushHistory(): void {
    const c = this.code();
    this.history = [c, ...this.history.filter((x) => x !== c)].slice(0, HISTORY_SIZE);
    sessionStore.set(this.historyKey, this.history);
  }

  private writeHash(): void {
    const h = `#${this.code()}`;
    if (location.hash === h) return;
    // Keep the router's history state; only the hash changes.
    window.history.replaceState(window.history.state, "", h);
  }
}
