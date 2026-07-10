import productFormsData from "@/imports/map-of-product-forms.json";
import { MapPage } from "./MapPage";

export default function FormatMapPage() {
  return (
    <MapPage
      title={productFormsData.meta.title}
      subtitle={productFormsData.meta.subtitle}
      note={productFormsData.meta.note}
      groups={productFormsData.categories.map((c) => ({
        title: c.category,
        items: c.subItems,
      }))}
    />
  );
}
