// Post-build step. GitHub Pages serves static files, and this app has only a
// handful of fixed routes, so rather than adopting a full SSG framework we
// clone dist/index.html once per route and, for each one:
//   - swap in that route's <title>, description, robots, canonical, OG/Twitter
//     tags and JSON-LD;
//   - write the page's text into <div id="root">, so crawlers and AI agents
//     that don't run JavaScript (GPTBot, ClaudeBot, PerplexityBot, link
//     previews) can read it. main.tsx uses createRoot (not hydrateRoot), so
//     React simply replaces this markup on mount. It mirrors what the React
//     pages render (SiteChrome.tsx, InstrumentPage.tsx, AboutPage.tsx,
//     MapPage.tsx) with the same classes and the same text, from
//     src/data/site-content.json and src/data/maps/*.json, so visitors and
//     crawlers see the same content.
// It also writes redirect pages for the v1 map URLs, sitemap.xml, llms.txt
// and llms-full.txt.
//
// URLs always end in "/": GitHub Pages serves hackathon/index.html at
// /hackathon/ and 301-redirects /hackathon to it.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");
const readJson = (p) => JSON.parse(readFileSync(join(root, p), "utf-8"));

const content = readJson("src/data/site-content.json");
const siteUrl = content.siteUrl;
const L = content.labels.en;

// ---------- data ----------

// Page titles/descriptions of the two machines. Mirrors MODES in
// src/app/instrument/modes.ts.
const MACHINE_META = {
  product: {
    title: "The Idea Machine — Random Project & App Idea Generator",
    description:
      "Stuck on what to build next? Roll the machine to generate a random project or app idea — a surprise mashup of a life space, a product form, and a twist. Over 1,000,000 combinations.",
    name: "Product",
    reelLabels: ["Space", "Form", "Twist"],
  },
  hackathon: {
    title: "Hackathon Idea Generator — The Idea Machine",
    description:
      "Need a hackathon project idea? Roll a topic, a piece of tech and a twist — over 1,000,000 weekend-sized combinations, plus a build prompt to scope it.",
    name: "Hackathon",
    reelLabels: ["Topic", "Tech", "Twist"],
  },
};
const MODE_IDS = ["product", "hackathon"];

const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const countItems = (map) => map.categories.reduce((n, c) => n + c.subItems.length, 0);
const urlFor = (path) => `${siteUrl}/${path ? `${path}/` : ""}`;
const hrefFor = (path) => `/${path ? `${path}/` : ""}`;

/** Mirrors getModeContent() in src/app/siteContent.ts (English). */
function mode(id) {
  const c = content.modes[id];
  const t = c.en;
  const reels = c.reels.map((r, i) => {
    const map = readJson(`src/data/maps/${r.file}`);
    return { key: r.key, label: MACHINE_META[id].reelLabels[i], map, count: countItems(map) };
  });
  // Fail the build if an example roll names an item that isn't on its reel
  // (e.g. after an item is renamed), rather than ship a made-up roll.
  for (const ex of t.examples) {
    ex.roll.forEach((item, i) => {
      if (!reels[i].map.categories.some((cat) => cat.subItems.includes(item))) {
        throw new Error(`site-content.json: "${item}" is not on the ${reels[i].key} reel (${id} example)`);
      }
    });
  }
  const counts = Object.fromEntries(reels.map((r, i) => [`n${i}`, r.count]));
  return {
    id,
    ...MACHINE_META[id],
    modeName: t.name,
    h1: t.h1,
    model: c.model,
    description: t.description,
    intro: fill(t.intro, counts),
    path: c.path,
    mapPath: c.mapPath,
    mapTitle: `${fill(t.mapTitle, counts)} | The Idea Machine`,
    mapDescription: fill(t.mapDescription, counts),
    mapH1: t.mapH1,
    mapIntro: fill(t.mapIntro, counts),
    reels,
    total: reels.reduce((n, r) => n + r.count, 0),
    examples: t.examples,
  };
}
const MODES = Object.fromEntries(MODE_IDS.map((id) => [id, mode(id)]));
const about = content.about.en;
const examplesPage = content.examplesPage.en;
const updatedText = (() => {
  const [y, m] = content.updated.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
})();

