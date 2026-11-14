import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import shareQr from "@/assets/share-qr.svg";
import slotSvgPaths from "@/assets/SlotMachine/svg-wjwgi5pl1w";
import leverPaths from "@/assets/Slots-1/svg-2nolbmjll6";
import { TitleSection } from "@/app/legacy/components/TitleSection";
import { GoldenTicket } from "@/app/legacy/components/GoldenTicket";
import type { Lang } from "@/app/i18n/LanguageContext";
import type { Strings } from "@/app/i18n/strings";

// Same 1800-wide coordinate space the real machine uses, so the reused
// TitleSection (and the SVG paths borrowed from the real slot/lever assets)
// need no separate adaptation — only a different overall scale.
const MACHINE_W = 1800;
// Snapshot card target width — the mini machine renders at MINI_W, the
// ticket below it renders larger (see TICKET_SCALE), matching the Figma
// share design's "small machine, enlarged ticket" proportions.
const MINI_W = 620;
const MINI_SCALE = MINI_W / MACHINE_W;
const TICKET_SCALE = (MINI_W * 1.42) / 1600;

const SLOT_VIEWBOXES = ["32 32 572 360", "612 32 576 360", "1201 32 567 360"];
const SLOT_BG_PATHS = [
  slotSvgPaths.pd81fd80,
  slotSvgPaths.p6527600,
  slotSvgPaths.p100c1d00,
];

function StaticSlotTile({ idx, value }: { idx: number; value: string }) {
  return (
    <div style={{ flex: "1 0 0", minWidth: 0, height: "100%", position: "relative" }}>
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        fill="none"
        preserveAspectRatio="none"
        viewBox={SLOT_VIEWBOXES[idx]}
      >
        <path d={SLOT_BG_PATHS[idx]} fill="#FFF0C4" fillRule="evenodd" clipRule="evenodd" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Arvo', sans-serif",
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.2,
            color: "#1e1e1e",
            textAlign: "center",
            wordBreak: "break-word",
            margin: 0,
            padding: "0 16px",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// Non-interactive echo of Lever.tsx, frozen at rest (no drag, no pull) —
// this card is a static snapshot, not a control.
function StaticLever() {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: -141,
        width: 109,
        height: 206,
        transform: "translateY(-50%)",
      }}
    >
      <div style={{ position: "absolute", inset: "-296.54% -151.98% 0 -44.76%" }}>
        <svg
          style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 100.89 253.785"
        >
          <path d={leverPaths.p31c33cb2} fill="white" />
          <path d={leverPaths.p244e4a00} fill="#EECC6D" />
          <path d={leverPaths.p2cb82f00} fill="white" />
        </svg>
      </div>
    </div>
  );
}

// Hand-drawn "scan here" arrow between the tagline and the QR code — traced
// from the Figma share-image design (node 140:3).
function ScanArrow() {
  return (
    <svg
      width={56}
      height={24}
      viewBox="0 0 80.5977 33.9906"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M25.501 1.1319C27.6976 0.0154189 30.7178 -0.289512 34.4453 0.281318C37.6504 0.772159 40.4198 1.82054 42.458 3.28034C44.4868 4.73339 45.9184 6.6997 46.0713 9.00397C46.2261 11.3378 45.0428 13.5795 42.7734 15.4971C41.0724 16.9345 38.696 18.2519 35.5947 19.3946C39.7145 21.4509 44.9735 22.996 51.3115 23.4483L52.085 23.4971L52.0967 23.4981L52.1094 23.4991C60.6542 24.1238 67.021 23.4477 71.2227 22.6299C72.5239 22.3767 73.6181 22.1089 74.5059 21.8624C73.7426 21.391 72.8678 20.8517 71.9512 20.2862C69.1172 18.5379 65.8842 16.5466 64.2705 15.5655C63.5629 15.1351 63.3383 14.2127 63.7686 13.505C64.1989 12.7973 65.1213 12.5719 65.8291 13.002C67.4528 13.9892 70.6948 15.9857 73.5264 17.7325C74.9431 18.6065 76.2594 19.4188 77.2207 20.0128C77.7013 20.3097 78.0933 20.5527 78.3652 20.7208C78.5011 20.8048 78.6068 20.8706 78.6787 20.9151C78.7147 20.9374 78.7422 20.9545 78.7607 20.9659C78.7699 20.9716 78.7776 20.9757 78.7822 20.9786C78.7843 20.9799 78.786 20.9808 78.7871 20.9815L78.7881 20.9825H78.7891L80.5977 22.1016L78.9375 23.4298H78.9365L78.9307 23.4356C78.926 23.4393 78.9184 23.4449 78.9092 23.4522C78.8909 23.4669 78.8635 23.4883 78.8281 23.5167C78.7565 23.574 78.6509 23.6592 78.5156 23.7676C78.2451 23.9846 77.8552 24.2977 77.3789 24.6807C76.4261 25.4469 75.1265 26.4938 73.7412 27.6173C70.9574 29.8748 67.8651 32.41 66.5078 33.6133C65.8879 34.1628 64.9392 34.1053 64.3896 33.4854C63.8404 32.8655 63.8978 31.9177 64.5176 31.3682C65.86 30.178 68.7568 27.8003 71.4092 25.6466C66.9571 26.479 60.453 27.1173 51.8906 26.4913V26.4903C43.4635 26.0102 36.658 23.7063 31.6592 20.6417C24.6874 22.5347 14.8439 23.7589 1.5 23.7589C0.67173 23.7589 0.000254552 23.0871 0 22.2589C0 21.4304 0.671573 20.7589 1.5 20.7589C13.1421 20.7589 21.9532 19.8122 28.417 18.3536C26.5844 16.8614 25.1071 15.2619 24.0137 13.6446C22.4435 11.322 21.6022 8.86417 21.7773 6.60261C21.9589 4.25949 23.2278 2.28749 25.501 1.1319ZM33.9912 3.24714C30.5977 2.72747 28.2858 3.08212 26.8604 3.80671C25.5117 4.49231 24.8686 5.54354 24.7686 6.83503C24.6624 8.20807 25.169 9.99774 26.499 11.9649C27.7275 13.7819 29.6069 15.6687 32.1387 17.3839C36.3096 16.1325 39.112 14.6635 40.8369 13.2061C42.6404 11.6822 43.1502 10.2884 43.0781 9.20222C43.004 8.08656 42.2884 6.84801 40.7119 5.71882C39.1445 4.59624 36.8492 3.68483 33.9912 3.24714Z"
        fill="white"
      />
    </svg>
  );
}

