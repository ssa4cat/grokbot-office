import { useId } from "react";

interface Pt {
  x: number;
  y: number;
}

interface ConnectionLineProps {
  points: Pt[];
  color: string;
  dashed?: boolean;
  hot?: boolean;
}

function rounded(points: Pt[], radius = 8): string {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const prev = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const inX = corner.x - prev.x;
    const inY = corner.y - prev.y;
    const outX = next.x - corner.x;
    const outY = next.y - corner.y;
    const inLen = Math.hypot(inX, inY);
    const outLen = Math.hypot(outX, outY);
    const trim = Math.min(radius, inLen / 2, outLen / 2);
    if (trim < 0.5) {
      path += ` L ${corner.x} ${corner.y}`;
      continue;
    }
    const enter = { x: corner.x - (inX / inLen) * trim, y: corner.y - (inY / inLen) * trim };
    const leave = { x: corner.x + (outX / outLen) * trim, y: corner.y + (outY / outLen) * trim };
    path += ` L ${enter.x} ${enter.y} Q ${corner.x} ${corner.y} ${leave.x} ${leave.y}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

export function ConnectionLine({ points, color, dashed = false, hot = false }: ConnectionLineProps) {
  const rawId = useId().replace(/:/g, "");
  if (points.length < 2) return null;
  const pathData = rounded(points, 8);
  const markerId = `arrow-${rawId}`;
  return (
    <g style={{ pointerEvents: "none" }}>
      {hot && (
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1.2 L 9 5 L 0 8.8 Z" fill={color} />
          </marker>
        </defs>
      )}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={hot ? 3.5 : 2}
        strokeDasharray={dashed ? "6 4" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={hot ? 1 : 0.35}
        markerEnd={hot ? `url(#${markerId})` : undefined}
      />
    </g>
  );
}
