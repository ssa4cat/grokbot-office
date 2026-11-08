import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plant } from "@/components/office-2d/furniture/Plant";
import { CoffeeCup } from "@/components/office-2d/furniture/CoffeeCup";
import { RobotMarker } from "@/components/office-2d/RobotMarker";
import { ConnectionLine } from "@/components/office-2d/ConnectionLine";
import { linkAppearance, staticOffice, type Furnishing, type PlacedZone } from "@/data/layout-office";
import { useOfficeStore } from "@/store/office-store";

export function FloorPlan() {
  const { t } = useTranslation("office");
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);
  const theme = useOfficeStore((s) => s.theme);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const isDark = theme === "dark";
  const layout = staticOffice.layout;

  const card = isDark ? "#0f172a" : "#ffffff";
  const ink = isDark ? "#e2e8f0" : "#1e293b";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const floor = isDark ? "#111827" : "#f8fbff";

  return (
    <div className={`flex h-full w-full items-center justify-center overflow-hidden ${isDark ? "bg-slate-950" : "bg-sky-100"}`}>
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
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? "#0b1220" : "#d7f0ff"} />
            <stop offset="100%" stopColor={isDark ? "#111827" : "#eef7ff"} />
          </linearGradient>
          <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f6ff" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
          <filter id="card-shadow" x="-8%" y="-8%" width="116%" height="124%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity={isDark ? 0.35 : 0.08} />
          </filter>
          <filter id="holo-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#22d3ee" floodOpacity="0.7" />
          </filter>
        </defs>

        <rect width={layout.width} height={layout.height} fill="url(#sky)" />
        <rect
          x={8}
          y={8}
          width={layout.width - 16}
          height={layout.height - 16}
          rx={28}
          fill={floor}
          stroke={isDark ? "#334155" : "#bae6fd"}
          strokeWidth={3}
        />

        <OfficeHeader layout={layout} muted={muted} isDark={isDark} />

        {layout.reserved.map((slot) => (
          <g key={`reserved-${slot.col}-${slot.row}`}>
            <rect
              x={slot.x + 8}
              y={slot.y + 8}
              width={slot.width - 16}
              height={slot.height - 16}
              rx={16}
              fill={isDark ? "#1e1b2e" : "#f5f3ff"}
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="10 8"
            />
            <text x={slot.x + 20} y={slot.y + 32} fill={muted} fontSize={13} fontWeight={700}>
              預留
            </text>
          </g>
        ))}

        {layout.zones.map((zone) => {
          const zoneAgents = staticOffice.profiles.filter((profile) => profile.zoneId === zone.id);
          const selected = zoneAgents.some((profile) => profile.id === selectedAgentId);
          return (
            <g key={zone.id} filter="url(#card-shadow)">
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx={18}
                fill={card}
                stroke={zone.accent}
                strokeWidth={selected ? 3 : 1.4}
                opacity={1}
                onClick={(event) => {
                  event.stopPropagation();
                  const first = zoneAgents[0];
                  if (first) selectAgent(first.id);
                }}
                style={{ cursor: zoneAgents.length > 0 ? "pointer" : "default" }}
              />
              <text x={zone.x + 16} y={zone.y + 26} fill={zone.accent} fontSize={15} fontWeight={800}>
                {zone.name}
              </text>
              <text x={zone.x + 16} y={zone.y + 44} fill={muted} fontSize={11}>
                {zone.summary}
              </text>
              <ZoneFurniture zone={zone} isDark={isDark} />
              <Plant x={zone.x + zone.width - 26} y={zone.y + zone.height - 34} />
            </g>
          );
        })}

        {links.some((link) => linkAppearance(link).corridor) && (
          <text
            x={layout.padding + 8}
            y={layout.amenity.y - 50}
            fontSize={11}
            fontWeight={700}
            fill="#7c3aed"
          >
            {t("legendSlides")}
          </text>
        )}

        {links.map((link) => {
          const source = agents.get(link.sourceId);
          const target = agents.get(link.targetId);
          if (!source || !target) return null;
          const look = linkAppearance(link);
          const sourceZone = zoneForAgent(link.sourceId);
          const targetZone = zoneForAgent(link.targetId);
          const lane = corridorLane(link);
          return (
            <ConnectionLine
              key={`${link.pipeline ?? "article"}-${link.sourceId}-${link.targetId}-${link.kind ?? "flow"}`}
              x1={source.position.x}
              y1={source.position.y - 18}
              x2={target.position.x}
              y2={target.position.y - 18}
              strength={link.strength}
              color={look.color}
              curve={look.curve}
              dashed={look.dashed}
              waypoints={
                look.corridor && sourceZone && targetZone
                  ? corridorWaypoints(source.position, target.position, sourceZone, targetZone, layout.amenity.y - 42 + lane * 8, layout.amenity.x + layout.amenity.width)
                  : undefined
              }
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

        <AmenityStrip
          amenity={layout.amenity}
          isDark={isDark}
          ink={ink}
          muted={muted}
          lounge={t("amenityLounge")}
          coffee={t("amenityCoffee")}
          legendFlow={t("legendFlow")}
          legendReturn={t("legendReturn")}
          legendArticle={t("legendArticle")}
          legendSlides={t("legendSlides")}
        />
      </svg>
    </div>
  );
}

function OfficeHeader({
  layout,
  muted,
  isDark,
}: {
  layout: typeof staticOffice.layout;
  muted: string;
  isDark: boolean;
}) {
  const mid = layout.width / 2;
  const windowY = layout.padding + 16;
  return (
    <g>
      {[0, 1, 2].map((index) => (
        <rect
          key={`lw-${index}`}
          x={layout.padding + 20 + index * 62}
          y={windowY}
          width={52}
          height={36}
          rx={8}
          fill="url(#window)"
          stroke="#7dd3fc"
        />
      ))}
      {[0, 1, 2].map((index) => (
        <rect
          key={`rw-${index}`}
          x={layout.width - layout.padding - 196 + index * 62}
          y={windowY}
          width={52}
          height={36}
          rx={8}
          fill="url(#window)"
          stroke="#7dd3fc"
        />
      ))}
      <text x={mid} y={layout.padding + 36} textAnchor="middle" fontSize={28} fontWeight={800} letterSpacing={6} fill={isDark ? "#67e8f9" : "#0284c7"}>
        {layout.title}
      </text>
      <text x={mid} y={layout.padding + 58} textAnchor="middle" fontSize={13} fontWeight={600} fill={muted}>
        {layout.subtitle}
      </text>
    </g>
  );
}

function zoneForAgent(agentId: string): PlacedZone | undefined {
  const seat = staticOffice.layout.seats.find((item) => item.agentId === agentId);
  return staticOffice.layout.zones.find((zone) => zone.id === seat?.zoneId);
}

function corridorLane(link: { sourceId: string; targetId: string; kind?: string; pipeline?: string }): number {
  const lanes = staticOffice.links.filter((item) => linkAppearance(item).corridor);
  const index = lanes.findIndex(
    (item) => item.sourceId === link.sourceId && item.targetId === link.targetId && item.kind === link.kind && item.pipeline === link.pipeline,
  );
  return Math.max(0, index);
}

function corridorWaypoints(
  source: { x: number; y: number },
  target: { x: number; y: number },
  sourceZone: PlacedZone,
  targetZone: PlacedZone,
  laneY: number,
  gridRight: number,
): Array<{ x: number; y: number }> {
  const gutter = (zone: PlacedZone) => {
    if (zone.width > gridRight * 0.7) return zone.x + 28;
    const right = zone.x + zone.width + 6;
    return right > gridRight - 2 ? zone.x - 6 : right;
  };
  const exitY = (zone: PlacedZone) => zone.y + zone.height - 12;
  const g1 = gutter(sourceZone);
  const g2 = gutter(targetZone);
  return [
    { x: source.x, y: exitY(sourceZone) },
    { x: g1, y: exitY(sourceZone) },
    { x: g1, y: laneY },
    { x: g2, y: laneY },
    { x: g2, y: exitY(targetZone) },
    { x: target.x, y: exitY(targetZone) },
  ];
}

function ZoneFurniture({ zone, isDark }: { zone: PlacedZone; isDark: boolean }) {
  const cx = zone.x + zone.width / 2;
  const cy = zone.y + zone.height * 0.56;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <Furniture kind={zone.furnishing} accent={zone.accent} isDark={isDark} />
    </g>
  );
}

function Furniture({ kind, accent, isDark }: { kind: Furnishing; accent: string; isDark: boolean }) {
  const desk = isDark ? "#1e293b" : "#f8fafc";
  const edge = isDark ? "#334155" : "#e2e8f0";
  if (kind === "slides") {
    return (
      <g>
        <HoloScreen accent={accent} w={210} h={72} y={-24}>
          <rect x={-88} y={-60} width={70} height={8} rx={2} fill={accent} />
          <rect x={-88} y={-44} width={22} height={28} rx={2} fill="#ddd6fe" />
          <rect x={-60} y={-52} width={22} height={36} rx={2} fill={accent} />
          <rect x={-32} y={-36} width={22} height={20} rx={2} fill="#c4b5fd" />
        </HoloScreen>
        <g transform="translate(180, -16)">
          <rect x={-40} y={-36} width={80} height={52} rx={6} fill="#faf5ff" stroke={accent} />
          <rect x={-26} y={-24} width={52} height={6} rx={2} fill={accent} />
          <rect x={-26} y={-12} width={36} height={4} rx={2} fill="#ddd6fe" />
          <rect x={-26} y={-4} width={44} height={4} rx={2} fill="#ddd6fe" />
        </g>
      </g>
    );
  }

  if (kind === "command") {
    return (
      <g>
        <ellipse cx={0} cy={46} rx={54} ry={16} fill={accent} opacity={0.18} />
        <ellipse cx={0} cy={46} rx={36} ry={10} fill={isDark ? "#155e75" : "#cffafe"} stroke={accent} />
        <HoloScreen accent={accent} w={78} h={58} y={-8}>
          <CheckRow y={-48} done />
          <CheckRow y={-34} done />
          <CheckRow y={-20} done={false} />
        </HoloScreen>
      </g>
    );
  }

  return (
    <g>
      <rect x={-62} y={18} width={124} height={40} rx={10} fill={desk} stroke={edge} />
      <rect x={-62} y={52} width={124} height={8} rx={3} fill={edge} />
      {kind === "studio" ? <Easel accent={accent} /> : kind === "lab" ? <LabBench accent={accent} /> : (
        <HoloScreen accent={accent} w={70} h={48} y={-6}>
          <ScreenContent kind={kind} accent={accent} />
        </HoloScreen>
      )}
    </g>
  );
}

function HoloScreen({
  accent,
  w,
  h,
  y,
  children,
}: {
  accent: string;
  w: number;
  h: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <g filter="url(#holo-glow)" transform={`translate(0, ${y})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={8} fill="#ecfeff" stroke={accent} strokeWidth={1.6} opacity={0.95} />
      {children}
    </g>
  );
}

function CheckRow({ y, done }: { y: number; done: boolean }) {
  return (
    <g>
      <rect x={-30} y={y} width={10} height={10} rx={2} fill={done ? "#22c55e" : "#fdba74"} />
      {done ? (
        <path d={`M -28 ${y + 5} l 2.4 2.4 l 4.6 -5`} fill="none" stroke="#fff" strokeWidth={1.4} />
      ) : (
        <path d={`M -28 ${y + 2} l 6 6 M -22 ${y + 2} l -6 6`} fill="none" stroke="#fff" strokeWidth={1.3} />
      )}
      <rect x={-16} y={y + 3} width={36} height={4} rx={2} fill={done ? "#67e8f9" : "#fed7aa"} />
    </g>
  );
}

function ScreenContent({ kind, accent }: { kind: Furnishing; accent: string }) {
  if (kind === "research") {
    return (
      <g>
        <circle cx={16} cy={-24} r={10} fill="none" stroke={accent} strokeWidth={1.4} />
        <path d="M 8 -24 H 24 M 16 -32 V -16" stroke={accent} strokeWidth={1} />
        <rect x={-28} y={-18} width={6} height={14} fill={accent} opacity={0.8} />
        <rect x={-20} y={-26} width={6} height={22} fill="#818cf8" />
        <rect x={-12} y={-12} width={6} height={8} fill="#34d399" />
      </g>
    );
  }
  if (kind === "writing") {
    return (
      <g>
        {[0, 1, 2, 3].map((row) => (
          <rect key={row} x={-26} y={-38 + row * 8} width={row === 3 ? 28 : 48} height={4} rx={2} fill="#67e8f9" />
        ))}
      </g>
    );
  }
  if (kind === "editing") {
    return (
      <g>
        <rect x={-26} y={-38} width={48} height={4} rx={2} fill="#fecaca" />
        <rect x={-26} y={-28} width={40} height={4} rx={2} fill="#86efac" />
        <rect x={-26} y={-18} width={46} height={4} rx={2} fill="#fde68a" />
        <path d="M 16 -16 l 4 4 l 8 -10" fill="none" stroke="#16a34a" strokeWidth={2} />
      </g>
    );
  }
  if (kind === "review") {
    return (
      <g>
        <rect x={-28} y={-40} width={22} height={28} rx={3} fill="#fff" stroke={accent} />
        <path d="M -22 -26 l 4 4 l 8 -8" fill="none" stroke="#16a34a" strokeWidth={1.8} />
        <rect x={2} y={-40} width={22} height={28} rx={3} fill="#fff" stroke="#fb7185" />
        <path d="M 8 -30 l 10 10 M 18 -30 l -10 10" stroke="#e11d48" strokeWidth={1.6} />
      </g>
    );
  }
  return (
    <g>
      <rect x={-24} y={-36} width={48} height={6} rx={2} fill={accent} opacity={0.85} />
      <rect x={-24} y={-26} width={32} height={4} rx={2} fill="#a5f3fc" />
      <rect x={-24} y={-18} width={40} height={4} rx={2} fill="#a5f3fc" />
    </g>
  );
}

function Easel({ accent }: { accent: string }) {
  return (
    <g>
      <path d="M 0 -52 L -28 16 H 28 Z" fill="none" stroke="#d6d3d1" strokeWidth={3} />
      <rect x={-20} y={-44} width={40} height={32} rx={3} fill="#fff" stroke={accent} />
      <circle cx={-8} cy={-32} r={5} fill="#f472b6" />
      <circle cx={6} cy={-28} r={6} fill="#38bdf8" />
      <circle cx={0} cy={-18} r={4} fill="#fbbf24" />
    </g>
  );
}

function LabBench({ accent }: { accent: string }) {
  return (
    <g>
      <HoloScreen accent={accent} w={46} h={36} y={-4}>
        <ellipse cx={0} cy={-18} rx={10} ry={12} fill="#fff" stroke={accent} />
        <circle cx={0} cy={-16} r={3} fill={accent} />
      </HoloScreen>
      <rect x={28} y={-8} width={8} height={22} rx={3} fill="#bae6fd" stroke="#38bdf8" />
      <rect x={40} y={-2} width={8} height={16} rx={3} fill="#fecdd3" stroke="#fb7185" />
    </g>
  );
}

function AmenityStrip({
  amenity,
  isDark,
  ink,
  muted,
  lounge,
  coffee,
  legendFlow,
  legendReturn,
  legendArticle,
  legendSlides,
}: {
  amenity: { x: number; y: number; width: number; height: number };
  isDark: boolean;
  ink: string;
  muted: string;
  lounge: string;
  coffee: string;
  legendFlow: string;
  legendReturn: string;
  legendArticle: string;
  legendSlides: string;
}) {
  const { x, y, width, height } = amenity;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={18} fill={isDark ? "#1c1917" : "#fff7ed"} stroke={isDark ? "#44403c" : "#fed7aa"} />
      <text x={x + 18} y={y + 22} fontSize={13} fontWeight={800} fill={ink}>
        {lounge}
      </text>
      <text x={x + 78} y={y + 22} fontSize={11} fontWeight={700} fill={muted}>
        {legendArticle}
      </text>
      <line x1={x + 112} y1={y + 18} x2={x + 140} y2={y + 18} stroke="#22d3ee" strokeWidth={3} />
      <text x={x + 146} y={y + 22} fontSize={11} fill={muted}>
        {legendFlow}
      </text>
      <line x1={x + 180} y1={y + 18} x2={x + 208} y2={y + 18} stroke="#fb923c" strokeWidth={3} strokeDasharray="4 3" />
      <text x={x + 214} y={y + 22} fontSize={11} fill={muted}>
        {legendReturn}
      </text>
      <text x={x + 258} y={y + 22} fontSize={11} fontWeight={700} fill="#7c3aed">
        {legendSlides}
      </text>
      <line x1={x + 292} y1={y + 18} x2={x + 320} y2={y + 18} stroke="#7c3aed" strokeWidth={3} />
      <text x={x + 326} y={y + 22} fontSize={11} fill={muted}>
        {legendFlow}
      </text>
      <line x1={x + 360} y1={y + 18} x2={x + 388} y2={y + 18} stroke="#e879f9" strokeWidth={3} strokeDasharray="4 3" />
      <text x={x + 394} y={y + 22} fontSize={11} fill={muted}>
        {legendReturn}
      </text>
      <rect x={x + 18} y={y + 40} width={150} height={46} rx={12} fill={isDark ? "#44403c" : "#ffffff"} stroke="#fdba74" />
      <rect x={x + 28} y={y + 50} width={36} height={26} rx={8} fill="#fb923c" />
      <rect x={x + 70} y={y + 50} width={36} height={26} rx={8} fill="#fdba74" />
      <rect x={x + 112} y={y + 50} width={36} height={26} rx={8} fill="#fed7aa" />
      <text x={x + width - 248} y={y + 22} fontSize={13} fontWeight={800} fill={ink}>
        {coffee}
      </text>
      <rect x={x + width - 250} y={y + 36} width={150} height={52} rx={10} fill={isDark ? "#292524" : "#fff"} stroke="#fdba74" />
      <rect x={x + width - 236} y={y + 28} width={28} height={22} rx={4} fill="#57534e" />
      <circle cx={x + width - 222} cy={y + 24} r={3} fill="#22d3ee" />
      <CoffeeCup x={x + width - 180} y={y + 58} />
      <CoffeeCup x={x + width - 150} y={y + 58} />
      <CoffeeCup x={x + width - 120} y={y + 58} />
      <g>
        <rect x={x + width - 78} y={y + 28} width={46} height={62} rx={4} fill={isDark ? "#44403c" : "#e7e5e4"} stroke="#d6d3d1" />
        {[0, 1, 2].map((row) => (
          <line key={row} x1={x + width - 70} y1={y + 44 + row * 14} x2={x + width - 40} y2={y + 44 + row * 14} stroke="#a8a29e" />
        ))}
      </g>
      <Plant x={x + width / 2 - 20} y={y + 58} />
      <Plant x={x + 250} y={y + 62} />
    </g>
  );
}
