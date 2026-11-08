import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plant } from "@/components/office-2d/furniture/Plant";
import { CoffeeCup } from "@/components/office-2d/furniture/CoffeeCup";
import { RobotMarker } from "@/components/office-2d/RobotMarker";
import { ConnectionLine } from "@/components/office-2d/ConnectionLine";
import { doorEdge } from "@/data/corridors";
import { routeLinks } from "@/data/corridors";
import { linkAppearance, staticOffice, type Furnishing, type PlacedZone } from "@/data/layout-office";
import { useOfficeStore } from "@/store/office-store";

const RUG: Record<string, string> = {
  research: "#CDE8F2",
  writing: "#D9DCF7",
  editing: "#F8E3C2",
  studio: "#F7D3DD",
  review: "#E2D6F2",
  command: "#CFEFEA",
  workstation: "#D6EFDD",
  lab: "#F5D5D5",
  slides: "#E4DAF3",
};

const NAME: Record<string, string> = {
  research: "#226A88",
  writing: "#4549B6",
  editing: "#8F5B14",
  studio: "#A8395B",
  review: "#7247B7",
  command: "#21726B",
  workstation: "#2D7444",
  lab: "#A93B3B",
  slides: "#6A49BB",
};

const NAME_NIGHT: Record<string, string> = {
  research: "#C2D7E0",
  writing: "#C5C6DD",
  editing: "#E3D4BF",
  studio: "#DEC4CC",
  review: "#CEC5DD",
  command: "#C3DFDD",
  workstation: "#C5DDCD",
  lab: "#DEC5C5",
  slides: "#CCC5DD",
};

const RUG_NIGHT: Record<string, string> = {
  research: "#306072",
  writing: "#3F4AA9",
  editing: "#765522",
  studio: "#93334E",
  review: "#654491",
  command: "#32685F",
  workstation: "#376744",
  lab: "#8E3838",
  slides: "#60438D",
};

function rugFill(kind: string, dark: boolean): string {
  if (dark) return RUG_NIGHT[kind] ?? "#4A4036";
  return RUG[kind] ?? "#E7E1D8";
}

