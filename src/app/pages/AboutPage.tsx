import { Link } from "react-router";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { useDocumentMeta } from "@/app/hooks/useDocumentMeta";
import { FaqItem, FooterLinks, SiteChrome } from "@/app/instrument/SiteChrome";
import {
  MAKER,
  MODE_IDS,
  UPDATED,
  fill,
  formatUpdated,
  getAbout,
  getExamplesPage,
  getLabels,
  getModeContent,
} from "@/app/siteContent";

// /about/: what the machine is, its two modes, how it works, FAQ, maker.
// The build writes the same text into the static HTML
// (scripts/generate-route-shells.mjs), from src/data/site-content.json.
export default function AboutPage() {
  const { lang } = useLanguage();
  const a = getAbout(lang);
  const l = getLabels(lang);
  const modes = MODE_IDS.map((id) => getModeContent(id, lang));
  useDocumentMeta(a.title, a.description);

  return (
    <SiteChrome page="about" homePath="/" showLang>
      <article className="im-doc">
        <h1>{a.h1}</h1>
        <p>{a.intro}</p>
        <p>{a.belief}</p>

        <h2>{l.modes}</h2>
        {modes.map((m) => (
          <section className="im-mode" key={m.id} aria-labelledby={`mode-${m.id}`}>
            <h3 id={`mode-${m.id}`}>{m.h1}</h3>
            <p>{m.intro}</p>
            <p>
              <Link to={m.path}>{l.tryMode}</Link>
            </p>
          </section>
        ))}

        <h2>{l.how}</h2>
        <ol>
          {a.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2>{l.faq}</h2>
        <div className="im-faqs">
          {a.faq.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>

        <h2>{l.lists}</h2>
        <ul className="im-maplinks">
          {modes.map((m) => (
            <li key={m.id}>
              <Link to={m.mapPath}>{m.mapH1}</Link>
              <span> · {fill(l.items, { n: m.reels.reduce((n, r) => n + r.count, 0) })}</span>
            </li>
          ))}
          <li>
            <Link to="/examples/">{getExamplesPage(lang).h1}</Link>
          </li>
        </ul>

        <p className="im-maker">
          {l.madeBy}{" "}
          <a href={MAKER.url} target="_blank" rel="noopener author">
            {MAKER.name}
          </a>
          {" · "}
          {l.updated} <time dateTime={UPDATED}>{formatUpdated(lang)}</time>
        </p>
        <FooterLinks />
      </article>
    </SiteChrome>
  );
}
