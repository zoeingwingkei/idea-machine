import { useLanguage } from "@/app/i18n/LanguageContext";
import { getTwistGroups, getTwistMeta } from "@/app/i18n/mapData";
import { MapPage } from "./MapPage";

export default function TwistMapPage() {
  const { lang } = useLanguage();
  const meta = getTwistMeta(lang);
  return (
    <MapPage
      title={meta.title}
      subtitle={meta.subtitle}
      note={meta.note}
      groups={getTwistGroups(lang)}
    />
  );
}