// ---------- HTML (mirrors the React pages; same classes, so instrument.css styles it) ----------

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const current = (on) => (on ? ' aria-current="page"' : "");

/** SiteChrome.tsx (minus the language button, which needs the app). */
function chrome({ page, homePath, mapsPath = "maps", modes, body }) {
  const nav = L.nav;
  const tab = (id, href, label) => `<a href="${href}"${current(page === id)}>${label}</a>`;
  const modeSwitch = modes
    ? `<nav class="im-modes" aria-label="Mode">${MODE_IDS.map(
        (id) => `<a href="${hrefFor(modes.pathFor(id))}"${current(id === modes.current)}><span class="led"></span>${esc(MODES[id].name)}</a>`,
      ).join("")}</nav>`
    : "";
  return `<style>body{background:#E4E1DB}</style>
<div class="instrument">
<header class="im-nav"><nav class="im-links" aria-label="Pages">${tab("home", hrefFor(homePath), nav.home)}${tab("about", "/about/", nav.about)}${tab("examples", "/examples/", nav.examples)}${tab("maps", hrefFor(mapsPath), nav.maps)}<a href="/legacy/">${nav.legacy}</a></nav><span class="sp"></span>${modeSwitch}</header>
<main>
${body}
</main>
</div>`;
}

const footLinks = `<nav class="im-footlinks" aria-label="Links"><a href="${esc(content.repo)}">GitHub ↗</a><a href="https://tally.so/r/ODKxqY">Say hi ↗</a></nav>`;

/** InstrumentPage.tsx: the device (plate only, before the app draws the rest) and the description. */
function machineBody(id) {
  const m = MODES[id];
  return chrome({
    page: "home",
    homePath: m.path,
    mapsPath: m.mapPath,
    modes: { current: id, pathFor: (x) => MODES[x].path },
    body: `<section class="device"><header class="plate"><h1>${esc(m.h1)}</h1><span class="model">${L.model} ${m.model}</span></header><div class="im-ssr-panel"></div></section>
<footer class="im-about">${m.description.map((d) => `<p>${esc(d)}</p>`).join("")}${footLinks}</footer>`,
  });
}

/** AboutPage.tsx */
function aboutBody() {
  return chrome({
    page: "about",
    homePath: "",
    body: `<article class="im-doc">
<h1>${esc(about.h1)}</h1>
<p>${esc(about.intro)}</p>
<p>${esc(about.belief)}</p>
<h2>${L.modes}</h2>
${MODE_IDS.map((id) => {
  const m = MODES[id];
  return `<section class="im-mode" aria-labelledby="mode-${id}"><h3 id="mode-${id}">${esc(m.h1)}</h3><p>${esc(m.intro)}</p><p><a href="${hrefFor(m.path)}">${esc(L.tryMode)}</a></p></section>`;
}).join("\n")}
<h2>${L.how}</h2>
<ol>${about.how.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
<h2>${L.faq}</h2>
<div class="im-faqs">${about.faq.map((f) => `<details class="im-faq"><summary><h3>${esc(f.q)}</h3><span class="im-faq-mark" aria-hidden="true"></span></summary><p>${esc(f.a)}</p></details>`).join("\n")}</div>
<h2>${L.lists}</h2>
<ul class="im-maplinks">${MODE_IDS.map((id) => `<li><a href="${hrefFor(MODES[id].mapPath)}">${esc(MODES[id].mapH1)}</a><span> · ${fill(L.items, { n: MODES[id].total })}</span></li>`).join("")}<li><a href="/examples/">${esc(examplesPage.h1)}</a></li></ul>
<p class="im-maker">${L.madeBy} <a href="${esc(content.maker.url)}" rel="author">${esc(content.maker.name)}</a> · ${L.updated} <time datetime="${content.updated}">${updatedText}</time></p>
${footLinks}
</article>`,
  });
}