export function FloorPlan() {
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);
  const theme = useOfficeStore((s) => s.theme);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const activeHandoff = useOfficeStore((s) => s.activeHandoff);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [unit, setUnit] = useState(0.67);
  const px = (cssPx: number) => cssPx / unit;
  const isDark = theme === "dark";
  const layout = staticOffice.layout;
  const floor = isDark ? "#3A332C" : "#E8D9C4";
  const wall = isDark ? "#4A433B" : "#F4F1EC";
  const wallEdge = isDark ? "#2E2924" : "#CDBBA2";
  const corridor = isDark ? "#4A4036" : "#F1E6D6";
  const grain = isDark ? "#2E2924" : "#DCCAB1";
  useLayoutEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const box = node.viewBox.baseVal;
      if (!rect.width || !rect.height || !box.width || !box.height) return;
      const scale = Math.min(rect.width / box.width, rect.height / box.height);
      if (scale > 0) setUnit((current) => (Math.abs(current - scale) < 0.01 ? current : scale));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [layout.width, layout.height]);

  const routed = useMemo(
    () => routeLinks(layout, links.map((link) => ({ sourceId: link.sourceId, targetId: link.targetId, kind: link.kind, pipeline: link.pipeline }))),
    [layout, links],
  );

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${isDark ? "bg-[#241f1b]" : "bg-[#f3efe8]"}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={layout.subtitle}
        onClick={() => selectAgent(null)}
        style={{ fontFamily: '"Noto Sans CJK TC", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "WenQuanYi Micro Hei", "Droid Sans Fallback", sans-serif' }}
      >
        <defs>
          <clipPath id="floor-clip">
            <rect x={8} y={8} width={layout.width - 16} height={layout.height - 16} rx={18} />
          </clipPath>
        </defs>

        <g clipPath="url(#floor-clip)">
          <rect width={layout.width} height={layout.height} fill={floor} />
          {Array.from({ length: Math.ceil(layout.height / 16) }, (_, index) => (
            <line key={index} x1={0} y1={index * 16} x2={layout.width} y2={index * 16} stroke={grain} strokeWidth={1} />
          ))}

          {layout.corridors.horizontals.map((band) => (
            <rect key={`h-${band.y}`} x={band.x} y={band.y} width={band.width} height={band.height} fill={corridor} />
          ))}
          {layout.corridors.vertical && (
            <rect
              x={layout.corridors.vertical.x}
              y={layout.corridors.vertical.y}
              width={layout.corridors.vertical.width}
              height={layout.corridors.vertical.height}
              fill={corridor}
            />
          )}

          {layout.zones.map((zone) => (
            <rect
              key={`rug-${zone.id}`}
              x={zone.x + 8}
              y={zone.y + 8}
              width={zone.width - 16}
              height={zone.height - 16}
              rx={6}
              fill={rugFill(zone.furnishing, isDark)}
            />
          ))}
          <rect
            x={layout.amenity.x + 8}
            y={layout.amenity.y + 8}
            width={layout.amenity.width - 16}
            height={layout.amenity.height - 16}
            rx={6}
            fill={isDark ? "#6A4E32" : "#FBE6CF"}
          />

          {layout.zones.map((zone) => (
            <ZoneWalls key={`wall-${zone.id}`} zone={zone} fill={wall} edge={wallEdge} />
          ))}

          <OfficeHeader layout={layout} isDark={isDark} />

          {layout.zones.map((zone) => {
            const selected = staticOffice.profiles.some((profile) => profile.zoneId === zone.id && profile.id === selectedAgentId);
            const showCopy = hoveredZone === zone.id || selected;
            return (
              <g
                key={zone.id}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone((current) => (current === zone.id ? null : current))}
                onClick={(event) => {
                  event.stopPropagation();
                  const first = staticOffice.profiles.find((profile) => profile.zoneId === zone.id);
                  if (first) selectAgent(first.id);
                }}
                style={{ cursor: "pointer" }}
              >
                <ZoneFurniture zone={zone} px={px} />
                <ZonePlant zone={zone} />
                <text x={zone.x + 16} y={zone.y + px(22)} fill={(isDark ? NAME_NIGHT : NAME)[zone.id] ?? "#4A4F57"} fontSize={px(14)} fontWeight={700}>
                  {zone.name}
                </text>
                {showCopy && (
                  <text x={zone.x + 16} y={zone.y + px(38)} fill={isDark ? "#E7E1D8" : "#6B6258"} fontSize={px(11)}>
                    {zone.summary}
                  </text>
                )}
              </g>
            );
          })}

          {layout.reserved.map((slot) => (
            <g key={`reserved-${slot.col}-${slot.row}`}>
              <rect
                x={slot.x + 10}
                y={slot.y + 10}
                width={slot.width - 20}
                height={slot.height - 20}
                rx={6}
                fill="none"
                stroke="#CDBBA2"
                strokeWidth={1.5}
                strokeDasharray="7 6"
              />
              <text
                x={slot.x + slot.width / 2}
                y={slot.y + slot.height / 2}
                textAnchor="middle"
                fill={isDark ? "#B5A898" : "#8C7F70"}
                fontSize={px(12)}
                fontWeight={700}
              >
                預留擴充
              </text>
            </g>
          ))}

          <Lounge amenity={layout.amenity} isDark={isDark} px={px} />
        </g>

        {routed.map((link) => {
          const look = linkAppearance(link);
          const hot =
            selectedAgentId === link.sourceId ||
            selectedAgentId === link.targetId ||
            (activeHandoff?.sourceId === link.sourceId && activeHandoff?.targetId === link.targetId);
          return (
            <ConnectionLine
              key={`${look.pipeline}-${link.sourceId}-${link.targetId}-${link.kind ?? "flow"}`}
              points={link.points}
              color={look.color}
              dashed={look.dashed}
              hot={hot}
            />
          );
        })}

        {staticOffice.profiles.map((profile) => {
          const agent = agents.get(profile.id);
          if (!agent) return null;
          return (
            <RobotMarker
              key={profile.id}
              x={agent.position.x}
              y={agent.position.y}
              name={profile.name}
              accent={profile.accent}
              accessory={profile.accessory}
              status={agent.status}
              selected={selectedAgentId === profile.id}
              isDark={isDark}
              pixelsPerUnit={unit}
              onSelect={() => selectAgent(profile.id)}
            />
          );
        })}

        {staticOffice.profiles.map((profile) => {
          const agent = agents.get(profile.id);
          if (!agent?.speechBubble) return null;
          const text = agent.speechBubble.text;
          const width = Math.min(168, Math.max(96, text.length * 12));
          return (
            <g key={`bubble-${profile.id}`} style={{ pointerEvents: "none" }}>
              <rect x={agent.position.x - width / 2} y={agent.position.y - 58} width={width} height={28} rx={8} fill="#ffffff" stroke="#E7E1D8" />
              <text x={agent.position.x} y={agent.position.y - 40} textAnchor="middle" fontSize={12} fill="#3F3A34">
                {text}
              </text>
            </g>
          );
        })}
      </svg>

    </div>
  );
}

