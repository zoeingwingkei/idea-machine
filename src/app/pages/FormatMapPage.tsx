import { useLanguage } from "@/app/i18n/LanguageContext";
import { getFormatGroups, getFormatMeta } from "@/app/i18n/mapData";
import { MapPage } from "./MapPage";

export default function FormatMapPage() {
  const { lang } = useLanguage();
  const meta = getFormatMeta(lang);
  return (
    <MapPage
      title={meta.title}
      subtitle={meta.subtitle}
      note={meta.note}
      groups={getFormatGroups(lang)}
    />
  );
}