function LightsRow({ variant = "top" }: { variant?: "top" | "bottom" }) {
  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        borderTop: variant === "bottom" ? "13px solid white" : "6px solid white",
        borderBottom: "13px solid white",
        paddingTop: 35,
        paddingBottom: 32,
        paddingLeft: 106,
        paddingRight: 106,
        display: "flex",
        flexDirection: "row",
        gap: 109,
        alignItems: "center",
      }}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            flexShrink: 0,
            backgroundColor: "white",
            boxShadow:
              "0 0 5px rgba(251, 243, 221, 0.55), 0 0 14px rgba(251, 243, 221, 0.32)",
          }}
        />
      ))}
    </div>
  );
}

function MiniMachine({
  format,
  space,
  twist,
  t,
}: {
  format: string;
  space: string;
  twist: string;
  t: Strings;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // transform:scale doesn't change the element's own layout box, so a
  // placeholder reserves the visually-scaled height instead — same trick
  // App.tsx uses to scale the real machine.
  useLayoutEffect(() => {
    if (contentRef.current) setNaturalHeight(contentRef.current.offsetHeight);
  }, [format, space, twist]);

  return (
    <div
      style={{
        position: "relative",
        width: MINI_W,
        height: naturalHeight * MINI_SCALE,
      }}
    >
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: MACHINE_W,
          transform: `scale(${MINI_SCALE})`,
          transformOrigin: "top left",
        }}
      >
        <TitleSection scale={MINI_SCALE} />
        <div style={{ position: "relative", width: MACHINE_W }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: -6,
              border: "12px solid white",
              pointerEvents: "none",
            }}
          />
          <LightsRow variant="top" />
          <div
            style={{
              display: "flex",
              gap: 13,
              padding: "51px 39px 0",
              fontFamily: "'Limelight', sans-serif",
              fontSize: 48,
              color: "white",
              textAlign: "center",
            }}
          >
            <div style={{ flex: "1 0 0" }}>{t.space}</div>
            <div style={{ flex: "1 0 0" }}>{t.format}</div>
            <div style={{ flex: "1 0 0" }}>{t.twist}</div>
          </div>
          <div style={{ height: 437, position: "relative", width: MACHINE_W }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", gap: 13, padding: 39 }}>
              <StaticSlotTile idx={0} value={space} />
              <StaticSlotTile idx={1} value={format} />
              <StaticSlotTile idx={2} value={twist} />
            </div>
            <StaticLever />
          </div>
          <LightsRow variant="bottom" />
          <div style={{ padding: 51 }}>
            <div
              style={{
                position: "relative",
                height: 103,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                aria-hidden
                style={{ position: "absolute", inset: -12, border: "12px solid white" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ShareCard = forwardRef<
  HTMLDivElement,
  {
    format: string;
    space: string;
    twist: string;
    lang: Lang;
    t: Strings;
  }
>(({ format, space, twist, lang, t }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        padding: 48,
        background: "#000000",
      }}
    >
      <MiniMachine format={format} space={space} twist={twist} t={t} />
      <GoldenTicket
        format={format}
        space={space}
        twist={twist}
        lang={lang}
        t={t}
        scale={TICKET_SCALE}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: 22,
            color: "white",
            whiteSpace: "nowrap",
          }}
        >
          {t.scanForOne}
        </span>
        <ScanArrow />
        <img
          src={shareQr}
          alt=""
          width={86}
          height={86}
          style={{ display: "block", borderRadius: 4 }}
        />
      </div>
    </div>
  );
});
ShareCard.displayName = "ShareCard";
