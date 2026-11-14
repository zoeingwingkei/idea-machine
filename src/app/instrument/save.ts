// "Save image": a dialog that previews a card of the current idea (a small
// echo of the machine with its three reels and glyph, the brief, and a QR
// code to the site) and saves it as a PNG.
//
// The card is rendered at its true size and only scaled down for the
// preview, so the exported image stays crisp (html-to-image measures the
// card itself, which a transform on its parent doesn't affect).

import { toBlob } from "html-to-image";
import productQr from "@/assets/share-qr.svg";
import hackathonQr from "@/assets/share-qr-hackathon.svg";
import { DIAL_THEME, drawGlyph, makeGlyph } from "./glyph";
import type { ModeId } from "./modes";
import { esc } from "./util";

// Each mode's card links back to that mode. Both QR codes are static images
// tagged for GA4 (utm_source=share_qr, utm_campaign=organic_share); the
// hackathon one also carries utm_content=hackathon so its scans can be told
// apart. The product QR is the same file the legacy share card uses.
const QR: Record<ModeId, { src: string; site: string }> = {
  product: { src: productQr, site: "the-idea-machine.com" },
  hackathon: { src: hackathonQr, site: "the-idea-machine.com/hackathon" },
};

/** Everything the card shows, already in the current language. */
export interface SaveCard {
  brand: string;
  /** Which mode the card is for: picks the QR code and the URL under it. */
  modeId: ModeId;
  mode: string;
  labels: readonly string[];
  texts: readonly string[];
  brief: string;
  scan: string;
  serial: number;
}

export interface SaverWords {
  save: string;
  saving: string;
}

const EXPORT_RATIO = 2;
const FILENAME = "the-idea-machine.png";
const GLYPH_CSS_SIZE = 96; // keep in sync with .svc-dial canvas in instrument.css

function cardHtml(c: SaveCard): string {
  const channels = c.texts
    .map(
      (t, ri) => `
      <div class="svc-ch">
        <span class="svc-lab">${esc(c.labels[ri])}</span>
        <div class="svc-win"><i class="svc-pay l"></i><span>${esc(t)}</span><i class="svc-pay r"></i></div>
      </div>`,
    )
    .join("");
  return `
    <div class="svc-device">
      <div class="svc-top">
        <span>${esc(c.brand)}</span>
        <span class="svc-mode"><i class="svc-led"></i>${esc(c.mode)}</span>
      </div>
      <div class="svc-main">
        <div class="svc-bezel">${channels}</div>
        <div class="svc-dial"><div class="svc-dial-in"><canvas></canvas></div></div>
      </div>
    </div>
    <div class="svc-brief">
      <p>${esc(c.brief)}</p>
    </div>
    <div class="svc-foot">
      <div>
        <p class="svc-scan">${esc(c.scan)}</p>
        <p class="svc-site">${QR[c.modeId].site}</p>
      </div>
      <img src="${QR[c.modeId].src}" alt="" width="76" height="76">
    </div>`;
}

/** Hand the PNG to the system share sheet where it can take files (mobile), else download it. */
async function deliver(blob: Blob): Promise<void> {
  const file = new File([blob], FILENAME, { type: "image/png" });
  // iOS Safari ignores <a download>; its share sheet has "Save Image".
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = FILENAME;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface Saver {
  open(card: SaveCard, words: SaverWords): void;
  readonly isOpen: boolean;
}

export function createSaver(
  dialog: HTMLDialogElement,
  signal: AbortSignal,
  onSaved: () => void,
): Saver {
  const q = (name: string) => dialog.querySelector<HTMLElement>(`[data-el="${name}"]`)!;
  const stage = q("svStage");
  const fit = q("svFit");
  const go = q("svGo") as HTMLButtonElement;
  const goLabel = q("svGoLabel");

  const scaler = document.createElement("div");
  scaler.className = "sv-scaler";
  fit.appendChild(scaler);
  const card = document.createElement("div");
  card.className = "svc";
  scaler.appendChild(card);

  let words: SaverWords = { save: "", saving: "" };
  let saving = false;

  const setSaving = (on: boolean) => {
    saving = on;
    go.disabled = on;
    goLabel.textContent = on ? words.saving : words.save;
  };

  function fitPreview() {
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    if (!w || !h || !stage.clientWidth || !stage.clientHeight) return;
    const scale = Math.min(1, stage.clientWidth / w, stage.clientHeight / h);
    scaler.style.transform = `scale(${scale})`;
    fit.style.width = `${w * scale}px`;
    fit.style.height = `${h * scale}px`;
  }
  const ro = new ResizeObserver(fitPreview);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const blob = await toBlob(card, { pixelRatio: EXPORT_RATIO, cacheBust: true });
      if (!blob) throw new Error("toBlob returned null");
      onSaved();
      await deliver(blob);
    } catch (err) {
      // Dismissing the share sheet throws AbortError — a cancel, not a failure.
      if ((err as Error)?.name !== "AbortError") console.error("Failed to save image", err);
    } finally {
      setSaving(false);
    }
  }

  go.addEventListener("click", save, { signal });
  q("svClose").addEventListener("click", () => dialog.close(), { signal });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }, { signal }); // backdrop
  dialog.addEventListener("close", () => ro.disconnect(), { signal });
  signal.addEventListener("abort", () => ro.disconnect());

  return {
    get isOpen() {
      return dialog.open;
    },
    open(c, w) {
      words = w;
      setSaving(false);
      card.innerHTML = cardHtml(c);
      // Draw the glyph at export resolution so it stays sharp in the PNG.
      drawGlyph(
        card.querySelector("canvas")!,
        makeGlyph(c.serial, { accent: true }),
        GLYPH_CSS_SIZE,
        DIAL_THEME,
        EXPORT_RATIO,
      );
      dialog.showModal();
      ro.observe(stage);
      ro.observe(card);
      fitPreview();
      go.focus();
    },
  };
}
