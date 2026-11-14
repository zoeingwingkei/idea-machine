import ticketSvgPaths from "@/assets/Ticket-1/svg-jkajgizkpe";
import type { Lang } from "@/app/i18n/LanguageContext";
import type { Strings } from "@/app/i18n/strings";

// Background SVG is 500×187.5 viewBox (perforated ticket shape). Rendered at
// exact 1600×600px (×3.2 scale) so the perforations stay round — never skewed.
// overflow:hidden on the outer div crops whatever background extends below content.

// Picks "a"/"an" by sound, not just spelling — handles the common exceptions
// (silent-h words, "u-" words that start with a consonant sound) since new
// product-form items can be added to the data later.
export function articleFor(word: string): "A" | "An" {
  const firstWord = word.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (/^(uni|use|user|one|eu)/.test(firstWord)) return "A";
  if (/^(hour|honest|honor|heir)/.test(firstWord)) return "An";
  return /^[aeiou]/.test(firstWord) ? "An" : "A";
}

export function GoldenTicket({
  format,
  space,
  twist,
  lang,
  t,
  scale = 1,
}: {
  format: string;
  space: string;
  twist: string;
  lang: Lang;
  t: Strings;
  // Multiplies every pixel value directly (rather than a CSS transform)
  // so the container's height — driven by its content, since idea text can
  // wrap to more than one line — stays correct at any size with no separate
  // measuring step.
  scale?: number;
}) {
  const w = 1600 * scale;
  const h = 600 * scale;
  return (
    <div
      style={{
        position: "relative",
        width: w,
        overflow: "hidden",
      }}
    >
      {/* Background at true proportional size — clipped, never stretched */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w,
          height: h,
          pointerEvents: "none",
        }}
      >
        <svg width={w} height={h} viewBox="0 0 500 187.5" fill="none">
          <path d={ticketSvgPaths.p4a02280} fill="#EECC6D" />
        </svg>
      </div>
      {/* Content sits above background and drives the container height */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: `${51 * scale}px ${77 * scale}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 13 * scale,
        }}
      >
        {/* "YOUR IDEA" row with scroll decors */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24 * scale,
          }}
        >
          <div
            style={{
              width: 201 * scale,
              height: 51 * scale,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 62.9243 15.96"
            >
              <path d={ticketSvgPaths.p23e4f00} fill="black" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Limelight', sans-serif",
              fontSize: 48 * scale,
              color: "black",
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {t.yourIdea}
          </span>
          <div
            style={{
              width: 201 * scale,
              height: 51 * scale,
              position: "relative",
              flexShrink: 0,
              transform: "scaleX(-1)",
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 62.9243 15.96"
            >
              <path d={ticketSvgPaths.p23e4f00} fill="black" />
            </svg>
          </div>
        </div>
        {/* Idea text */}
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 64 * scale,
            textAlign: "center",
            color: "black",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {lang === "en" ? (
            <>
              <em>{articleFor(format)} </em>
              <strong>{format}</strong>
              <em> for </em>
              <strong>{space}</strong>
              {" — "}
              <strong>{twist}.</strong>
            </>
          ) : (
            <>
              <em>为 </em>
              <strong>{space}</strong>
              <em> 打造的 </em>
              <strong>{format}</strong>
              {" —— "}
              <strong>{twist}。</strong>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
