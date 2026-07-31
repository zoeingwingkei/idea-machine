import type { Lang } from "./LanguageContext";

export interface Strings {
  documentTitle: string;
  documentDescription: string;
  aboutP1Pre: string;
  aboutHumanNeed: string;
  aboutP1Mid1: string;
  aboutProductForm: string;
  aboutP1Mid2: string;
  aboutTwist: string;
  aboutP1End: string;
  aboutP2: string;
  aboutP3: string;
  github: string;
  contributeText: string;
  contributeLinkLabel: string;
  pullLever: string;
  start: string;
  yourIdea: string;
  backToMachine: string;
  format: string;
  space: string;
  twist: string;
  lock: (label: string) => string;
  unlock: (label: string) => string;
  backToCategories: string;
  chooseLabel: (label: string) => string;
  viewFullMap: (label: string) => string;
  share: string;
  shareTitle: string;
  scanForOne: string;
  downloadImage: string;
  generatingImage: string;
  sayHi: string;
  shareDescription: string;
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    documentTitle:
      "The Idea Machine — Random Project & App Idea Generator",
    documentDescription:
      "Stuck on what to build next? Pull the lever to generate a random project or app idea — a surprise mashup of a life space, a product format, and a twist. Over 1,000,000 combinations.",
    aboutP1Pre:
      "The Idea Machine is a playful generator that combines three things: a ",
    aboutHumanNeed: "space in human life",
    aboutP1Mid1: ", a ",
    aboutProductForm: "product form",
    aboutP1Mid2: ", and an ",
    aboutTwist: "unexpected twist",
    aboutP1End: ".",
    aboutP2:
      "Pull the lever to discover one of more than 1,000,000 possible ideas.",
    aboutP3:
      "Built on a simple belief: good ideas often begin with an unlikely combination — and a little serendipity.",
    github: "GitHub",
    contributeText: "Know a space, format, or twist we're missing?",
    contributeLinkLabel: "Help expand this list on GitHub",
    pullLever: "PULL THE LEVER →",
    start: "Start",
    yourIdea: "YOUR IDEA",
    backToMachine: "← Back to the machine",
    format: "FORM",
    space: "SPACE",
    twist: "TWIST",
    lock: (label) => `Lock ${label}`,
    unlock: (label) => `Unlock ${label}`,
    backToCategories: "Back to categories",
    chooseLabel: (label) => `Choose ${label}`,
    viewFullMap: (label) => `View the full ${label} map`,
    share: "Share",
    shareTitle: "Share your idea",
    scanForOne: "1,000,000+ ideas. Scan for one.",
    downloadImage: "Download image",
    generatingImage: "Generating…",
    sayHi: "Say hi",
    shareDescription: "Preview and download an image of your idea to share.",
  },
  zh: {
    documentTitle: "The Idea Machine 点子机 — 随机项目与产品点子生成",
    documentDescription:
      "不知道该做什么项目？拉下拉杆，随机生成一个由生活场景、产品形态和意外转折组合而成的点子，超过一百万种可能。",
    aboutP1Pre: "The Idea Machine（点子机）把三样东西摇在一起：一个",
    aboutHumanNeed: "生活场景",
    aboutP1Mid1: "、一种",
    aboutProductForm: "产品形态",
    aboutP1Mid2: "、一个",
    aboutTwist: "意外转折",
    aboutP1End: "。",
    aboutP2: "拉下拉杆，一百多万种可能里，蹦出一个只属于你的点子。",
    aboutP3: "好点子很少是想出来的，多半是撞出来的。",
    github: "GitHub",
    contributeText: "还有什么场景、形态或转折没收录进来？",
    contributeLinkLabel: "去 GitHub 一起扩充这份清单",
    pullLever: "拉下拉杆 →",
    start: "开始",
    yourIdea: "你的点子",
    backToMachine: "← 返回点子机",
    format: "形态",
    space: "场景",
    twist: "转折",
    lock: (label) => `锁定${label}`,
    unlock: (label) => `解锁${label}`,
    backToCategories: "返回分类",
    chooseLabel: (label) => `选择${label}`,
    viewFullMap: (label) => `查看完整的${label}地图`,
    share: "分享",
    shareTitle: "分享你的点子",
    scanForOne: "一百多万个点子，扫码抽一个。",
    downloadImage: "下载图片",
    generatingImage: "生成中……",
    sayHi: "打个招呼",
    shareDescription: "预览并下载你的点子图片，方便分享。",
  },
};

export function getStrings(lang: Lang): Strings {
  return STRINGS[lang];
}
