import { useRef, useState } from "react";
import leverPaths from "@/imports/Slots-1/svg-2nolbmjll6";

// Figma: 34×64px div at 560px slot scale → ×3.214 = 109×206px in machine space.
// SVG viewBox 0 0 100.89 253.785. Base is a near-full circle, center (17.22, 221.79).
// Pivot = left-center of base circle = (15.22, 221.79) in viewBox units.
const MAX_ANGLE = 120;
const DRAG_DISTANCE = 90; // px of downward drag mapped to a full pull
const PULL_THRESHOLD = 0.4; // fraction of full pull that fires the spin

export function Lever({
  pulled,
  onClick,
  disabled = false,
}: {
  pulled: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [dragAngle, setDragAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    setDragging(true);
    setDragAngle(0);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!dragging) return;
    const deltaY = e.clientY - startY.current;
    setDragAngle(
      Math.min(MAX_ANGLE, Math.max(0, (deltaY / DRAG_DISTANCE) * MAX_ANGLE)),
    );
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const pulledFarEnough = dragAngle >= MAX_ANGLE * PULL_THRESHOLD;
    setDragAngle(0);
    if (pulledFarEnough) onClick();
  };

  const angle = pulled ? MAX_ANGLE : dragging ? dragAngle : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: -141,
        width: 109,
        height: 206,
        transform: "translateY(-50%)",
        // Chromium doesn't register touch-action on SVG structural elements
        // (like the <g> below) in its compositor hit-test regions, so a touch
        // drag gets a spurious pointercancel after the first move unless
        // touch-action: none also sits on an ancestor HTML element.
        touchAction: "none",
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              cursor: disabled ? "default" : dragging ? "grabbing" : "grab",
              touchAction: "none",
              transform: `rotate(${angle}deg)`,
              transformBox: "view-box",
              transformOrigin: "15.22px 221.79px",
              transition: dragging
                ? "none"
                : pulled
                  ? "transform 0.18s ease-out"
                  : "transform 0.75s cubic-bezier(0.34, 1.5, 0.6, 1)",
            }}
          >
            <path
              d={leverPaths.p244e4a00}
              fill={disabled ? "#9E9E9E" : "#EECC6D"}
              style={{ transition: "fill 0.25s ease" }}
            />
            <path d={leverPaths.p2cb82f00} fill="white" />
          </g>
        </svg>
      </div>
    </div>
  );
}