/** ExamplesPage.tsx */
function examplesBody() {
  return chrome({
    page: "examples",
    homePath: "",
    body: `<div class="im-map">
<h1>${esc(examplesPage.h1)}</h1>
<p class="im-map-intro">${esc(examplesPage.intro)}</p>
${MODE_IDS.map((id) => {
  const m = MODES[id];
  return `<section class="im-reel" aria-labelledby="ex-${id}"><div class="im-reel-head"><h2 id="ex-${id}">${esc(m.modeName)}</h2></div><ul class="im-cats">${m.examples
    .map((ex) => `<li class="im-cat im-example"><span class="im-roll">${esc(ex.roll.join(" × "))}</span><p>${esc(ex.pitch)}</p></li>`)
    .join("")}</ul><p class="im-more"><a href="${hrefFor(m.path)}">${esc(L.tryMode)}</a></p></section>`;
}).join("\n")}
<div class="im-map-foot">${footLinks}</div>
</div>`,
  });
}

/** MapPage.tsx */
function mapBody(id) {
  const m = MODES[id];
  return chrome({
    page: "maps",
    homePath: m.path,
    mapsPath: m.mapPath,
    modes: { current: id, pathFor: (x) => MODES[x].mapPath },
    body: `<div class="im-map">
<h1>${esc(m.mapH1)}</h1>
<p class="im-map-intro">${esc(m.mapIntro)}</p>
${m.reels
  .map(
    (r) => `<section class="im-reel" id="${r.key}" aria-labelledby="${r.key}-title"><div class="im-reel-head"><h2 id="${r.key}-title">${esc(r.map.meta.title)}</h2><p>${esc(r.map.meta.subtitle)}</p></div>
<ul class="im-cats">${r.map.categories
      .map((c) => `<li class="im-cat"><h3><span class="led"></span>${esc(c.category)}</h3><ul>${c.subItems.map((it) => `<li>${esc(it)}</li>`).join("")}</ul></li>`)
      .join("\n")}</ul></section>`,
  )
  .join("\n")}
<div class="im-map-foot"><p>${esc(L.contribute)} <a href="${esc(content.repo)}">${esc(L.contributeLink)}</a></p><p><a href="${hrefFor(m.path)}">${esc(L.openMachine)}</a></p>${footLinks}</div>
</div>`,
  });
}

// ---------- JSON-LD ----------

const ids = { website: `${siteUrl}/#website`, person: `${siteUrl}/#creator` };
const person = {
  "@type": "Person",
  "@id": ids.person,
  name: content.maker.name,
  url: content.maker.url,
  sameAs: [content.maker.github],
};
const website = {
  "@type": "WebSite",
  "@id": ids.website,
  name: "The Idea Machine",
  alternateName: ["What to Build", "点子机"],
  url: `${siteUrl}/`,
  inLanguage: ["en", "zh-CN"],
  creator: { "@id": ids.person },
};
const partOf = { isPartOf: { "@id": ids.website }, creator: { "@id": ids.person }, dateModified: content.updated };

function appNode(id) {
  const m = MODES[id];
  const url = urlFor(m.path);
  return {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: id === "product" ? "The Idea Machine" : "The Idea Machine — Hackathon idea generator",
    url,
    description: m.intro,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: ["en", "zh-CN"],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    image: `${siteUrl}/og-image.png`,
    sameAs: [content.repo],
    ...partOf,
  };
}

