import { useLanguage } from "@/app/i18n/LanguageContext";

// Fixed top-right language switcher, mounted on every page. Shows the
// language you'd switch TO (not the current one) — matches the common
// pattern for this kind of toggle.
export function LanguageToggle({
  containerRef,
}: {
  // Measured by the starfield background (App page only) so stars never
  // blink behind this button — see StarfieldBackground's shieldRefs.
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { lang, toggleLang } = useLanguage();

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={toggleLang}
        className="lang-toggle-btn"
        aria-label={lang === "en" ? "切换到中文" : "Switch to English"}
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 999,
          padding: "6px 14px",
          cursor: "pointer",
          fontFamily: "'Limelight', sans-serif",
          fontSize: 16,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {lang === "en" ? "简" : "ENG"}
      </button>
    </div>
  );
}
