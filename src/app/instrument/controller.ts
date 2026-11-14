// Draws the machine and wires up its controls. Imperative on purpose: the
// reels, glyph and picker are animation-heavy and talk to the DOM directly
// (Web Animations, canvas, <dialog>), so React only provides a mount point
// (see InstrumentPage.tsx) and everything below that point is owned here.
//
//   const ui = mountInstrument(rootEl, { mode, lang, onToggleLang });
//   ui.setLang("zh");
//   ui.destroy();      // removes every listener, timer and animation

import { Machine, type ChangeSource, type Idx } from "./machine";
import type { Lang, Mode } from "./modes";
import { DEVICE_HTML } from "./template";
import { sound } from "./sound";
import { DIAL_THEME, animateGlyph, blankGlyph, drawGlyph, makeGlyph, type Glyph } from "./glyph";
import { createSaver } from "./save";
import { copyText, esc, reducedMotion, store, wait } from "./util";
import {
  trackCopyPrompt,
  trackReelLock,
  trackShareClick,
  trackSpin,
} from "@/app/analytics";

/* ---------- the few words on the machine ---------- */

const WORDS = {
  en: {
    lock: "Lock", browse: "Browse", roll: "Roll", skip: "Skip",
    copy: "Copy prompt", save: "Save image", lang: "中文", sound: "Sound",
    recent: "Recent", showAll: "Show all", showLess: "Show less", close: "Close", random: "Random", lockAfter: "Lock after choosing",
    all: "All", search: "Search", none: "Nothing matches",
    copied: "Prompt copied", allLocked: "All three are locked",
    soundOn: "Sound on", soundOff: "Sound off", locked: "locked",
    machine: "The Idea Machine", glyph: "Glyph for this idea",
    saveTitle: "Save your idea", saveHint: "PNG · QR code to the site", saving: "Generating…",
    scan: "1,000,000+ ideas. Scan for one.",
  },
  zh: {
    lock: "锁定", browse: "浏览", roll: "摇一摇", skip: "跳过",
    copy: "复制提示词", save: "保存图片", lang: "English", sound: "声音",
    recent: "最近", showAll: "显示全部", showLess: "收起", close: "关闭", random: "随机", lockAfter: "选中后锁定",
    all: "全部", search: "搜索", none: "没有匹配",
    copied: "已复制提示词", allLocked: "三项都已锁定",
    soundOn: "声音已开", soundOff: "声音已关", locked: "已锁定",
    machine: "点子机", glyph: "这个点子的图案",
    saveTitle: "保存你的点子", saveHint: "PNG 图片 · 附网站二维码", saving: "生成中……",
    scan: "一百多万个点子，扫码抽一个。",
  },
} satisfies Record<Lang, Record<string, string>>;

type WordKey = keyof (typeof WORDS)["en"];

const pickerTitle = (reel: string, lang: Lang) =>
  lang === "zh" ? `选择${reel}` : `Choose a ${reel.toLowerCase()}`;

const PICK_LOCK_KEY = "im.pickLock";
/** Recent ideas shown before "Show all". */
const RECENT_COLLAPSED = 3;

export interface InstrumentOptions {
  mode: Mode;
  lang: Lang;
  /** The language key was pressed; the page owns the language and calls setLang. */
  onToggleLang: () => void;
}

export interface InstrumentHandle {
  setLang(lang: Lang): void;
  destroy(): void;
}

