import productFormsData from "@/data/maps/map-of-product-forms.json";
import humanLifeData from "@/data/maps/map-of-human-life.json";
import twistsData from "@/data/maps/map-of-twists.json";
import type { Lang } from "./LanguageContext";

export interface LocalizedGroup {
  title: string;
  items: string[];
}

interface RawCategory {
  category: string;
  category_zh: string;
  subItems: string[];
  subItems_zh: string[];
}

function localizeCategories(
  categories: RawCategory[],
  lang: Lang,
): LocalizedGroup[] {
  return categories.map((c) => ({
    title: lang === "zh" ? c.category_zh : c.category,
    items: lang === "zh" ? c.subItems_zh : c.subItems,
  }));
}

export function getFormatGroups(lang: Lang): LocalizedGroup[] {
  return localizeCategories(productFormsData.categories, lang);
}

export function getSpaceGroups(lang: Lang): LocalizedGroup[] {
  return localizeCategories(humanLifeData.categories, lang);
}

export function getTwistGroups(lang: Lang): LocalizedGroup[] {
  return localizeCategories(twistsData.categories, lang);
}

export interface LocalizedMeta {
  title: string;
  subtitle: string;
  note: string;
}

export function getFormatMeta(lang: Lang): LocalizedMeta {
  const m = productFormsData.meta;
  return lang === "zh"
    ? { title: m.title_zh, subtitle: m.subtitle_zh, note: m.note_zh }
    : { title: m.title, subtitle: m.subtitle, note: m.note };
}

export function getSpaceMeta(lang: Lang): LocalizedMeta {
  const m = humanLifeData.meta;
  return lang === "zh"
    ? { title: m.title_zh, subtitle: m.subtitle_zh, note: m.note_zh }
    : { title: m.title, subtitle: m.subtitle, note: m.note };
}

export function getTwistMeta(lang: Lang): LocalizedMeta {
  const m = twistsData.meta;
  return lang === "zh"
    ? { title: m.title_zh, subtitle: m.subtitle_zh, note: m.note_zh }
    : { title: m.title, subtitle: m.subtitle, note: m.note };
}

// Builds a lookup from an item's text in one language to its counterpart in
// the other, so a slot's already-picked value can be translated in place
// when the user switches languages instead of being reset to blank.
function buildTranslationMap(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (a: string, b: string) => {
    map.set(a, b);
    map.set(b, a);
  };
  for (const data of [humanLifeData, productFormsData, twistsData]) {
    for (const c of data.categories) {
      add(c.category, c.category_zh);
      c.subItems.forEach((item, i) => add(item, c.subItems_zh[i]));
    }
  }
  return map;
}

let translationMap: Map<string, string> | null = null;

export function translateItem(value: string): string | undefined {
  if (!translationMap) translationMap = buildTranslationMap();
  return translationMap.get(value);
}
