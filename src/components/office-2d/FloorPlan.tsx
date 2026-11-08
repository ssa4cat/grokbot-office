import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  research: "#2F7FA0",
  writing: "#4C51B5",
  editing: "#B45309",
  studio: "#BE3A6A",
  review: "#6D28D9",
  command: "#0E7490",
  workstation: "#047857",
  lab: "#BE123C",
  slides: "#6D28D9",
};

function shade(hex: string, dark: boolean): string {
  if (!dark) return hex;
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * 0.6).toString(16).padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

export function FloorPlan() {
  const { t } = useTranslation("office");
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);
  const theme = useOfficeStore((s) => s.theme);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const activeHandoff = useOfficeStore((s) => s.activeHandoff);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const isDark = theme === "dark";
  const layout = staticOffice.layout;
  const floor = isDark ? "#3A332C" : "#E8D9C4";
  const wall = isDark ? "#4A433B" : "#F4F1EC";
  const wallEdge = isDark ? "#2E2924" : "#CDBBA2";
  const corridor = isDark ? "#4A4036" : "#F1E6D6";
  const grain = isDark ? "#2E2924" : "#DCCAB1";
  const routed = useMemo(
    () => routeLinks(layout, links.map((link) => ({ sourceId: link.sourceId, targetId: link.targetId, kind: link.kind, pipeline: link.pipeline }))),
    [layout, links],
  );

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${isDark ? "bg-[#241f1b]" : "bg-[#f3efe8]"}`}>
      <svg
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
              fill={shade(RUG[zone.furnishing] ?? "#E7E1D8", isDark)}
            />
          ))}
          <rect
            x={layout.amenity.x + 8}
            y={layout.amenity.y + 8}
            width={layout.amenity.width - 16}
            height={layout.amenity.height - 16}
            rx={6}
            fill={shade("#FBE6CF", isDark)}
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
                <ZoneFurniture zone={zone} />
                <ZonePlant zone={zone} />
                <text x={zone.x + 16} y={zone.y + 24} fill={NAME[zone.id] ?? "#4A4F57"} fontSize={14} fontWeight={700}>
                  {zone.name}
                </text>
                {showCopy && (
                  <text x={zone.x + 16} y={zone.y + 40} fill="#6B6258" fontSize={11}>
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
              <text x={slot.x + slot.width / 2} y={slot.y + slot.height / 2} textAnchor="middle" fill="#A89C8C" fontSize={12} fontWeight={700}>
                預留擴充
              </text>
            </g>
          ))}

          <Lounge amenity={layout.amenity} isDark={isDark} />
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

      <div
        className={`pointer-events-none absolute right-3 top-3 rounded-lg px-3 py-2 text-xs leading-5 ${isDark ? "bg-[#2c2824] text-[#e7e5e4]" : "bg-white text-[#3F3A34]"}`}
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,.08)" }}
      >
        <LegendRow color="#A78BFA" label={`${t("legendArticle")} ${t("legendFlow")}`} />
        <LegendRow color="#A78BFA" label={`${t("legendArticle")} ${t("legendReturn")}`} dashed />
        <LegendRow color="#6FB7C8" label={`${t("legendSlides")} ${t("legendFlow")}`} />
        <LegendRow color="#6FB7C8" label={`${t("legendSlides")} ${t("legendReturn")}`} dashed />
      </div>
    </div>
  );
}

function LegendRow({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="8" aria-hidden="true">
        <line x1="0" y1="4" x2="28" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "6 4" : undefined} />
      </svg>
      <span>{label}</span>
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

function ZoneFurniture({ zone }: { zone: PlacedZone }) {
  const boxH = Math.max(zone.height * 0.34, 68);
  const top = zone.y + 46;
  const left = zone.x + 28;
  const width = Math.min(zone.width - 56, zone.furnishing === "slides" ? zone.width * 0.7 : 220);
  return <Furniture kind={zone.furnishing} x={left} y={top} width={width} height={boxH} zone={zone} />;
}

function Furniture({
  kind,
  x,
  y,
  width,
  height,
  zone,
}: {
  kind: Furnishing;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: PlacedZone;
}) {
  const wood = "#C89F74";
  const metal = "#4A4F57";
  if (kind === "slides") {
    const screenW = zone.width * 0.4;
    const screenX = zone.x + (zone.width - screenW) / 2;
    const screenY = zone.y + 18;
    return (
      <g>
        <rect x={screenX} y={screenY} width={screenW} height={10} rx={2} fill="#FFFFFF" stroke="#CDBBA2" />
        {[0, 1, 2].map((index) => (
          <rect key={index} x={screenX + screenW * 0.22 + index * (screenW * 0.16)} y={screenY + 2} width={screenW * 0.1} height={6} rx={1} fill={["#8B5CF6", "#A78BFA", "#C4B5FD"][index]} />
        ))}
        {[0, 1].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={screenX + screenW * 0.12 + col * (screenW * 0.28)}
              y={screenY + 22 + row * 20}
              width={14}
              height={14}
              rx={3}
              fill="#C89F74"
            />
          )),
        )}
        <rect x={zone.x + 36} y={screenY + 28} width={28} height={22} rx={2} fill={wood} stroke={metal} />
      </g>
    );
  }
  if (kind === "command") {
    const cx = x + width / 2;
    const cy = y + height * 0.55;
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={height * 0.46} ry={height * 0.28} fill="#7DD3C7" opacity={0.35} />
        <ellipse cx={cx} cy={cy} rx={height * 0.34} ry={height * 0.2} fill={wood} />
        {[-1, 0, 1].map((offset) => (
          <rect key={offset} x={cx - 16 + offset * 28} y={cy - height * 0.42} width={22} height={14} rx={2} fill="#9FD8FF" stroke={metal} />
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
    return (
      <g>
        <path d={`M ${x + 28} ${y + height * 0.75} L ${x + 46} ${y} L ${x + 64} ${y + height * 0.75}`} fill="none" stroke={wood} strokeWidth={3} />
        <rect x={x + 34} y={y + 8} width={24} height={height * 0.4} rx={2} fill="#FFFFFF" stroke="#F472B6" />
        <circle cx={x + width * 0.55} cy={y + height * 0.45} r={16} fill="#F4F1EC" stroke={metal} />
        <circle cx={x + width * 0.5} cy={y + height * 0.42} r={4} fill="#F7D3DD" />
        <circle cx={x + width * 0.58} cy={y + height * 0.48} r={4} fill="#CDE8F2" />
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

function Lounge({ amenity, isDark }: { amenity: { x: number; y: number; width: number; height: number }; isDark: boolean }) {
  const { x, y, width, height } = amenity;
  const wood = isDark ? "#8A6A45" : "#C89F74";
  return (
    <g>
      <rect x={x + 24} y={y + 28} width={78} height={28} rx={8} fill={isDark ? "#6A5340" : "#F4D2B0"} />
      <rect x={x + 36} y={y + 18} width={54} height={22} rx={8} fill={isDark ? "#6A5340" : "#F4D2B0"} />
      <rect x={x + 118} y={y + 36} width={36} height={22} rx={4} fill={wood} />
      <rect x={x + width - 210} y={y + 30} width={120} height={28} rx={4} fill={wood} />
      <rect x={x + width - 196} y={y + 22} width={22} height={16} rx={2} fill={isDark ? "#44403c" : "#F4F1EC"} />
      <CoffeeCup x={x + width - 150} y={y + 40} />
      <rect x={x + width - 70} y={y + 18} width={36} height={height - 34} rx={3} fill={isDark ? "#44403c" : "#E7E5E4"} stroke="#CDBBA2" />
      <Plant x={x + width / 2} y={y + height - 28} />
    </g>
  );
}
