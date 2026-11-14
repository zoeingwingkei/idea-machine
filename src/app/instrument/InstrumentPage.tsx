import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { useDocumentMeta } from "@/app/hooks/useDocumentMeta";
import { getStrings } from "@/app/i18n/strings";
import { trackModeSwitch, trackUiSwitch } from "@/app/analytics";
import { MODES, MODE_LIST, type Lang, type Mode, type ModeId } from "./modes";
import { mountInstrument, type InstrumentHandle } from "./controller";
import "./instrument.css";

const PAGE_BG = "#E4E1DB"; // keep in sync with --page in instrument.css

const CHROME: Record<Lang, { home: string; classic: string; classicFull: string; github: string; sayHi: string }> = {
  en: { home: "The Idea Machine", classic: "Classic", classicFull: " slot machine", github: "GitHub ↗", sayHi: "Say hi ↗" },
  zh: { home: "点子机", classic: "经典版", classicFull: "老虎机", github: "GitHub ↗", sayHi: "打个招呼 ↗" },
};

// Hackathon mode's opening About line; the rest of the About copy is shared.
const HACKATHON_ABOUT: Record<Lang, string> = {
  en: "In Hackathon mode, The Idea Machine combines three things: a topic, a piece of tech, and an unexpected twist — sized for a project you can build in a weekend.",
  zh: "黑客松模式下，The Idea Machine（点子机）把三样东西摇在一起：一个题材、一项技术、一个意外转折，组合成一个周末就能做完的项目。",
};

/**
 * The machine itself. React only provides the mount point: the controller
 * owns everything inside it. Keyed by mode at the call site, so switching
 * cartridges tears the old machine down and boots a fresh one.
 */
function Instrument({ mode }: { mode: Mode }) {
  const { lang, toggleLang } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const handle = useRef<InstrumentHandle | null>(null);
  const toggleLangRef = useRef(toggleLang);
  toggleLangRef.current = toggleLang;
  // Read once at mount; later changes go through setLang below.
  const initialLang = useRef(lang).current;

  useLayoutEffect(() => {
    const h = mountInstrument(rootRef.current!, {
      mode,
      lang: initialLang,
      onToggleLang: () => toggleLangRef.current(),
    });
    handle.current = h;
    return () => {
      h.destroy();
      handle.current = null;
    };
  }, [mode, initialLang]);

  useEffect(() => {
    handle.current?.setLang(lang);
  }, [lang]);

  return <div ref={rootRef} />;
}

export default function InstrumentPage({ modeId }: { modeId: ModeId }) {
  const mode = MODES[modeId];
  const { lang } = useLanguage();
  const c = CHROME[lang];
  // The about copy is shared with the legacy slot machine (except "Roll" for "Pull the lever").
  const t = getStrings(lang);
  useDocumentMeta(mode.documentTitle[lang], mode.documentDescription[lang]);

  return (
    <div className="instrument">
      <style>{`body { background: ${PAGE_BG}; }`}</style>

      <header className="im-nav">
        <h1>
          <Link to={mode.path}>{c.home}</Link>
        </h1>
        <span className="sp" />
        <nav className="im-modes" aria-label={lang === "zh" ? "模式" : "Mode"}>
          {MODE_LIST.map((m) => (
            <Link
              key={m.id}
              to={m.path}
              aria-current={m.id === mode.id ? "page" : undefined}
              onClick={() => m.id !== mode.id && trackModeSwitch(m.id)}
            >
              <span className="led" />
              {m.name[lang]}
            </Link>
          ))}
        </nav>
        <Link
          className="im-classic"
          to="/legacy"
          onClick={() => trackUiSwitch("legacy")}
        >
          {c.classic}
          <span className="full">{c.classicFull}</span>
        </Link>
      </header>

      <main>
        <Instrument key={mode.id} mode={mode} />

        <footer className="im-about">
          {mode.id === "hackathon" ? (
            <p>{HACKATHON_ABOUT[lang]}</p>
          ) : (
            <p>
              {t.aboutP1Pre}
              {t.aboutHumanNeed}
              {t.aboutP1Mid1}
              {t.aboutProductForm}
              {t.aboutP1Mid2}
              {t.aboutTwist}
              {t.aboutP1End}
            </p>
          )}
          <p>{t.aboutP2Roll}</p>
          <p>{t.aboutP3}</p>
          <nav aria-label={lang === "zh" ? "链接" : "Links"}>
            <a href="https://github.com/zoeingwingkei/idea-machine" target="_blank" rel="noopener noreferrer">
              {c.github}
            </a>
            <a href="https://tally.so/r/ODKxqY" target="_blank" rel="noopener noreferrer">
              {c.sayHi}
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