function OfficeHeader({ layout, isDark }: { layout: typeof staticOffice.layout; isDark: boolean }) {
  const mid = layout.width / 2;
  const windowY = layout.padding + 18;
  const windowFill = "#CFE6F5";
  return (
    <g>
      {[0, 1, 2].map((index) => (
        <rect key={`lw-${index}`} x={layout.padding + 16 + index * 58} y={windowY} width={48} height={28} rx={4} fill={windowFill} stroke="#ffffff" strokeWidth={2} />
      ))}
      {[0, 1, 2].map((index) => (
        <rect key={`rw-${index}`} x={layout.width - layout.padding - 250 + index * 58} y={windowY} width={48} height={28} rx={4} fill={windowFill} stroke="#ffffff" strokeWidth={2} />
      ))}
      <text x={mid} y={layout.padding + 34} textAnchor="middle" fontSize={26} fontWeight={800} letterSpacing={6} fill={isDark ? "#F4F1EC" : "#3F3A34"}>
        {layout.title}
      </text>
      <text x={mid} y={layout.padding + 54} textAnchor="middle" fontSize={12} fontWeight={600} fill={isDark ? "#D6CBBC" : "#6B6258"}>
        {layout.subtitle}
      </text>
    </g>
  );
}

function ZoneWalls({ zone, fill, edge }: { zone: PlacedZone; fill: string; edge: string }) {
  const seat = staticOffice.layout.seats.find((item) => item.zoneId === zone.id);
  const side = doorEdge(zone, staticOffice.layout);
  const doorX = Math.max(zone.x + 20, Math.min(zone.x + zone.width - 20, seat?.x ?? zone.x + zone.width / 2));
  const { x, y, width, height } = zone;
  const gap = 20;
  const parts: Array<[number, number, number, number]> = [
    [x, y, x + width, y],
    [x, y + height, x + width, y + height],
    [x, y, x, y + height],
    [x + width, y, x + width, y + height],
  ];
  if (side === "top") parts[0] = [x, y, doorX - gap / 2, y];
  if (side === "bottom") parts[1] = [x, y + height, doorX - gap / 2, y + height];
  const extra: Array<[number, number, number, number]> = [];
  if (side === "top") extra.push([doorX + gap / 2, y, x + width, y]);
  if (side === "bottom") extra.push([doorX + gap / 2, y + height, x + width, y + height]);
  return (
    <g strokeLinecap="butt">
      {[...parts, ...extra].map((line) => (
        <g key={line.join(",")}>
          <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke={edge} strokeWidth={8} />
          <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} stroke={fill} strokeWidth={6} />
        </g>
      ))}
    </g>
  );
}

