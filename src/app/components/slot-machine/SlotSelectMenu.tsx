import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Map } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { getStrings } from "@/app/i18n/strings";

export interface SlotCategory {
  category: string;
  items: string[];
}

// Full-size category -> item picker. Replaces the old hover-driven dropdown
// + flyout submenu, which on mobile only ever showed one tiny panel at a
// time and had no hover state to reveal the submenu in the first place.
// Drilling down inside one large panel keeps both levels legible on any
// screen size using nothing but click/tap.
export function SlotSelectMenu({
  label,
  mapHref,
  categories,
  open,
  onOpenChange,
  onSelect,
  children,
}: {
  label: string;
  mapHref: string;
  categories: SlotCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: string) => void;
  children: React.ReactNode;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    null,
  );
  const { lang } = useLanguage();
  const t = getStrings(lang);

  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveCategory(null);
    onOpenChange(next);
  };

  const active = categories.find(
    (c) => c.category === activeCategory,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[85vh] max-h-[720px] w-[92vw] max-w-xl flex-col gap-0 overflow-hidden border-[#EECC6D]/40 bg-[#141210] p-0 text-white shadow-[0_0_24px_rgba(238,204,109,0.15)]">
        <div className="flex items-center gap-2 border-b border-[#EECC6D]/20 px-4 py-4">
          {active ? (
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              aria-label={t.backToCategories}
              className="flex shrink-0 items-center text-white/70 hover:text-[#EECC6D]"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <span className="w-[22px] shrink-0" />
          )}
          <DialogTitle
            style={{ fontFamily: "'Arvo', sans-serif" }}
            className="flex-1 truncate text-center text-lg text-[#EECC6D]"
          >
            {active ? active.category : t.chooseLabel(label)}
          </DialogTitle>
          <span className="w-[22px] shrink-0" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {active
            ? active.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSelect(item)}
                  style={{ fontFamily: "'Arvo', sans-serif" }}
                  className="w-full rounded px-4 py-3 text-left text-base hover:bg-[#EECC6D]/15 hover:text-[#EECC6D]"
                >
                  {item}
                </button>
              ))
            : categories.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCategory(cat.category)}
                  style={{ fontFamily: "'Arvo', sans-serif" }}
                  className="flex w-full items-center justify-between rounded px-4 py-3 text-left text-base hover:bg-[#EECC6D]/15 hover:text-[#EECC6D]"
                >
                  {cat.category}
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-white/40"
                  />
                </button>
              ))}
        </div>

        <Link
          to={mapHref}
          style={{ fontFamily: "'Arvo', sans-serif" }}
          className="flex shrink-0 items-center justify-center gap-2 border-t border-[#EECC6D]/20 px-4 py-3 text-sm text-white/70 hover:bg-[#EECC6D]/10 hover:text-[#EECC6D]"
        >
          <Map size={16} />
          {t.viewFullMap(label)}
        </Link>
      </DialogContent>
    </Dialog>
  );
}
