import { useEffect, useLayoutEffect, useRef } from "react";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { useDocumentMeta } from "@/app/hooks/useDocumentMeta";
import { trackModeSwitch } from "@/app/analytics";
import { MODES, type Mode, type ModeId } from "./modes";
import { mountInstrument, type InstrumentHandle } from "./controller";
import { getModeContent } from "@/app/siteContent";
import { FooterLinks, SiteChrome } from "./SiteChrome";

/**
 * The machine itself. React only provides the mount point: the controller
 * owns everything inside it (including the model plate, the page's <h1>).
 * Keyed by mode at the call site, so switching cartridges tears the old
 * machine down and boots a fresh one.
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
  const content = getModeContent(modeId, lang);
  useDocumentMeta(mode.documentTitle[lang], mode.documentDescription[lang]);

  return (
    <SiteChrome
      page="home"
      homePath={mode.path}
      mapsPath={content.mapPath}
      modes={{
        current: mode.id,
        hrefFor: (id) => MODES[id].path,
        onSwitch: trackModeSwitch,
      }}
    >
      <Instrument key={mode.id} mode={mode} />

      {/* Same text the build writes into the static HTML for crawlers
          (scripts/generate-route-shells.mjs), from src/data/site-content.json.
          Everything else lives on /about/, /examples/ and /maps/. */}
      <footer className="im-about">
        {content.description.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <FooterLinks />
      </footer>
    </SiteChrome>
  );
}
