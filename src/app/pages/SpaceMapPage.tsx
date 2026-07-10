import humanLifeData from "@/imports/map-of-human-life.json";
import { MapPage } from "./MapPage";

export default function SpaceMapPage() {
  return (
    <MapPage
      title={humanLifeData.meta.title}
      subtitle={humanLifeData.meta.subtitle}
      note={humanLifeData.meta.note}
      groups={humanLifeData.domains.map((d) => ({
        title: d.domain,
        items: d.subItems,
      }))}
    />
  );
}
