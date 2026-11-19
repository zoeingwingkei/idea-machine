// The two "cartridges" the machine can load. Everything that differs between
// Product mode and Hackathon mode lives here: which maps feed the reels, what
// the reels are called, and how an idea is phrased as a sentence or prompt.
// The machine, controller and page stay mode-agnostic.
//
// Every map file shares one schema (see MapFile), so adding a mode is just
// three JSON files plus one entry below.

import humanLife from "@/data/maps/map-of-human-life.json";
import productForms from "@/data/maps/map-of-product-forms.json";
import twists from "@/data/maps/map-of-twists.json";
import hackathonTopics from "@/data/maps/map-of-hackathon-topics.json";
import hackathonTech from "@/data/maps/map-of-hackathon-tech.json";
import hackathonTwists from "@/data/maps/map-of-hackathon-twists.json";
import type { Lang } from "@/app/i18n/LanguageContext";

export type { Lang };
export type ModeId = "product" | "hackathon";
type Localized = Record<Lang, string>;

/** The shape shared by every src/data/maps/*.json file. */
export interface MapFile {
  meta: {
    title: string;
    title_zh: string;
    subtitle: string;
    subtitle_zh: string;
  };
  categories: {
    category: string;
    category_zh: string;
    subItems: string[];
    subItems_zh: string[];
  }[];
}

export interface ReelDef {
  /** Stable id, also used as the analytics reel name. */
  key: string;
  label: Localized;
  map: MapFile;
}

/** The three reel texts of one idea, in reel order. */
export type Texts = readonly [string, string, string];

export interface Mode {
  id: ModeId;
  /** Route this mode lives at. */
  path: string;
  name: Localized;
  documentTitle: Localized;
  documentDescription: Localized;
  reels: readonly [ReelDef, ReelDef, ReelDef];
  /** One-line brief of an idea (screen readers, saved image). */
  sentence(texts: Texts, lang: Lang): string;
  /**
   * "Copy prompt" text to paste into an AI assistant, to brainstorm the idea
   * together. locks = which reels the user locked (locked words are passed
   * on as required).
   */
  prompt(texts: Texts, lang: Lang, locks: Locks): string;
}

/** Which reels are locked, in reel order. */
export type Locks = readonly [boolean, boolean, boolean];

/**
 * The prompt sentence that says what's required and what can bend:
 * locked words are required, the rest are loose inspiration.
 */
function rules(texts: Texts, locks: Locks, lang: Lang): string {
  const required = texts.filter((_, ri) => locks[ri]);
  if (lang === "zh") {
    const [a, b] = required.map((t) => `「${t}」`);
    switch (required.length) {
      case 0: return "把它们当作宽松的灵感，需要的话可以随意变通。";
      case 1: return `${a}必须保留。其余的当作宽松的灵感，需要的话可以随意变通。`;
      case 2: return `${a}和${b}必须保留。另一个当作宽松的灵感，需要的话可以变通。`;
      default: return "这三个都必须保留。";
    }
  }
  const [a, b] = required.map((t) => `"${t}"`);
  switch (required.length) {
    case 0: return "Treat them as loose inspiration, and bend any of them if that helps.";
    case 1: return `${a} is required. Treat the others as loose inspiration, and bend them if that helps.`;
    case 2: return `${a} and ${b} are required. Treat the other as loose inspiration, and bend it if that helps.`;
    default: return "All three are required.";
  }
}

/** "A" or "An" for an English noun phrase (handles "AI Agent", "User…", "Hour…"). */
function articleFor(word: string): "A" | "An" {
  const first = word.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (/^(uni|use|user|one|eu)/.test(first)) return "A";
  if (/^(hour|honest|honor|heir)/.test(first)) return "An";
  return /^[aeiou]/.test(first) ? "An" : "A";
}

/**
 * End a sentence with `mark` unless it already ends in punctuation, so an
 * item like "Only Works at 2 A.M." doesn't come out as "2 A.M..".
 */
function stop(text: string, mark: "." | "。"): string {
  return /[.!?。！？]$/.test(text) ? text : text + mark;
}

