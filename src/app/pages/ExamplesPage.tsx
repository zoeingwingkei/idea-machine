import { Link } from "react-router";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { useDocumentMeta } from "@/app/hooks/useDocumentMeta";
import { FooterLinks, SiteChrome } from "@/app/instrument/SiteChrome";
import { MODE_IDS, getExamplesPage, getLabels, getModeContent } from "@/app/siteContent";

// /examples/: real rolls from both modes, each with a one-line pitch.
// The build writes the same text into the static HTML
// (scripts/generate-route-shells.mjs), from src/data/site-content.json.
export default function ExamplesPage() {
  const { lang } = useLanguage();
  const p = getExamplesPage(lang);
  const l = getLabels(lang);
  useDocumentMeta(p.title, p.description);

  return (
    <SiteChrome page="examples" homePath="/" showLang>
      <div className="im-map">
        <h1>{p.h1}</h1>
        <p className="im-map-intro">{p.intro}</p>

        {MODE_IDS.map((id) => {
          const m = getModeContent(id, lang);
          return (
            <section className="im-reel" key={id} aria-labelledby={`ex-${id}`}>
              <div className="im-reel-head">
                <h2 id={`ex-${id}`}>{m.name}</h2>
              </div>
              <ul className="im-cats">
                {m.examples.map((ex) => (
                  <li className="im-cat im-example" key={ex.pitch}>
                    <span className="im-roll">{ex.roll.join(" × ")}</span>
                    <p>{ex.pitch}</p>
                  </li>
                ))}
              </ul>
              <p className="im-more">
                <Link to={m.path}>{l.tryMode}</Link>
              </p>
            </section>
          );
        })}

        <div className="im-map-foot">
          <FooterLinks />
        </div>
      </div>
    </SiteChrome>
  );
}
