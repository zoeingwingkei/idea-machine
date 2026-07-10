import twistsData from "@/imports/map-of-twists.json";
import { MapPage } from "./MapPage";

export default function TwistMapPage() {
  return (
    <MapPage
      title={twistsData.meta.title}
      subtitle={twistsData.meta.subtitle}
      note={twistsData.meta.note}
      groups={twistsData.categories.map((c) => ({
        title: c.category,
        items: c.subItems,
      }))}
    />
  );
}