const aboutNodes = () => [
  { "@type": "AboutPage", "@id": urlFor("about"), url: urlFor("about"), name: about.title, description: about.description, about: { "@id": appNode("product")["@id"] }, ...partOf },
  {
    "@type": "FAQPage",
    "@id": `${urlFor("about")}#faq`,
    mainEntity: about.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

const examplesNodes = () => [
  {
    "@type": "CollectionPage",
    "@id": urlFor("examples"),
    url: urlFor("examples"),
    name: examplesPage.title,
    description: examplesPage.description,
    ...partOf,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: MODE_IDS.reduce((n, id) => n + MODES[id].examples.length, 0),
      itemListElement: MODE_IDS.flatMap((id) => MODES[id].examples).map((ex, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: ex.roll.join(" × "),
        description: ex.pitch,
      })),
    },
  },
];

function mapNodes(id) {
  const m = MODES[id];
  const url = urlFor(m.mapPath);
  return [
    {
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: m.mapTitle,
      description: m.mapDescription,
      ...partOf,
      hasPart: m.reels.map((r) => {
        const items = r.map.categories.flatMap((c) => c.subItems);
        return {
          "@type": "ItemList",
          "@id": `${url}#${r.key}`,
          name: r.map.meta.title,
          description: r.map.meta.subtitle,
          numberOfItems: items.length,
          itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
        };
      }),
    },
  ];
}

const ldScript = (nodes) =>
  `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": [website, person, ...nodes] }, null, 2).replace(/</g, "\\u003c")}\n</script>`;

// ---------- routes ----------

const routes = [
  ...MODE_IDS.map((id) => ({ path: MODES[id].path, title: MODES[id].title, description: MODES[id].description, body: machineBody(id), ld: [appNode(id)] })),
  { path: "about", title: about.title, description: about.description, body: aboutBody(), ld: aboutNodes() },
  { path: "examples", title: examplesPage.title, description: examplesPage.description, body: examplesBody(), ld: examplesNodes() },
  ...MODE_IDS.map((id) => ({ path: MODES[id].mapPath, title: MODES[id].mapTitle, description: MODES[id].mapDescription, body: mapBody(id), ld: mapNodes(id) })),
  {
    path: "legacy",
    title: "The Idea Machine — Classic Slot Machine",
    description:
      "The original slot-machine version of The Idea Machine: pull the lever for a random mashup of a life space, a product form and a twist.",
    // Near-duplicate of the home page: keep it out of search results so
    // searchers land on the current machine, but let crawlers follow its links.
    robots: "noindex, follow",
    ld: [appNode("product")],
  },
];

// v1 had one page per Product reel; they're now sections of /maps/.
const OLD_MAPS = { "maps/space": "space", "maps/format": "form", "maps/twist": "twist" };

const template = readFileSync(join(distDir, "index.html"), "utf-8");

function replaceOrThrow(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`${what} not found in dist/index.html`);
  return html.replace(pattern, replacement);
}

function renderRoute({ path, title, description, robots, body, ld }) {
  const url = urlFor(path);
  const attr = (name, value) => [new RegExp(`(<meta ${name}=")[^"]*(")`), `$1${esc(value)}$2`];
  let out = template;
  out = replaceOrThrow(out, /<title>.*?<\/title>/s, `<title>${esc(title)}</title>`, "<title>");
  for (const [re, rep] of [
    attr('name="robots" content', robots ?? "index, follow"),
    attr('name="description" content', description),
    attr('property="og:title" content', title),
    attr('property="og:description" content', description),
    attr('property="og:url" content', url),
    attr('name="twitter:title" content', title),
    attr('name="twitter:description" content', description),
  ]) {
    out = replaceOrThrow(out, re, rep, re.source);
  }
  out = replaceOrThrow(out, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "canonical");
  out = replaceOrThrow(out, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, ldScript(ld), "JSON-LD");
  if (body) out = replaceOrThrow(out, /<div id="root"><\/div>/, `<div id="root">\n${body}\n</div>`, '<div id="root">');
  return out;
}

const write = (path, html) => {
  const outDir = join(distDir, path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`Generated dist/${path ? `${path}/` : ""}index.html`);
};

for (const route of routes) write(route.path, renderRoute(route));

