// The Braun-style page frame shared by the machine, About, Examples and Maps
// pages: the warm page colour, the top bar (page tabs on the left, then the
// mode switch / language button on the right) and the footer links.
// scripts/generate-route-shells.mjs writes the same markup into each page's
// static HTML, so keep the two in step.

import type { ReactNode } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { trackUiSwitch } from "@/app/analytics";
import { MODE_LIST, type ModeId } from "./modes";
import { REPO, getLabels } from "@/app/siteContent";
import "./instrument.css";

const PAGE_BG = "#E4E1DB"; // keep in sync with --page in instrument.css

export type PageId = "home" | "about" | "examples" | "maps";

interface ChromeProps {
  page: PageId;
  /** Where Home goes (the current mode's machine). */
  homePath: string;
  /** Where Maps goes (the current mode's lists). */
  mapsPath?: string;
  /** Show the Product / Hackathon switch, with each mode's link for this page. */
  modes?: { current: ModeId; hrefFor: (id: ModeId) => string; onSwitch?: (id: ModeId) => void };
  /** Pages without the machine's 中文 key get a language button in the bar. */
  showLang?: boolean;
  children: ReactNode;
}

export function SiteChrome({ page, homePath, mapsPath = "/maps/", modes, showLang, children }: ChromeProps) {
  const { lang, toggleLang } = useLanguage();
  const nav = getLabels(lang).nav;
  const tab = (id: PageId, to: string, label: string) => (
    <Link to={to} aria-current={page === id ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <div className="instrument">
      <style>{`body { background: ${PAGE_BG}; }`}</style>

      <header className="im-nav">
        <nav className="im-links" aria-label={lang === "zh" ? "页面" : "Pages"}>
          {tab("home", homePath, nav.home)}
          {tab("about", "/about/", nav.about)}
          {tab("examples", "/examples/", nav.examples)}
          {tab("maps", mapsPath, nav.maps)}
          <Link to="/legacy/" onClick={() => trackUiSwitch("legacy")}>
            {nav.legacy}
          </Link>
        </nav>
        <span className="sp" />
        {modes && (
          <nav className="im-modes" aria-label={lang === "zh" ? "模式" : "Mode"}>
            {MODE_LIST.map((m) => (
              <Link
                key={m.id}
                to={modes.hrefFor(m.id)}
                aria-current={m.id === modes.current ? "page" : undefined}
                onClick={() => m.id !== modes.current && modes.onSwitch?.(m.id)}
              >
                <span className="led" />
                {m.name[lang]}
              </Link>
            ))}
          </nav>
        )}
        {showLang && (
          <button type="button" className="im-lang" onClick={toggleLang} lang={lang === "zh" ? "en" : "zh"}>
            {getLabels(lang).langToggle}
          </button>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}

/** GitHub / Say hi, at the foot of every page. */
export function FooterLinks() {
  const { lang } = useLanguage();
  return (
    <nav className="im-footlinks" aria-label={lang === "zh" ? "链接" : "Links"}>
      <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      <a href="https://tally.so/r/ODKxqY" target="_blank" rel="noopener noreferrer">
        {lang === "zh" ? "打个招呼 ↗" : "Say hi ↗"}
      </a>
    </nav>
  );
}

/** One FAQ entry: a closed accordion whose answer stays in the page (and the static HTML). */
export function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="im-faq">
      <summary>
        <h3>{q}</h3>
        <span className="im-faq-mark" aria-hidden="true" />
      </summary>
      <p>{a}</p>
    </details>
  );
}
