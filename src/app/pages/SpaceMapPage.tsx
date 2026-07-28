import { useLanguage } from "@/app/i18n/LanguageContext";
import { getSpaceGroups, getSpaceMeta } from "@/app/i18n/mapData";
import { MapPage } from "./MapPage";

export default function SpaceMapPage() {
  const { lang } = useLanguage();
  const meta = getSpaceMeta(lang);
  return (
    <MapPage
      title={meta.title}
      subtitle={meta.subtitle}
      note={meta.note}
      groups={getSpaceGroups(lang)}
    />
  );
}
