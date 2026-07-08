import leverPaths from "@/imports/Slots-1/svg-2nolbmjll6";

// Figma: 34×64px div at 560px slot scale → ×3.214 = 109×206px in machine space.
// SVG viewBox 0 0 100.89 253.785. Base is a near-full circle, center (17.22, 221.79).
// Pivot = left-center of base circle = (15.22, 221.79) in viewBox units.
export function Lever({
  pulled,
  onClick,
}: {
  pulled: boolean;
  onClick: () => void;
}) {
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
      <div
        style={{
          position: "absolute",
          inset: "-296.54% -151.98% 0 -44.76%",
        }}
      >
        <svg
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 100.89 253.785"
        >
          {/* Base — stays fixed */}
          <path d={leverPaths.p31c33cb2} fill="white" />

          {/* Pull group — rotates around left-center of base circle */}
          <g
            onClick={onClick}
            style={{
              cursor: "pointer",
              transform: `rotate(${pulled ? 120 : 0}deg)`,
              transformBox: "view-box",
              transformOrigin: "15.22px 221.79px",
              transition: pulled
                ? "transform 0.18s ease-out"
                : "transform 0.75s cubic-bezier(0.34, 1.5, 0.6, 1)",
            }}
          >
            <path d={leverPaths.p244e4a00} fill="#EE0000" />
            <path d={leverPaths.p2cb82f00} fill="white" />
          </g>
        </svg>
      </div>
    </div>
  );
}