export function mountInstrument(root: HTMLElement, opts: InstrumentOptions): InstrumentHandle {
  root.innerHTML = DEVICE_HTML;

  const m = new Machine(opts.mode, opts.lang);
  const reduced = reducedMotion();
  const listeners = new AbortController();
  const { signal } = listeners;
  let dead = false;

  /** setTimeout that never fires after destroy(). */
  const later = (fn: () => void, ms: number) =>
    setTimeout(() => { if (!dead) fn(); }, ms);
  const el = <T extends HTMLElement = HTMLElement>(name: string) =>
    root.querySelector<T>(`[data-el="${name}"]`)!;
  const w = () => WORDS[m.lang];
  const wrap = (ri: number, i: number) => ((i % m.sizes[ri]) + m.sizes[ri]) % m.sizes[ri];
  const glyphOf = (idx: Idx) => makeGlyph(m.serial(idx), { accent: true });

  const rows = [...root.querySelectorAll<HTMLElement>(".ch")];
  const picker = el<HTMLDialogElement>("picker");
  const saver = createSaver(el<HTMLDialogElement>("saver"), signal, () =>
    trackShareClick(m.mode.id, "instrument"));
  const canvas = el<HTMLCanvasElement>("glyph");

  function renderWords() {
    root.querySelectorAll<HTMLElement>("[data-t]").forEach((n) => {
      const key = n.dataset.t!;
      const reel = /^reel(\d)$/.exec(key);
      n.textContent = reel ? m.label(+reel[1]) : w()[key as WordKey];
    });
    root.querySelectorAll<HTMLElement>("[data-t-label]").forEach((n) => {
      n.setAttribute("aria-label", w()[n.dataset.tLabel as WordKey]);
    });
    el<HTMLInputElement>("pkSearch").placeholder = w().search;
    setRollLabel();
  }

  /* =========================================================
     Reels — a strip of items behind a window. The window shows
     the chosen item plus half of its real neighbours.
     ========================================================= */

  interface ReelView { ri: number; win: HTMLElement; strip: HTMLElement; i: number }
  const reels: ReelView[] = rows.map((row, ri) => {
    const win = row.querySelector<HTMLElement>(".reel")!;
    return { ri, win, strip: win.querySelector<HTMLElement>(".strip")!, i: -1 };
  });
  const itemsHtml = (texts: string[]) => texts.map((t) => `<div class="item">${esc(t)}</div>`).join("");
  const T = (ri: number, j: number) => m.text(ri, wrap(ri, j));
  const rowH = (r: ReelView) => (r.strip.firstElementChild as HTMLElement).getBoundingClientRect().height;

  function stop(r: ReelView) {
    r.strip.getAnimations().forEach((a) => a.cancel());
  }

  function setStatic(r: ReelView, i: number) {
    stop(r);
    r.strip.innerHTML = itemsHtml([T(r.ri, i - 1), T(r.ri, i), T(r.ri, i + 1)]);
    r.i = i;
    r.win.setAttribute("aria-label", `${m.label(r.ri)}: ${m.text(r.ri, i)}`);
  }

  /** Spin down through random items and land on target, with a small mechanical overshoot. */
  function spin(r: ReelView, target: number, { n, dur }: { n: number; dur: number }): Promise<boolean> {
    const ri = r.ri;
    const cur = r.i < 0 ? m.randomIndex(ri) : r.i;
    const fillers = Array.from({ length: n }, () => m.randomText(ri));
    const list = [T(ri, target - 1), T(ri, target), T(ri, target + 1), ...fillers, T(ri, cur - 1), T(ri, cur), T(ri, cur + 1)];
    stop(r);
    r.strip.innerHTML = itemsHtml(list);
    const h = rowH(r);
    const y = (j: number) => (0.5 - j) * h;
    const from = y(list.length - 2);
    const to = y(1);
    const over = Math.min(9, h * 0.18);
    const a = r.strip.animate([
      { transform: `translateY(${from}px)`, easing: "cubic-bezier(.2,.62,.3,1)" },
      { transform: `translateY(${to + over}px)`, offset: 0.88, easing: "cubic-bezier(.35,0,.25,1)" },
      { transform: `translateY(${to}px)` },
    ], { duration: dur, fill: "forwards" });
    r.strip.animate([
      { filter: "blur(0px)" }, { filter: "blur(1.4px)", offset: 0.1 }, { filter: "blur(1px)", offset: 0.5 },
      { filter: "blur(0px)", offset: 0.8 }, { filter: "blur(0px)" },
    ], { duration: dur });
    later(() => { if (r.strip.getAnimations().includes(a)) sound.flap(0.45); }, dur * 0.86);
    if (sound.on) ratchet(r, a, h);
    return a.finished.then(() => { setStatic(r, target); return true; }, () => false);
  }

  /** Sound only: a soft click each time an option passes the orange line, so it slows down audibly. */
  function ratchet(r: ReelView, anim: Animation, h: number) {
    let lastRow: number | null = null;
    let lastClick = 0;
    (function loop(now: number) {
      if (dead || !r.strip.getAnimations().includes(anim)) return;
      const y = new DOMMatrixReadOnly(getComputedStyle(r.strip).transform).m42;
      const row = Math.round(y / h);
      if (lastRow !== null && row !== lastRow && now - lastClick > 24) {
        sound.flap(0.07 + Math.random() * 0.03);
        lastClick = now;
      }
      lastRow = row;
      requestAnimationFrame(loop);
    })(performance.now());
  }

  /** Move one item up or down (wheel, drag, arrow keys). */
  function step(r: ReelView, from: number, dir: 1 | -1) {
    const ri = r.ri;
    stop(r);
    const list = dir > 0
      ? [T(ri, from - 1), T(ri, from), T(ri, from + 1), T(ri, from + 2)]
      : [T(ri, from - 2), T(ri, from - 1), T(ri, from), T(ri, from + 1)];
    r.strip.innerHTML = itemsHtml(list);
    const h = rowH(r);
    const y = (j: number) => (0.5 - j) * h;
    const [a, b] = dir > 0 ? [1, 2] : [2, 1];
    sound.tick(1100 + Math.random() * 200, 0.03, 0.02);
    r.strip.animate(
      [{ transform: `translateY(${y(a)}px)` }, { transform: `translateY(${y(b)}px)` }],
      { duration: reduced ? 1 : 160, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
    ).finished.then(() => setStatic(r, wrap(ri, from + dir)), () => {});
  }

  /* =========================================================
     Choreography
     ========================================================= */

  let busy = false;
  let run = 0;
  let shownGlyph: Glyph = blankGlyph();
  const glyphSize = () => canvas.getBoundingClientRect().width || 140;
  const paintGlyph = (g: Glyph) => drawGlyph(canvas, g, glyphSize(), DIAL_THEME);

  function animateTo(prev: Idx, next: Idx, source: ChangeSource) {
    if (source === "nudge") return nudged(prev, next);
    const myRun = ++run;
    busy = true;
    setRollLabel();

    let order = 0;
    const jobs: Promise<unknown>[] = [];
    reels.forEach((r, ri) => {
      const changed = r.i !== next[ri] || source === "lang" || source === "boot";
      if (!changed) {
        if (r.strip.getAnimations().length) setStatic(r, next[ri]);
        return;
      }
      if (reduced) {
        setStatic(r, next[ri]);
        r.win.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220 });
        return;
      }
      const k = order++;
      const timing = source === "lang" ? { n: 2, dur: 420 }
        : source === "pick" ? { n: 8, dur: 700 }
        : { n: 12 + k * 6, dur: 720 + k * 200 }; // all start together, stop left → right
      jobs.push(spin(r, next[ri], timing));
    });

    const target = glyphOf(next);
    if (source !== "lang") {
      jobs.push(animateGlyph(canvas, shownGlyph, target, {
        dur: source === "pick" ? 700 : 1050, size: glyphSize(), theme: DIAL_THEME, reduced,
        alive: () => !dead && myRun === run,
      }).then(() => { if (myRun === run) shownGlyph = target; }));
    }
    Promise.all(jobs).then(() => { if (!dead && myRun === run) settle(); });
    // Safety net: if the animation timeline stalls (e.g. a background tab), land on the result anyway.
    later(() => { if (myRun === run && busy) snap(); }, 2600);
  }

  function nudged(prev: Idx, next: Idx) {
    const ri = next.findIndex((v, k) => v !== prev[k]);
    if (ri < 0) return;
    if (busy) snap();
    const dir = wrap(ri, next[ri] - prev[ri]) === 1 ? 1 : -1;
    step(reels[ri], prev[ri], dir);
    shownGlyph = glyphOf(next);
    paintGlyph(shownGlyph);
    el("sr").textContent = m.sentence();
  }

  function settle() {
    reels.forEach((r, ri) => setStatic(r, m.idx[ri]));
    shownGlyph = glyphOf(m.idx);
    paintGlyph(shownGlyph);
    busy = false;
    setRollLabel();
    el("sr").textContent = m.sentence();
  }

  /** Second press mid-roll: snap straight to the result. */
  function snap() {
    run++;
    settle();
  }

  function doRoll() {
    if (busy) return snap();
    if (m.locks.every(Boolean)) return toast(w().allLocked);
    press(el("roll"));
    trackSpin(m.reels.filter((_, ri) => m.locks[ri]).map((r) => r.def.key), m.mode.id, "instrument");
    m.roll();
  }

  /* nudging: wheel, mouse drag, arrow keys — history is written once you stop */
  let rememberTimer: ReturnType<typeof setTimeout> | undefined;
  function nudge(ri: number, dir: 1 | -1) {
    m.setOne(ri, wrap(ri, m.idx[ri] + dir), "nudge", { remember: false });
    clearTimeout(rememberTimer);
    rememberTimer = later(() => m.remember(), 700);
  }

  reels.forEach((r) => {
    let acc = 0;
    let lastStep = 0;
    r.win.addEventListener("wheel", (e) => {
      e.preventDefault();
      acc += e.deltaY;
      const now = performance.now();
      if (Math.abs(acc) >= 30 && now - lastStep > 70) {
        nudge(r.ri, acc > 0 ? 1 : -1);
        acc = 0;
        lastStep = now;
      }
    }, { passive: false, signal });

    let drag: { y: number; moved: boolean; mouse: boolean } | null = null;
    const endDrag = () => { drag = null; r.win.classList.remove("dragging"); };
    r.win.addEventListener("pointerdown", (e) => {
      drag = { y: e.clientY, moved: false, mouse: e.pointerType === "mouse" };
      if (drag.mouse) r.win.setPointerCapture(e.pointerId);
    }, { signal });
    r.win.addEventListener("pointermove", (e) => {
      if (!drag || !drag.mouse) return;
      const dy = drag.y - e.clientY;
      if (Math.abs(dy) >= rowH(r) * 0.6) {
        drag.moved = true;
        r.win.classList.add("dragging");
        nudge(r.ri, dy > 0 ? 1 : -1);
        drag.y = e.clientY;
      }
    }, { signal });
    r.win.addEventListener("pointerup", () => {
      if (!drag) return;
      const tap = !drag.moved;
      endDrag();
      if (tap) openPicker(r.ri);
    }, { signal });
    r.win.addEventListener("pointercancel", endDrag, { signal });
    r.win.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        nudge(r.ri, e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter") {
        e.preventDefault(); e.stopPropagation();
        openPicker(r.ri);
      }
    }, { signal });
  });

  /* =========================================================
     Picker — browse every option of one reel
     ========================================================= */

  const pk = { ri: 0, cat: -1, act: 0, ids: [] as number[] };
  const pkSearch = el<HTMLInputElement>("pkSearch");
  const pkList = el("pkList");
  const pkCats = el("pkCats");
  const pkLock = el<HTMLInputElement>("pkLock");
  pkLock.checked = store.get<boolean>(PICK_LOCK_KEY, true) !== false;
  const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;

  function openPicker(ri: number) {
    if (picker.open) return;
    if (busy) snap();
    pk.ri = ri;
    pk.cat = -1;
    pkSearch.value = "";
    el("pkTitle").textContent = pickerTitle(m.label(ri), m.lang);
    renderCats();
    renderList(true);
    picker.showModal();
    if (finePointer) pkSearch.focus();
    else pkList.focus({ preventScroll: true });
    scrollAct("center");
  }

  function filtered(): number[] {
    const r = m.reels[pk.ri];
    const q = pkSearch.value.trim();
    let ids = q ? m.search(pk.ri, q) : r.items.map((_, i) => i);
    if (pk.cat >= 0) ids = ids.filter((i) => r.items[i].ci === pk.cat);
    return ids;
  }

  function renderCats() {
    const r = m.reels[pk.ri];
    pkCats.innerHTML =
      `<button type="button" data-c="-1" class="${pk.cat < 0 ? "on" : ""}">${w().all}</button>` +
      r.categories.map((_, ci) =>
        `<button type="button" data-c="${ci}" class="${pk.cat === ci ? "on" : ""}">${esc(m.categoryName(pk.ri, ci))}</button>`,
      ).join("");
  }

  function renderList(toCurrent: boolean) {
    const r = m.reels[pk.ri];
    const ids = filtered();
    const cur = m.idx[pk.ri];
    const grouped = !pkSearch.value.trim() && pk.cat < 0;
    pk.ids = ids;
    pk.act = toCurrent ? Math.max(0, ids.indexOf(cur)) : Math.min(pk.act, Math.max(0, ids.length - 1));
    let html = "";
    let lastCat = -1;
    ids.forEach((i, n) => {
      const it = r.items[i];
      if (grouped && it.ci !== lastCat) {
        lastCat = it.ci;
        html += `<div class="pk-grp">${esc(m.categoryName(pk.ri, it.ci))}</div>`;
      }
      html += `<button type="button" role="option" class="opt${i === cur ? " cur" : ""}${n === pk.act ? " act" : ""}" data-n="${n}" aria-selected="${n === pk.act}">` +
        `<span>${esc(m.text(pk.ri, i))}</span></button>`;
    });
    if (!ids.length) html = `<p class="pk-empty">${w().none} “${esc(pkSearch.value)}”</p>`;
    pkList.innerHTML = html;
  }

  function scrollAct(block: ScrollLogicalPosition = "nearest") {
    pkList.querySelector(`.opt[data-n="${pk.act}"]`)?.scrollIntoView({ block });
  }

  function moveAct(d: number) {
    if (!pk.ids.length) return;
    pkList.querySelector(".opt.act")?.classList.remove("act");
    pk.act = (pk.act + d + pk.ids.length) % pk.ids.length;
    pkList.querySelector(`.opt[data-n="${pk.act}"]`)?.classList.add("act");
    scrollAct();
  }

  function choose(i: number | undefined) {
    if (i == null) return;
    const ri = pk.ri;
    picker.close();
    const lockIt = pkLock.checked;
    if (lockIt && !m.locks[ri]) lock(ri, true);
    if (i !== m.idx[ri]) m.setOne(ri, i, "pick");
    if (lockIt) toast(`<b>${esc(m.label(ri))}</b> · ${w().locked}`);
  }

  pkSearch.addEventListener("input", () => { pk.act = 0; renderList(false); pkList.scrollTop = 0; }, { signal });
  pkCats.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button[data-c]");
    if (!b) return;
    pk.cat = +b.dataset.c!;
    pk.act = 0;
    renderCats();
    renderList(false);
    pkList.scrollTop = 0;
    pkCats.querySelector(`[data-c="${pk.cat}"]`)?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, { signal });
  pkList.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".opt");
    if (b) choose(pk.ids[+b.dataset.n!]);
  }, { signal });
  el("pkRand").addEventListener("click", () => {
    const ids = filtered();
    if (ids.length) choose(ids[Math.floor(Math.random() * ids.length)]);
  }, { signal });
  el("pkClose").addEventListener("click", () => picker.close(), { signal });
  pkLock.addEventListener("change", () => store.set(PICK_LOCK_KEY, pkLock.checked), { signal });
  picker.addEventListener("click", (e) => { if (e.target === picker) picker.close(); }, { signal }); // backdrop
  picker.addEventListener("close", () => reels[pk.ri].win.focus({ preventScroll: true }), { signal });
  picker.addEventListener("keydown", (e) => {
    const focused = document.activeElement;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      moveAct(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && (focused === pkSearch || focused === pkList)) {
      e.preventDefault();
      choose(pk.ids[pk.act]);
    } else if (e.key.length === 1 && e.key !== " " && !e.metaKey && !e.ctrlKey && !e.altKey && focused !== pkSearch) {
      pkSearch.focus(); // typing anywhere searches
    }
  }, { signal });

  /* =========================================================
     The rest of the panel
     ========================================================= */

  function setRollLabel() {
    el("rollLabel").textContent = busy ? w().skip : w().roll;
  }

  function renderLocks() {
    rows.forEach((row, ri) => {
      row.classList.toggle("locked", m.locks[ri]);
      row.querySelector("[data-lock]")!.setAttribute("aria-pressed", String(m.locks[ri]));
    });
  }

  let recentExpanded = false;
  function renderRecent() {
    const cur = m.code();
    const list = el("recent");
    const shown = recentExpanded ? m.history : m.history.slice(0, RECENT_COLLAPSED);
    list.innerHTML = shown.map((c) => {
      const t = m.texts(m.parse(c)!).map(esc).join("<i>×</i>");
      return `<li><button type="button" data-code="${c}" class="${c === cur ? "cur" : ""}"><canvas aria-hidden="true"></canvas><span class="mt">${t}</span></button></li>`;
    }).join("");
    list.querySelectorAll<HTMLButtonElement>("button").forEach((b) =>
      drawGlyph(b.querySelector("canvas")!, glyphOf(m.parse(b.dataset.code!)!), 26, DIAL_THEME));

    const more = el("recentMore");
    more.hidden = m.history.length <= RECENT_COLLAPSED;
    more.textContent = recentExpanded ? w().showLess : `${w().showAll} (${m.history.length})`;
    more.setAttribute("aria-expanded", String(recentExpanded));
  }

  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  function toast(html: string) {
    const t = el("toast");
    t.innerHTML = html;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = later(() => t.classList.remove("show"), 1800);
  }

  function press(btn: HTMLElement) {
    btn.classList.add("pressed");
    later(() => btn.classList.remove("pressed"), 110);
  }

  function lock(ri: number, value?: boolean) {
    const on = m.toggleLock(ri, value);
    if (on) trackReelLock(m.reels[ri].def.key, m.mode.id, "instrument");
    sound.tick(on ? 1400 : 900, 0.05);
  }

  const actions: Record<string, (arg?: number) => void> = {
    roll: doRoll,
    lock: (ri) => lock(ri!),
    copy() {
      press(el("copy"));
      trackCopyPrompt(m.mode.id);
      copyText(m.prompt()).then((ok) => ok && toast(w().copied));
    },
    save() {
      if (busy) snap();
      press(el("save"));
      saver.open({
        brand: w().machine,
        modeId: m.mode.id,
        mode: m.mode.name[m.lang],
        labels: m.reels.map((_, ri) => m.label(ri)),
        texts: m.texts(),
        brief: m.sentence(),
        scan: w().scan,
        serial: m.serial(),
      }, { save: w().save, saving: w().saving });
    },
    lang() {
      press(el("lang"));
      opts.onToggleLang();
    },
    sound() {
      press(el("sound"));
      const on = sound.toggle();
      el("sound").setAttribute("aria-pressed", String(on));
      if (on) sound.flap(0.4);
      toast(on ? w().soundOn : w().soundOff);
    },
  };

  /* =========================================================
     Wiring
     ========================================================= */

  m.on("change", ({ prev, next, source }) => { animateTo(prev, next, source); renderRecent(); });
  m.on("history", renderRecent);
  m.on("lock", renderLocks);
  m.on("lang", () => {
    renderWords();
    animateTo(m.idx, m.idx, "lang");
    renderRecent();
    if (picker.open) {
      el("pkTitle").textContent = pickerTitle(m.label(pk.ri), m.lang);
      renderCats();
      renderList(false);
    }
  });

  for (const name of ["roll", "copy", "save", "lang", "sound"]) {
    el(name).addEventListener("click", () => actions[name](), { signal });
  }
  rows.forEach((row, ri) => {
    row.querySelector("[data-lock]")!.addEventListener("click", () => lock(ri), { signal });
    row.querySelector("[data-browse]")!.addEventListener("click", () => openPicker(ri), { signal });
  });
  el("recentMore").addEventListener("click", () => {
    recentExpanded = !recentExpanded;
    renderRecent();
  }, { signal });
  el("recent").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button[data-code]");
    const idx = b && m.parse(b.dataset.code!);
    if (idx && b.dataset.code !== m.code()) m.set(idx, "memory");
  }, { signal });

  bindKeys(actions, () => !picker.open && !saver.isOpen, signal);

  window.addEventListener("hashchange", () => {
    const idx = m.parse(location.hash);
    if (idx && m.code(idx) !== m.code()) m.set(idx, "link");
  }, { signal });

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = later(() => { if (!busy) paintGlyph(shownGlyph); }, 120);
  }, { signal });

  /* ---------- power on ---------- */

  el("sound").setAttribute("aria-pressed", String(sound.on));
  renderWords();
  renderLocks();
  renderRecent();
  reels.forEach((r) => setStatic(r, m.randomIndex(r.ri)));
  paintGlyph(shownGlyph);
  (async () => {
    // Reel rows are measured in px, so wait (briefly) for the real font.
    await Promise.race([document.fonts?.ready, wait(800)]);
    requestAnimationFrame(() => { if (!dead) animateTo(m.idx, m.idx, "boot"); });
  })();

  return {
    setLang: (lang) => m.setLang(lang),
    destroy() {
      dead = true;
      run++;
      listeners.abort();
      root.querySelectorAll("dialog").forEach((d) => d.open && d.close());
      reels.forEach(stop);
      root.innerHTML = "";
    },
  };
}

