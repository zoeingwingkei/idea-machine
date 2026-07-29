import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ShareCard } from "@/app/components/ShareCard";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { getStrings } from "@/app/i18n/strings";

export function ShareDialog({
  open,
  onOpenChange,
  format,
  space,
  twist,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: string;
  space: string;
  twist: string;
}) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const [downloading, setDownloading] = useState(false);
  // State-based (callback) refs, not useRef: Radix mounts DialogContent's
  // children on a render pass after `open` itself flips true, so an effect
  // keyed on `open` can fire before a plain ref is attached. These update —
  // and re-run the effect below — exactly when the nodes actually attach.
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
  const [boxEl, setBoxEl] = useState<HTMLDivElement | null>(null);
  // The card always renders at its true native size (so the downloaded PNG
  // stays crisp — html-to-image measures scrollWidth/scrollHeight, which
  // CSS transforms don't affect). This just scales it down visually to fit
  // the dialog, computed from the card's own natural size.
  const [preview, setPreview] = useState({ scale: 1, w: 0, h: 0 });

  useEffect(() => {
    if (!cardEl || !boxEl) return;
    const update = () => {
      const naturalW = cardEl.scrollWidth;
      const naturalH = cardEl.scrollHeight;
      if (!naturalW || !naturalH) return;
      const availW = boxEl.clientWidth;
      const availH = boxEl.clientHeight;
      if (!availW || !availH) return;
      const scale = Math.min(1, availW / naturalW, availH / naturalH);
      setPreview({ scale, w: naturalW * scale, h: naturalH * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(boxEl);
    ro.observe(cardEl);
    return () => ro.disconnect();
  }, [cardEl, boxEl]);

  const handleDownload = async () => {
    if (!cardEl || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardEl, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = "the-idea-machine.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate share image", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[85vh] max-h-[720px] w-[92vw] max-w-xl flex-col gap-4 overflow-hidden border-[#EECC6D]/40 bg-[#141210] p-6 text-white shadow-[0_0_24px_rgba(238,204,109,0.15)]"
        style={{ fontFamily: "'Arvo', sans-serif" }}
      >
        <DialogTitle className="text-center text-lg text-[#EECC6D]">
          {t.shareTitle}
        </DialogTitle>

        <div
          ref={setBoxEl}
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded"
        >
          <div style={{ width: preview.w || undefined, height: preview.h || undefined }}>
            <div
              style={{
                transform: `scale(${preview.scale})`,
                transformOrigin: "top left",
              }}
            >
              <ShareCard
                ref={setCardEl}
                format={format}
                space={space}
                twist={twist}
                lang={lang}
                t={t}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg py-3 text-base transition-opacity"
          style={{
            fontFamily: "'Limelight', sans-serif",
            letterSpacing: 1,
            background: "#EECC6D",
            color: "black",
            opacity: downloading ? 0.6 : 1,
            cursor: downloading ? "default" : "pointer",
          }}
        >
          <Download size={18} />
          {downloading ? t.generatingImage : t.downloadImage}
        </button>
      </DialogContent>
    </Dialog>
  );
}
