import machinePaths from "@/assets/SlotMachine-1/svg-u88248n22q";

// Figma: h=188px in 564px-wide frame → ×3.192 = 600px. Oval inset -1.06%/-0.36%.
// Text SVG: 464×130px → 1481×415px, vertically centered at 50%+29px (9×3.192).
export function TitleSection({ scale }: { scale: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: 1800,
        height: 600,
        flexShrink: 0,
      }}
    >
      {/* Oval arch border — inset from Figma: -1.06% -0.36% */}
      <div style={{ position: "absolute", inset: "-1.06% -0.36%" }}>
        <svg
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 564 192"
        >
          <path d={machinePaths.p794c270} fill="white" />
        </svg>
      </div>
      {/* Text paths — 30 paths in 464×130 viewBox, centered with +9px vertical offset.
          Glow matches the starfield's warm off-white halo. Blur is divided by
          `scale` since this div sits inside the machine's outer scale(scale)
          transform — that keeps the on-screen glow ~constant regardless of how
          large or small the machine renders. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(50% + 29px)",
          transform: "translate(-50%, -50%)",
          width: 1481,
          height: 415,
          filter: `drop-shadow(0 0 ${5 / scale}px rgba(251, 243, 221, 0.55)) drop-shadow(0 0 ${14 / scale}px rgba(251, 243, 221, 0.32))`,
        }}
      >
        <svg
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 464 130"
        >
          <path d={machinePaths.pCreateT01} fill="white" />
          <path d={machinePaths.pCreateT02} fill="white" />
          <path d={machinePaths.pCreateT03} fill="white" />
          <path d={machinePaths.pCreateT04} fill="white" />
          <path d={machinePaths.pCreateT05} fill="white" fillRule="evenodd" clipRule="evenodd" />
          <path d={machinePaths.pCreateT06} fill="white" fillRule="evenodd" clipRule="evenodd" />
          <path d={machinePaths.pCreateT07} fill="white" />
          <path d={machinePaths.pCreateT08} fill="white" />
          <path d={machinePaths.pCreateT09} fill="white" />
          <path d={machinePaths.pCreateT10} fill="white" />
          <path d={machinePaths.pCreateT11} fill="white" fillRule="evenodd" clipRule="evenodd" />
          <path d={machinePaths.pCreateT12} fill="white" />
          <path d={machinePaths.pCreateT13} fill="white" />
          <path d={machinePaths.pCreateT14} fill="white" />
          <path d={machinePaths.pCreateSparkle} fill="white" />
          <path d={machinePaths.pCreateScript01} fill="white" />
          <path d={machinePaths.pCreateScript02} fill="white" />
          <path d={machinePaths.pCreateScript03} fill="white" fillRule="evenodd" clipRule="evenodd" />
          <path d={machinePaths.pCreateScript04} fill="white" />
          <path d={machinePaths.pCreateScript05} fill="white" fillRule="evenodd" clipRule="evenodd" />
          <path d={machinePaths.pCreateScript06} fill="white" />
          <path d={machinePaths.pCreateScript07} fill="white" fillRule="evenodd" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
