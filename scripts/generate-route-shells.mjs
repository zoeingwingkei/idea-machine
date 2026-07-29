// Post-build step: GitHub Pages serves static files, and this app has only
// 4 fixed routes, so rather than adopting a full SSG framework we just clone
// dist/index.html once per route with route-specific <title>/description/
// canonical/OG/Twitter tags swapped in. The <div id="root"> and script tag
// stay identical — the client app still hydrates and takes over routing
// normally; this only fixes what crawlers and link-preview bots (which don't
// run JS) see on first load.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
const siteUrl = "https://www.the-idea-machine.com";

const routes = [
  {
    path: "maps/space",
    title:
      "Life Space Ideas Map — Where to Find Your Next Project | The Idea Machine",
    description:
      "The fundamental domains where humans spend their time, attention, energy, and money — one of the three dials behind The Idea Machine's project idea generator.",
  },
  {
    path: "maps/format",
    title:
      "Product Format Ideas Map — App, Tool & Product Types | The Idea Machine",
    description:
      "The fundamental ways people package and deliver value — one of the three dials behind The Idea Machine's project idea generator.",
  },
  {
    path: "maps/twist",
    title:
      "Twist & Angle Ideas Map — Unique Hooks for Your Project | The Idea Machine",
    description:
      "Unexpected constraints, mechanics, audiences, aesthetics, and angles that make an idea feel fresh — one of the three dials behind The Idea Machine's project idea generator.",
  },
];

const template = readFileSync(join(distDir, "index.html"), "utf-8");

function withRouteMeta(html, { path, title, description }) {
  const url = `${siteUrl}/${path}`;
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      `$1${url}$2`,
    )
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${title}$2`,
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      `$1${url}$2`,
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${title}$2`,
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${description}$2`,
    );
}

for (const route of routes) {
  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), withRouteMeta(template, route));
  console.log(`Generated dist/${route.path}/index.html`);
}