const PRODUCT: Mode = {
  id: "product",
  path: "/",
  name: { en: "Product", zh: "产品" },

  documentTitle: {
    en: "The Idea Machine — Random Project & App Idea Generator",
    zh: "The Idea Machine 点子机 — 随机项目与产品点子生成",
  },
  documentDescription: {
    en: "Stuck on what to build next? Roll the machine to generate a random project or app idea — a surprise mashup of a life space, a product form, and a twist. Over 1,000,000 combinations.",
    zh: "不知道该做什么项目？摇一摇，随机生成一个由生活场景、产品形态和意外转折组合而成的点子，超过一百万种可能。",
  },
  reels: [
    { key: "space", label: { en: "Space", zh: "场景" }, map: humanLife },
    { key: "form", label: { en: "Form", zh: "形态" }, map: productForms },
    { key: "twist", label: { en: "Twist", zh: "转折" }, map: twists },
  ],
  sentence: ([space, form, twist], lang) =>
    lang === "zh"
      ? stop(`为${space}打造的${form}——转折：${twist}`, "。")
      : stop(`${articleFor(form)} ${form} for ${space}, with a twist: ${twist}`, "."),
  prompt: (texts, lang, locks) => {
    const [space, form, twist] = texts;
    const r = rules(texts, locks, lang);
    return (lang === "zh"
      ? [
          stop(`我在一台点子机上摇出了三个随机词：${space} × ${form} × ${twist}`, "。"),
          `${r}给我 3 个截然不同的产品点子，每个一句话。我选一个，然后我们一起把它完善。`,
        ]
      : [
          stop(`I rolled three random words on an idea machine: ${space} × ${form} × ${twist}`, "."),
          `${r} Pitch me 3 very different product ideas they could become, one line each. I'll pick one and we'll develop it together.`,
        ]
    ).join("\n");
  },
};

const HACKATHON: Mode = {
  id: "hackathon",
  // Trailing slash: GitHub Pages serves hackathon/index.html here, and
  // 301-redirects /hackathon to it.
  path: "/hackathon/",
  name: { en: "Hackathon", zh: "黑客松" },

  documentTitle: {
    en: "Hackathon Idea Generator — The Idea Machine",
    zh: "黑客松点子生成器 — The Idea Machine 点子机",
  },
  documentDescription: {
    en: "Need a hackathon project idea? Roll a topic, a piece of tech and a twist — over 1,000,000 weekend-sized combinations, plus a build prompt to scope it.",
    zh: "需要黑客松项目点子？摇出一个题材、一项技术和一个转折——一百多万种周末就能做完的组合，还附带规划用的提示词。",
  },
  reels: [
    { key: "topic", label: { en: "Topic", zh: "题材" }, map: hackathonTopics },
    { key: "tech", label: { en: "Tech", zh: "技术" }, map: hackathonTech },
    { key: "twist", label: { en: "Twist", zh: "转折" }, map: hackathonTwists },
  ],
  sentence: ([topic, tech, twist], lang) =>
    lang === "zh"
      ? stop(`用${tech}，为${topic}做点什么——转折：${twist}`, "。")
      : stop(`Build something for ${topic}, powered by ${tech}, with a twist: ${twist}`, "."),
  prompt: (texts, lang, locks) => {
    const [topic, tech, twist] = texts;
    const r = rules(texts, locks, lang);
    return (lang === "zh"
      ? [
          stop(`我在参加黑客松，在一台点子机上摇出了三个随机词：${topic} × ${tech} × ${twist}`, "。"),
          `${r}给我 3 个截然不同的项目，每个一句话，再加上能打动评委的那个演示瞬间。我选一个，然后我们一起把它规划成 24 小时能做完的版本。`,
        ]
      : [
          stop(`I'm at a hackathon and rolled three random words on an idea machine: ${topic} × ${tech} × ${twist}`, "."),
          `${r} Pitch me 3 very different projects, one line each, plus the demo moment that would win over judges. I'll pick one and we'll scope it for 24 hours together.`,
        ]
    ).join("\n");
  },
};

export const MODES: Record<ModeId, Mode> = {
  product: PRODUCT,
  hackathon: HACKATHON,
};

export const MODE_LIST: readonly Mode[] = [PRODUCT, HACKATHON];
