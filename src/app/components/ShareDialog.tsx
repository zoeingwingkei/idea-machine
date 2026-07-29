import { useEffect, useState } from "react";
import { toBlob } from "html-to-image";
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
      const blob = await toBlob(cardEl, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error("toBlob returned null");
      const filename = "the-idea-machine.png";
      const file = new File([blob], filename, { type: "image/png" });

      // iOS Safari (and several other mobile browsers) silently ignore the
      // `download` attribute on <a> — a synthetic click just does nothing
      // there, which is why this button previously appeared broken on
      // mobile. The Web Share API's native share sheet includes "Save
      // Image", which is the reliable way to get a file onto a mobile
      // device, so prefer it wherever sharing files is supported.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Dismissing the native share sheet throws AbortError — that's a
      // cancellation, not a failure.
      if ((err as Error)?.name !== "AbortError") {
        console.error("Failed to generate share image", err);
      }
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
