import { useState } from "react";
import type { Accessory } from "@/data/layout-office";
import type { AgentVisualStatus } from "@/gateway/types";
import { STATUS_COLORS } from "@/lib/constants";

interface RobotMarkerProps {
  x: number;
  y: number;
  name: string;
  accent: string;
  accessory: Accessory | null;
  status: AgentVisualStatus;
  selected: boolean;
  isDark: boolean;
  pixelsPerUnit: number;
  onSelect: () => void;
}

export function RobotMarker({
  x,
  y,
  name,
  accent,
  accessory,
  status,
  selected,
  isDark,
  pixelsPerUnit,
  onSelect,
}: RobotMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const shell = isDark ? "#e2e8f0" : "#ffffff";
  const ink = isDark ? "#e2e8f0" : "#334155";
  const eye = status === "idle" ? "#67e8f9" : STATUS_COLORS[status];
  const unit = pixelsPerUnit > 0 ? pixelsPerUnit : 0.67;
  const iconScale = 28 / unit / 57;
  const gap = 6 / unit;
  const plateFont = 12 / unit;
  const plateHeight = 16 / unit;
  const plateWidth = Math.max(44 / unit, name.length * plateFont + 14 / unit);
  const iconShift = -gap + 8 * iconScale;
  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: "pointer" }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <g transform={`translate(0, ${iconShift}) scale(${iconScale})`}>
      <ellipse cx={0} cy={6} rx={18} ry={5} fill={isDark ? "#020617" : "#94a3b8"} opacity={0.25} />
      {selected && <circle r={30} fill={accent} opacity={0.16} />}
      {(selected || hovered) && (
        <circle r={27} fill="none" stroke={accent} strokeWidth={2} opacity={0.9} />
      )}

      {accessory === "cape" && (
        <path d="M -12 -22 Q 0 -6 12 -22 L 14 -2 Q 0 10 -14 -2 Z" fill={accent} opacity={0.92} />
      )}

      <rect x={-12} y={-30} width={24} height={22} rx={8} fill={shell} stroke="#d5dee8" strokeWidth={1} />
      {accessory === "badge" && <rect x={-4} y={-22} width={8} height={6} rx={1.5} fill={accent} />}
      {accessory === "pencil" && (
        <g transform="rotate(28)">
          <rect x={10} y={-18} width={3.2} height={16} rx={1} fill="#facc15" />
          <rect x={10} y={-4} width={3.2} height={3} fill="#fb7185" />
        </g>
      )}

      <rect x={-14} y={-52} width={28} height={24} rx={11} fill={shell} stroke="#d5dee8" strokeWidth={1} />
      <circle cx={-15} cy={-40} r={4.2} fill={accent} />
      <circle cx={15} cy={-40} r={4.2} fill={accent} />
      <circle cx={-15} cy={-40} r={1.6} fill="#ecfeff" />
      <circle cx={15} cy={-40} r={1.6} fill="#ecfeff" />

      <rect x={-10} y={-46} width={20} height={11} rx={5.5} fill="#0f172a" />
      <ellipse cx={-4} cy={-40.5} rx={2.3} ry={2.7} fill={eye} />
      <ellipse cx={4.2} cy={-40.5} rx={2.3} ry={2.7} fill={eye} />
      <circle cx={-3.2} cy={-41.4} r={0.7} fill="#ffffff" />
      <circle cx={5} cy={-41.4} r={0.7} fill="#ffffff" />

      {accessory === "glasses" && (
        <g fill="none" stroke="#334155" strokeWidth={1.1}>
          <circle cx={-4} cy={-40.5} r={3.4} />
          <circle cx={4.2} cy={-40.5} r={3.4} />
          <path d="M -0.6 -40.5 H 0.8" />
        </g>
      )}
      {accessory === "goggles" && (
        <rect x={-11} y={-47} width={22} height={12} rx={6} fill="none" stroke={accent} strokeWidth={2} />
      )}
      {accessory === "beret" && <ellipse cx={2} cy={-54} rx={12} ry={5} fill={accent} />}
      {accessory === "cap" && (
        <g>
          <path d="M -12 -50 Q 0 -62 12 -50 L 8 -48 Q 0 -56 -8 -48 Z" fill="#1e293b" />
          <path d="M 6 -50 H 18" stroke="#1e293b" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      )}
      {accessory === "headset" && (
        <path d="M -14 -48 Q 0 -64 14 -48" fill="none" stroke={accent} strokeWidth={2} />
      )}
      {accessory === "pointer" && (
        <g transform="rotate(-20)">
          <rect x={12} y={-16} width={4} height={14} rx={1} fill="#1e293b" />
          <circle cx={14} cy={-18} r={2.2} fill={accent} />
        </g>
      )}

      <line x1={0} y1={-52} x2={0} y2={-60} stroke="#94a3b8" strokeWidth={1.4} />
      <circle cx={0} cy={-62} r={3.1} fill={accent} />
      </g>

      <g transform="translate(0, 0)">
        <rect x={-plateWidth / 2} y={0} width={plateWidth} height={plateHeight} rx={8 / unit} fill={isDark ? "#2a2622" : "#ffffff"} stroke={isDark ? "#4A433B" : "#E7E1D8"} />
        <text y={plateHeight * 0.75} textAnchor="middle" fontSize={plateFont} fontWeight={700} fill={ink} style={{ fontFamily: "inherit" }}>
          {name}
        </text>
      </g>
    </g>
  );
}
