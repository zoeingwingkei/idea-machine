import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { useDocumentMeta } from "@/app/hooks/useDocumentMeta";
import type { ModeId } from "@/app/instrument/modes";
import { FooterLinks, SiteChrome } from "@/app/instrument/SiteChrome";
import { REPO, getLabels, getModeContent } from "@/app/siteContent";

// /maps/ (Product) and /maps/hackathon/: every item on a mode's three reels,
// grouped by category, one section per reel (#space, #form, #twist /
// #topic, #tech, #twist). The build writes the same lists into the static
// HTML (scripts/generate-route-shells.mjs).
export default function MapPage({ modeId }: { modeId: ModeId }) {
  const { lang } = useLanguage();
  const { hash } = useLocation();
  const l = getLabels(lang);
  const c = getModeContent(modeId, lang);
  useDocumentMeta(c.mapTitle, c.mapDescription);

  // Land on the reel a link asked for (e.g. old /maps/twist/ → /maps/#twist);
  // otherwise start at the top when switching modes.
  useEffect(() => {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [modeId, hash]);

  return (
    <SiteChrome
      page="maps"
      homePath={c.path}
      mapsPath={c.mapPath}
      modes={{ current: modeId, hrefFor: (id) => getModeContent(id, lang).mapPath }}
      showLang
    >
      <div className="im-map">
        <h1>{c.mapH1}</h1>
        <p className="im-map-intro">{c.mapIntro}</p>

        {c.reels.map((r) => (
          <section className="im-reel" id={r.key} key={r.key} aria-labelledby={`${r.key}-title`}>
            <div className="im-reel-head">
              <h2 id={`${r.key}-title`}>{lang === "zh" ? r.map.meta.title_zh : r.map.meta.title}</h2>
              <p>{lang === "zh" ? r.map.meta.subtitle_zh : r.map.meta.subtitle}</p>
            </div>
            <ul className="im-cats">
              {r.map.categories.map((cat) => (
                <li className="im-cat" key={cat.category}>
                  <h3>
                    <span className="led" />
                    {lang === "zh" ? cat.category_zh : cat.category}
                  </h3>
                  <ul>
                    {(lang === "zh" ? cat.subItems_zh : cat.subItems).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="im-map-foot">
          <p>
            {l.contribute}{" "}
            <a href={REPO} target="_blank" rel="noopener noreferrer">
              {l.contributeLink}
            </a>
          </p>
          <p>
            <Link to={c.path}>{l.openMachine}</Link>
          </p>
          <FooterLinks />
        </div>
      </div>
    </SiteChrome>
  );
}