/**
 * Keyboard shortcuts: Space/Enter roll · 1 2 3 lock a reel · C copy prompt ·
 * S save image · L language · M sound. Ignored while typing or with a modifier.
 */
function bindKeys(
  actions: Record<string, (arg?: number) => void>,
  enabled: () => boolean,
  signal: AbortSignal,
) {
  const editable = (t: EventTarget | null) =>
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
  const LETTERS: Record<string, string> = { c: "copy", s: "save", l: "lang", m: "sound" };

  document.addEventListener("keydown", (e) => {
    if (!enabled() || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat || editable(e.target)) return;
    const target = e.target as HTMLElement;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let name: string | undefined;
    let arg: number | undefined;
    if (k === " ") name = "roll";
    else if (k === "Enter" && !/^(BUTTON|A)$/.test(target.tagName)) name = "roll";
    else if (k === "1" || k === "2" || k === "3") { name = "lock"; arg = +k - 1; }
    else name = LETTERS[k];
    if (name && actions[name]) {
      e.preventDefault();
      actions[name](arg);
    }
  }, { signal });
  // Stop Space from also "clicking" whichever button has focus.
  document.addEventListener("keyup", (e) => {
    if (enabled() && e.key === " " && (e.target as HTMLElement).tagName === "BUTTON") e.preventDefault();
  }, { signal });
}
