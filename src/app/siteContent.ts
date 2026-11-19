// Resolves src/data/site-content.json (the model plate and description on each
// machine, the About page, the Map pages) for React. scripts/generate-route-shells.mjs
// reads the same JSON and writes the same text into each page's static HTML, so
// keep wording changes in the JSON, not here.

import content from "@/data/site-content.json";
import type { Lang } from "@/app/i18n/LanguageContext";
import { MODES, type MapFile, type ModeId } from "@/app/instrument/modes";

export const SITE_URL = content.siteUrl;
export const MAKER = content.maker;
export const REPO = content.repo;
export const UPDATED = content.updated;

/** Replace {key} tokens with values. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function countItems(map: MapFile): number {
  return map.categories.reduce((n, c) => n + c.subItems.length, 0);
}

/** An item's text in `lang`, given its English name. Falls back to English. */
function localizeItem(map: MapFile, en: string, lang: Lang): string {
  if (lang === "en") return en;
  for (const c of map.categories) {
    const i = c.subItems.indexOf(en);
    if (i !== -1) return c.subItems_zh[i] ?? en;
  }
  return en;
}

export function getLabels(lang: Lang) {
  return content.labels[lang];
}

/** "/" → "/", "hackathon" → "/hackathon/". */
const href = (path: string) => (path ? `/${path}/` : "/");

export interface ReelInfo {
  /** Anchor id on the Map page, e.g. "space". */
  key: string;
  label: string;
  map: MapFile;
  count: number;
}

export interface ModeContent {
  id: ModeId;
  name: string;
  /** Model plate text; the page's <h1>. */
  h1: string;
  model: string;
  /** The short description under the machine. */
  description: string[];
  /** The search-friendly definition (About page, llms.txt, JSON-LD). */
  intro: string;
  path: string;
  mapPath: string;
  mapTitle: string;
  mapDescription: string;
  mapH1: string;
  mapIntro: string;
  reels: ReelInfo[];
  examples: { roll: string[]; pitch: string }[];
}

export function getModeContent(modeId: ModeId, lang: Lang): ModeContent {
  const c = content.modes[modeId];
  const t = c[lang];
  const reels: ReelInfo[] = MODES[modeId].reels.map((r, i) => ({
    key: c.reels[i].key,
    label: r.label[lang],
    map: r.map,
    count: countItems(r.map),
  }));
  const counts = Object.fromEntries(reels.map((r, i) => [`n${i}`, r.count]));
  return {
    id: modeId,
    name: t.name,
    h1: t.h1,
    model: c.model,
    description: t.description,
    intro: fill(t.intro, counts),
    path: href(c.path),
    mapPath: href(c.mapPath),
    mapTitle: `${fill(t.mapTitle, counts)} | The Idea Machine`,
    mapDescription: fill(t.mapDescription, counts),
    mapH1: t.mapH1,
    mapIntro: fill(t.mapIntro, counts),
    reels,
    examples: t.examples.map((ex) => ({
      roll: ex.roll.map((item, i) => localizeItem(reels[i].map, item, lang)),
      pitch: ex.pitch,
    })),
  };
}

export const MODE_IDS: readonly ModeId[] = ["product", "hackathon"];

export function getAbout(lang: Lang) {
  return content.about[lang];
}

export function getExamplesPage(lang: Lang) {
  return content.examplesPage[lang];
}

/** "November 2026" / "2026年11月" for the Updated line. */
export function formatUpdated(lang: Lang): string {
  const [y, m] = UPDATED.split("-").map(Number);
  return lang === "zh"
    ? `${y}年${m}月`
    : new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
