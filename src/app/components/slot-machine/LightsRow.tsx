// Pure flex layout matching Figma "0 0 560 37" geometry scaled ×3.214 to 1800px.
// activeLightGroup: -1=all white, 0=odd indices (0,2,4…) gold, 1=even indices (1,3,5…) gold.
// Borders: top 6px, bottom 13px. Padding: 35px top, 32px bottom, 106px sides. Gap: 109px.
export function LightsRow({
  activeLightGroup,
  variant = "top",
}: {
  activeLightGroup: number;
  variant?: "top" | "bottom";
}) {
  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        borderTop:
          variant === "bottom"
            ? "13px solid white"
            : "6px solid white",
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
      {Array.from({ length: 12 }, (_, i) => {
        const isActive =
          activeLightGroup !== -1 && i % 2 === activeLightGroup;
        return (
          <div
            key={i}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
              backgroundColor: isActive ? "#FFD700" : "white",
              boxShadow: isActive
                ? "0 0 8px 2px #FFD700, 0 0 20px 6px rgba(255,210,0,0.7)"
                : undefined,
              transition:
                "background-color 0.12s, box-shadow 0.12s",
            }}
          />
        );
      })}
    </div>
  );
}