function ZonePlant({ zone }: { zone: PlacedZone }) {
  const corners = [
    { fx: 0.14, fy: 0.78, scale: 1 },
    { fx: 0.86, fy: 0.22, scale: 0.72 },
    { fx: 0.16, fy: 0.24, scale: 1 },
    { fx: 0.84, fy: 0.78, scale: 0.72 },
  ];
  const spot = corners[(zone.col + zone.row * 2) % corners.length];
  return (
    <g transform={`translate(${zone.x + zone.width * spot.fx}, ${zone.y + zone.height * spot.fy}) scale(${spot.scale})`}>
      <Plant x={0} y={0} />
    </g>
  );
}

function ZoneFurniture({ zone, px }: { zone: PlacedZone; px: (cssPx: number) => number }) {
  const boxH = Math.max(zone.height * 0.34, 68);
  const top = zone.y + 46;
  const left = zone.x + 28;
  const width = Math.min(zone.width - 56, zone.furnishing === "slides" ? zone.width * 0.7 : 220);
  return <Furniture kind={zone.furnishing} x={left} y={top} width={width} height={boxH} zone={zone} px={px} />;
}

function Furniture({
  kind,
  x,
  y,
  width,
  height,
  zone,
  px,
}: {
  kind: Furnishing;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: PlacedZone;
  px: (cssPx: number) => number;
}) {
  const wood = "#C89F74";
  const metal = "#4A4F57";
  if (kind === "slides") {
    const screenW = zone.width * 0.4;
    const screenX = zone.x + (zone.width - screenW) / 2;
    const screenY = zone.y + px(28);
    const screenH = px(10);
    const chair = px(14);
    const gap = px(6);
    const aisle = px(16);
    const rowW = chair * 3 + gap * 2 + aisle;
    const rowX = screenX + (screenW - rowW) / 2;
    return (
      <g>
        <rect x={screenX} y={screenY} width={screenW} height={screenH} rx={2} fill="#FFFFFF" stroke="#CDBBA2" />
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            x={screenX + screenW * 0.28 + index * (screenW * 0.16)}
            y={screenY + screenH * 0.2}
            width={screenW * 0.1}
            height={screenH * 0.6}
            rx={1}
            fill={["#8B5CF6", "#A78BFA", "#C4B5FD"][index]}
          />
        ))}
        {[0, 1].map((row) =>
          [0, 1, 2].map((col) => {
            const extra = col > 1 ? aisle : 0;
            return (
              <rect
                key={`${row}-${col}`}
                x={rowX + col * (chair + gap) + extra}
                y={screenY + screenH + px(12) + row * (chair + gap)}
                width={chair}
                height={chair}
                rx={px(3)}
                fill="#C89F74"
              />
            );
          }),
        )}
        <rect x={zone.x + px(22)} y={screenY + screenH + px(16)} width={px(20)} height={px(14)} rx={2} fill={wood} stroke={metal} />
      </g>
    );
  }
  if (kind === "command") {
    const diameter = zone.height * 0.3;
    const cx = zone.x + zone.width / 2;
    const cy = zone.y + zone.height * 0.58;
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={diameter * 0.62} ry={diameter * 0.4} fill="#7DD3C7" opacity={0.35} />
        <ellipse cx={cx} cy={cy} rx={diameter * 0.42} ry={diameter * 0.28} fill={wood} />
        {[-1, 0, 1].map((offset) => (
          <rect
            key={offset}
            x={cx - px(9) + offset * px(26)}
            y={cy - diameter * 0.55}
            width={px(18)}
            height={px(10)}
            rx={2}
            fill="#9FD8FF"
            stroke={metal}
          />
        ))}
      </g>
    );
  }
  if (kind === "research") {
    return (
      <g>
        <rect x={x} y={y + 8} width={width * 0.62} height={height * 0.85} rx={2} fill={wood} />
        <rect x={x + width * 0.46} y={y} width={width * 0.4} height={height * 0.62} rx={2} fill={wood} />
        <rect x={x + 10} y={y + 4} width={28} height={18} rx={2} fill="#9FD8FF" stroke={metal} />
        <rect x={x + 44} y={y + 4} width={28} height={18} rx={2} fill="#9FD8FF" stroke={metal} />
        <rect x={x + width * 0.78} y={y + height * 0.5} width={22} height={height * 0.4} rx={2} fill="#F4F1EC" stroke={metal} />
        <rect x={x + width * 0.78 + 26} y={y + height * 0.5} width={22} height={height * 0.4} rx={2} fill="#F4F1EC" stroke={metal} />
      </g>
    );
  }
  if (kind === "writing") {
    return (
      <g>
        <rect x={x} y={y + 10} width={width * 0.7} height={height * 0.85} rx={2} fill={wood} />
        <rect x={x + 16} y={y} width={36} height={24} rx={2} fill="#2E3138" />
        <rect x={x + 18} y={y + 2} width={32} height={16} rx={1} fill="#9FD8FF" />
        <rect x={x + width * 0.62} y={y + height * 0.15} width={18} height={height * 0.7} rx={2} fill={wood} />
        {[0, 1, 2, 3].map((index) => (
          <rect key={index} x={x + width * 0.64} y={y + height * 0.22 + index * 10} width={12} height={8} rx={1} fill={["#CDE8F2", "#F7D3DD", "#F8E3C2", "#D6EFDD"][index]} />
        ))}
      </g>
    );
  }
  if (kind === "editing") {
    return (
      <g>
        <rect x={x} y={y + 12} width={width * 0.72} height={height * 0.82} rx={2} fill={wood} />
        <rect x={x + 12} y={y + 28} width={16} height={22} rx={2} fill="#F4F1EC" stroke={metal} />
        <rect x={x + 32} y={y + 32} width={16} height={18} rx={2} fill="#F8E3C2" stroke={metal} />
        <rect x={x + width * 0.55} y={y} width={width * 0.38} height={height * 0.42} rx={2} fill="#C9A27A" />
        <rect x={x + width * 0.6} y={y + 6} width={12} height={10} rx={1} fill="#F8E3C2" />
        <rect x={x + width * 0.72} y={y + 8} width={12} height={10} rx={1} fill="#F7D3DD" />
        <rect x={x + width * 0.64} y={y + 20} width={14} height={10} rx={1} fill="#D9DCF7" />
      </g>
    );
  }
  if (kind === "studio") {
    const easelH = zone.height * 0.3;
    const topY = zone.y + zone.height * 0.34;
    const palette = px(16);
    return (
      <g>
        <path d={`M ${x + 36} ${topY + easelH} L ${x + 54} ${topY} L ${x + 72} ${topY + easelH}`} fill="none" stroke={wood} strokeWidth={px(3)} />
        <rect x={x + 42} y={topY + easelH * 0.12} width={px(28)} height={easelH * 0.62} rx={2} fill="#FFFFFF" stroke="#F472B6" />
        <circle cx={x + width * 0.62} cy={topY + easelH * 0.7} r={palette / 2} fill="#F4F1EC" stroke={metal} />
        <circle cx={x + width * 0.58} cy={topY + easelH * 0.64} r={palette * 0.16} fill="#F7D3DD" />
        <circle cx={x + width * 0.66} cy={topY + easelH * 0.74} r={palette * 0.16} fill="#CDE8F2" />
      </g>
    );
  }
  if (kind === "review") {
    return (
      <g>
        <rect x={x} y={y + 8} width={width * 0.62} height={height * 0.85} rx={2} fill="#FFFFFF" stroke="#CDBBA2" />
        <rect x={x + 8} y={y + 24} width={width * 0.48} height={height * 0.28} rx={2} fill="#F4F1EC" />
        {[0, 1, 2, 3].map((index) => (
          <rect key={index} x={x + width * 0.7} y={y + index * 16} width={18} height={12} rx={2} fill={index % 2 ? "#E2D6F2" : "#F7D3DD"} stroke={metal} />
        ))}
      </g>
    );
  }
  if (kind === "workstation") {
    return (
      <g>
        <rect x={x} y={y + 10} width={width * 0.78} height={height * 0.8} rx={2} fill={wood} />
        <rect x={x + 12} y={y + 28} width={16} height={16} rx={2} fill="#E7E1D8" />
        <rect x={x + width * 0.55} y={y + 28} width={16} height={16} rx={2} fill="#E7E1D8" />
        <rect x={x + width * 0.78} y={y + 8} width={18} height={height * 0.55} rx={2} fill="#2E3138" />
        <rect x={x + width * 0.82} y={y + 14} width={6} height={10} rx={1} fill="#9FD8FF" />
      </g>
    );
  }
  if (kind === "lab") {
    return (
      <g>
        <rect x={x} y={y + 8} width={width * 0.62} height={height * 0.8} rx={2} fill={wood} />
        <rect x={x + width * 0.68} y={y + 6} width={14} height={height * 0.7} rx={2} fill={metal} />
        <rect x={x + width * 0.64} y={y + height * 0.35} width={28} height={8} rx={2} fill="#F5D5D5" />
        <rect x={x + 10} y={y + height * 0.7} width={width * 0.4} height={8} rx={1} fill="#F5D76E" />
      </g>
    );
  }
  return <rect x={x} y={y + 16} width={width * 0.6} height={height * 0.45} rx={2} fill={wood} />;
}

