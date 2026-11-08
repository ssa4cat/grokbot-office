import { useId } from "react";

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strength: number;
  color?: string;
  curve?: number;
  dashed?: boolean;
  /** Extra corners between the endpoints. Used by the slides corridor. */
  waypoints?: Array<{ x: number; y: number }>;
}

export function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  strength,
  color = "#38bdf8",
  curve = 1,
  dashed = false,
  waypoints,
}: ConnectionLineProps) {
  const rawId = useId().replace(/:/g, "");
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(dist) || dist < 1) return null;

  let pathData: string;
  if (waypoints && waypoints.length > 0) {
    pathData = `M ${x1} ${y1} ${waypoints.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${x2} ${y2}`;
  } else {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const offset = Math.min(dist * 0.22, 64) * curve;
    const cx = midX - (dy / dist) * offset;
    const cy = midY + (dx / dist) * offset;
    pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }
  const opacity = Math.max(0.55, Math.min(1, strength));
  const markerId = `arrow-${rawId}`;

  return (
    <g style={{ pointerEvents: "none" }}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1.2 L 9 5 L 0 8.8 Z" fill={color} />
        </marker>
      </defs>
      <path d={pathData} fill="none" stroke={color} strokeWidth={5} opacity={0.16} />
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={dashed ? 2 : 2.6}
        strokeDasharray={dashed ? "7 6" : "10 7"}
        strokeLinecap="round"
        opacity={opacity}
        markerEnd={`url(#${markerId})`}
        style={{ animation: "dash-flow 1.1s linear infinite" }}
      />
    </g>
  );
}