// GitHub Pages can't send a 301, so: an instant meta refresh (which Google
// treats as a permanent redirect) plus a canonical to the new page.
for (const [path, reel] of Object.entries(OLD_MAPS)) {
  const to = `/maps/#${reel}`;
  write(
    path,
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved to the Map page | The Idea Machine</title>
<link rel="canonical" href="${urlFor("maps")}">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace(${JSON.stringify(to)})</script>
</head>
<body><p>This list moved to <a href="${to}">the Map page</a>.</p></body>
</html>
`,
  );
}

// ---------- sitemap.xml ----------

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .filter((r) => !r.robots?.includes("noindex"))
  .map((r) => `  <url>\n    <loc>${urlFor(r.path)}</loc>\n    <lastmod>${content.updated}</lastmod>\n  </url>`)
  .join("\n")}
</urlset>
`;
writeFileSync(join(distDir, "sitemap.xml"), sitemap);
console.log("Generated dist/sitemap.xml");

// ---------- llms.txt / llms-full.txt ----------

const summary = `A free random idea generator for side projects and hackathons. Each roll combines three reels into one project idea: a space in human life × a product form × a twist (Product mode), or a topic × a piece of tech × a twist (Hackathon mode). Over 1,000,000 combinations per mode, in English and Chinese. Made by ${content.maker.name}; open source (MIT).`;

const llms = `# The Idea Machine

> ${summary}

## Modes

${MODE_IDS.map((id) => `- [${MODES[id].h1}](${urlFor(MODES[id].path)}): ${MODES[id].intro}`).join("\n")}

## About

- [How it works and FAQ](${urlFor("about")}): ${about.description}
- [Example ideas](${urlFor("examples")}): ${examplesPage.description}

## The idea lists

${MODE_IDS.map((id) => {
  const m = MODES[id];
  return `- [${m.mapH1} (${m.total} items)](${urlFor(m.mapPath)}): ${m.mapDescription}\n${m.reels
    .map((r) => `  - [${r.map.meta.title} (${r.count})](${urlFor(m.mapPath)}#${r.key}): ${r.map.meta.subtitle}`)
    .join("\n")}`;
}).join("\n")}

## Optional

- [Full text of every page and list](${siteUrl}/llms-full.txt)
- [Source code and raw JSON lists](${content.repo})
- [About the maker](${content.maker.url})
`;

const llmsFull = `# The Idea Machine — full text

> ${summary}

Updated ${updatedText}. Source: ${content.repo}

${MODE_IDS.map((id) => `## ${MODES[id].h1}\n\nURL: ${urlFor(MODES[id].path)}\n\n${MODES[id].intro}\n`).join("\n")}
## ${about.h1}

URL: ${urlFor("about")}

${about.intro}

${about.belief}

### ${L.how}

${about.how.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### ${L.faq}

${about.faq.map((f) => `**${f.q}**\n${f.a}`).join("\n\n")}

## ${examplesPage.h1}

URL: ${urlFor("examples")}

${examplesPage.intro}

${MODE_IDS.map((id) => `### ${MODES[id].modeName}\n\n${MODES[id].examples.map((ex) => `- **${ex.roll.join(" × ")}**: ${ex.pitch}`).join("\n")}`).join("\n\n")}

${MODE_IDS.map((id) => {
  const m = MODES[id];
  return `## ${m.mapH1}

URL: ${urlFor(m.mapPath)}

${m.mapIntro}

${m.reels
  .map(
    (r, i) => `### ${fill(L.reel, { i: i + 1 })} · ${r.label}: ${r.map.meta.title} (${r.count})

${r.map.meta.subtitle}

${r.map.categories.map((c) => `#### ${c.category}\n\n${c.subItems.map((it) => `- ${it}`).join("\n")}`).join("\n\n")}`,
  )
  .join("\n\n")}
`;
}).join("\n")}`;

writeFileSync(join(distDir, "llms.txt"), llms);
writeFileSync(join(distDir, "llms-full.txt"), llmsFull);
console.log("Generated dist/llms.txt and dist/llms-full.txt");