function Lounge({
  amenity,
  isDark,
  px,
}: {
  amenity: { x: number; y: number; width: number; height: number };
  isDark: boolean;
  px: (cssPx: number) => number;
}) {
  const { x, y, width, height } = amenity;
  const wood = isDark ? "#8A6A45" : "#C89F74";
  const sofa = isDark ? "#8A6244" : "#F4D2B0";
  const mid = x + width * 0.46;
  return (
    <g>
      <rect x={x + px(18)} y={y + px(16)} width={px(108)} height={px(58)} rx={px(8)} fill={isDark ? "#8C6848" : "#F3D3AE"} />
      <rect x={x + px(28)} y={y + px(40)} width={px(64)} height={px(22)} rx={px(6)} fill={sofa} />
      <rect x={x + px(40)} y={y + px(22)} width={px(40)} height={px(24)} rx={px(6)} fill={sofa} />
      <rect x={x + px(96)} y={y + px(46)} width={px(28)} height={px(16)} rx={2} fill={wood} />
      <circle cx={x + px(136)} cy={y + px(28)} r={px(5)} fill="#FFE2B8" stroke={wood} />
      <rect x={x + px(148)} y={y + px(36)} width={px(40)} height={px(12)} rx={2} fill={wood} />
      <rect x={mid} y={y + height * 0.38} width={px(36)} height={px(16)} rx={2} fill={wood} />
      <rect x={mid + px(2)} y={y + height * 0.62} width={px(12)} height={px(10)} rx={2} fill={sofa} />
      <rect x={mid + px(22)} y={y + height * 0.62} width={px(12)} height={px(10)} rx={2} fill={sofa} />
      <rect x={x + width - px(230)} y={y + height * 0.32} width={px(120)} height={px(26)} rx={4} fill={wood} />
      <rect x={x + width - px(214)} y={y + height * 0.16} width={px(22)} height={px(16)} rx={2} fill={isDark ? "#44403c" : "#F4F1EC"} />
      <CoffeeCup x={x + width - px(160)} y={y + height * 0.48} />
      <rect x={x + width - px(78)} y={y + px(14)} width={px(36)} height={height - px(28)} rx={3} fill={isDark ? "#44403c" : "#E7E5E4"} stroke="#CDBBA2" />
      <Plant x={x + px(210)} y={y + height - px(18)} />
    </g>
  );
}
