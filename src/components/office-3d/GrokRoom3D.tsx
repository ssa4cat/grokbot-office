import { Html } from "@react-three/drei";
import { staticOffice, stationsFor, svgToWorld, type PlacedZone } from "@/data/layout-office";
import type { ThemeMode } from "@/gateway/types";
import { useOfficeStore } from "@/store/office-store";
import {
  BookShelf,
  Chair,
  CoffeeMachine,
  CorkBoard,
  Desk,
  Easel,
  FilingCabinet,
  FloorLamp,
  Monitor,
  Plant,
  RobotArm,
  Sofa,
} from "./furniture";
import { Block } from "./furniture";
import { boundaryToward, commandCenter, occupiedFloor, walkSegments } from "./walkways";

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

const layout = staticOffice.layout;

function at(x: number, y: number, lift = 0): [number, number, number] {
  const [wx, , wz] = svgToWorld({ x, y });
  return [wx, lift, wz];
}

function worldLen(px: number): number {
  return (px / layout.width) * 18;
}

export function GrokRoom3D({ theme }: { theme: ThemeMode }) {
  const dark = theme === "dark";
  const floor = occupiedFloor();
  const floorX = floor.centerX;
  const floorZ = floor.centerZ;
  const { floorW, floorD, minWX, minWZ } = floor;
  const wall = dark ? "#2a2826" : "#F4F1EC";

  return (
    <group>
      <hemisphereLight args={["#FFF6E8", "#D8CBB8", 0.6]} />
      <ambientLight intensity={0.22} color="#FFF6E8" />
      <directionalLight
        position={[-10, 14, 8]}
        intensity={0.8}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0008}
      />
      <directionalLight position={[2, 6, -6]} intensity={0.35} color="#FFE2B8" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[floorX, 0, floorZ]} receiveShadow>
        <planeGeometry args={[floorW, floorD]} />
        <meshLambertMaterial color={dark ? "#3a342c" : "#E8D9C4"} />
      </mesh>
      <mesh position={[floorX, 0.04, minWZ]} receiveShadow>
        <boxGeometry args={[floorW, 0.08, 0.08]} />
        <meshLambertMaterial color="#CDBBA2" />
      </mesh>

      <mesh position={[floorX, 1.25, minWZ]} castShadow receiveShadow>
        <boxGeometry args={[floorW, 2.5, 0.12]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh position={[minWX, 1.25, floorZ]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 2.5, floorD]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      {Array.from({ length: 5 }).map((_, index) => (
        <mesh key={index} position={[minWX + floorW * ((index + 1) / 6), 1.65, minWZ + 0.08]}>
          <planeGeometry args={[Math.min(2.0, floorW / 7), 1.05]} />
          <meshLambertMaterial color="#D7E8F5" emissive="#FFE2B8" emissiveIntensity={0.18} />
        </mesh>
      ))}
      <group position={[floorX + floorW * 0.12, 1.72, minWZ + 0.1]}>
        <mesh>
          <circleGeometry args={[0.16, 16]} />
          <meshLambertMaterial color="#F4F1EC" />
        </mesh>
        <mesh position={[0.03, 0.04, 0.01]}>
          <boxGeometry args={[0.07, 0.018, 0.01]} />
          <meshLambertMaterial color="#4A4F57" />
        </mesh>
        <mesh position={[0, 0.045, 0.012]}>
          <boxGeometry args={[0.018, 0.09, 0.01]} />
          <meshLambertMaterial color="#4A4F57" />
        </mesh>
      </group>
      <Html position={[floorX, 2.15, minWZ + 0.16]} center style={{ pointerEvents: "none" }}>
        <div style={{ fontWeight: 800, letterSpacing: "0.22em", fontSize: 18, color: "#0369a1" }}>{layout.title}</div>
      </Html>

      {walkSegments().map((segment, index) => (
        <WalkStrip key={index} a={segment.a} b={segment.b} width={segment.width} />
      ))}

      {layout.zones.map((zone) => (
        <ZoneRoom key={zone.id} zone={zone} />
      ))}
      <ReservedPods />
      <Lounge />
    </group>
  );
}

function WalkStrip({ a, b, width }: { a: { x: number; y: number }; b: { x: number; y: number }; width: number }) {
  const [ax, , az] = svgToWorld(a);
  const [bx, , bz] = svgToWorld(b);
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.05) return null;
  return (
    <mesh position={[(ax + bx) / 2, 0.03, (az + bz) / 2]} rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]} receiveShadow>
      <planeGeometry args={[len, worldLen(width)]} />
      <meshLambertMaterial color="#F1E6D6" />
    </mesh>
  );
}

function ZoneRoom({ zone }: { zone: PlacedZone }) {
  const rug = RUG[zone.id] ?? "#E7E1D8";
  const [cx, , cz] = svgToWorld({ x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 });
  const w = worldLen(zone.width - 10);
  const d = (zone.height / layout.width) * 18;
  const speaking = useOfficeStore((state) => Array.from(state.agents.values()).some((agent) => agent.speechBubble));
  const sign =
    zone.id === "slides"
      ? at(zone.x + zone.width * 0.78, zone.y + zone.height - 26, 0.06)
      : at(zone.x + 28, zone.y + 14, 0.58);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.012, cz]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshLambertMaterial color={rug} />
      </mesh>
      <ZoneWalls zone={zone} />
      <ZoneSign text={zone.name} position={sign} hidden={speaking} align={zone.id === "slides" ? "center" : "end"} />
      <ZoneKit zone={zone} />
      <SeatChairs zone={zone} />
      <ExtraDesks zone={zone} />
      <Plant
        position={at(zone.x + zone.width - 28, zone.id === "slides" ? zone.y + zone.height - 28 : zone.y + 30)}
        scale={zone.id === "slides" ? 1.2 : 1}
      />
    </group>
  );
}

function ZoneSign({
  text,
  position,
  hidden,
  align,
}: {
  text: string;
  position: [number, number, number];
  hidden: boolean;
  align: "center" | "end";
}) {
  return (
    <Html position={position} center zIndexRange={[3, 0]} style={{ pointerEvents: "none" }}>
      <div
        className="pointer-events-none whitespace-nowrap rounded bg-white/80 px-1 py-px text-[9px] font-medium tracking-wide text-slate-500"
        style={{ opacity: hidden ? 0 : 1, transform: align === "end" ? "translateX(-42%)" : undefined }}
      >
        {text}
      </div>
    </Html>
  );
}

function ZoneWalls({ zone }: { zone: PlacedZone }) {
  const door = boundaryToward(zone, commandCenter());
  const center = { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
  const openX = Math.abs(door.x - center.x) > Math.abs(door.y - center.y);
  const openPositive = openX ? door.x > center.x : door.y > center.y;
  const [x0, , z0] = svgToWorld({ x: zone.x, y: zone.y });
  const [x1, , z1] = svgToWorld({ x: zone.x + zone.width, y: zone.y + zone.height });
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minZ = Math.min(z0, z1);
  const maxZ = Math.max(z0, z1);
  const t = 0.07;
  const walls: Array<{ pos: [number, number, number]; size: [number, number, number]; fade: boolean }> = [];
  const span = (full: number, gap: boolean) => (gap ? full * 0.34 : full);
  const pushEdge = (axis: "x" | "z", atEdge: number, positive: boolean) => {
    const gap = (axis === "x") === openX && positive === openPositive;
    const facingCamera = (axis === "z" && positive) || (axis === "x" && positive);
    const h = facingCamera ? 0.3 : 0.45;
    const piece = (pos: [number, number, number], size: [number, number, number]) => {
      walls.push({ pos, size, fade: facingCamera });
    };
    if (axis === "z") {
      const full = maxX - minX;
      const length = span(full, gap);
      const shift = gap ? full * 0.3 : 0;
      piece([minX + full / 2 - shift, h / 2, atEdge], [length, h, t]);
      if (gap) piece([minX + full / 2 + shift, h / 2, atEdge], [length, h, t]);
    } else {
      const full = maxZ - minZ;
      const length = span(full, gap);
      const shift = gap ? full * 0.3 : 0;
      piece([atEdge, h / 2, minZ + full / 2 - shift], [t, h, length]);
      if (gap) piece([atEdge, h / 2, minZ + full / 2 + shift], [t, h, length]);
    }
  };
  pushEdge("z", minZ, false);
  pushEdge("z", maxZ, true);
  pushEdge("x", minX, false);
  pushEdge("x", maxX, true);
  return (
    <group>
      {walls.map((wall, index) => (
        <mesh key={index} position={wall.pos} castShadow={!wall.fade} receiveShadow>
          <boxGeometry args={wall.size} />
          <meshLambertMaterial color="#F4F1EC" transparent={wall.fade} opacity={wall.fade ? 0.35 : 1} depthWrite={!wall.fade} />
        </mesh>
      ))}
    </group>
  );
}

function SeatChairs({ zone }: { zone: PlacedZone }) {
  const seats = staticOffice.layout.seats.filter((seat) => seat.zoneId === zone.id);
  return (
    <group>
      {seats.map((seat) => (
        <Chair key={seat.agentId} position={at(seat.x, seat.y - 20)} />
      ))}
    </group>
  );
}

function ExtraDesks({ zone }: { zone: PlacedZone }) {
  const count = staticOffice.layout.seats.filter((seat) => seat.zoneId === zone.id).length;
  const extra = stationsFor(zone, count).slice(1);
  return (
    <group>
      {extra.map((spot) => (
        <group key={`${spot.desk.x}-${spot.desk.y}`}>
          <Desk position={at(spot.desk.x, spot.desk.y)} />
          <Monitor position={at(spot.desk.x, spot.desk.y - 6, 0.75)} />
        </group>
      ))}
    </group>
  );
}

function ZoneKit({ zone }: { zone: PlacedZone }) {
  const count = Math.max(1, staticOffice.layout.seats.filter((seat) => seat.zoneId === zone.id).length);
  const primary = stationsFor(zone, count)[0];
  const midX = primary.desk.x;
  const deskY = primary.desk.y;
  const backY = zone.y + 34;
  if (zone.id === "slides") return <SlidesRoom zone={zone} />;
  if (zone.id === "command") return <CommandRoom zone={zone} />;
  if (zone.id === "research") {
    return (
      <group>
        <Desk position={at(midX, deskY)} />
        <Desk position={at(midX + 78, deskY)} size={[0.7, 0.08, 0.55]} />
        <Monitor position={at(midX - 12, deskY - 8, 0.75)} />
        <Monitor position={at(midX + 16, deskY - 8, 0.75)} />
        <FilingCabinet position={at(zone.x + 36, backY)} />
        <FilingCabinet position={at(zone.x + 78, backY)} />
        <FilingCabinet position={at(zone.x + 120, backY)} />
        <Globe position={at(midX + 48, deskY, 0.82)} />
      </group>
    );
  }
  if (zone.id === "writing") {
    return (
      <group>
        <Desk position={at(midX, deskY)} />
        <Monitor position={at(midX, deskY - 6, 0.75)} wide />
        <BookShelf position={at(zone.x + zone.width - 48, backY + 10)} />
        <Block position={at(midX + 28, deskY, 0.8)} size={[0.16, 0.04, 0.12]} color="#F4F1EC" />
        <mesh position={at(midX - 24, deskY, 0.84)}>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 8]} />
          <meshLambertMaterial color="#F7D3DD" />
        </mesh>
      </group>
    );
  }
  if (zone.id === "editing") {
    return (
      <group>
        <Desk position={at(midX, deskY)} size={[1.35, 0.08, 0.66]} />
        <Block position={at(midX - 10, deskY, 0.82)} size={[0.22, 0.08, 0.16]} color="#F4F1EC" />
        <mesh position={at(midX + 16, deskY, 0.84)} rotation={[0, 0, 0.6]}>
          <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
          <meshLambertMaterial color="#E11D48" />
        </mesh>
        <CorkBoard position={at(midX, backY, 0.7)} />
        <Block position={at(zone.x + 28, deskY + 20, 0.12)} size={[0.22, 0.16, 0.22]} color="#F8E3C2" />
        <Block position={at(zone.x + zone.width - 28, deskY + 20, 0.12)} size={[0.22, 0.16, 0.22]} color="#E7E1D8" />
      </group>
    );
  }
  if (zone.id === "studio") {
    return (
      <group>
        <Desk position={at(midX, deskY)} size={[0.95, 0.08, 0.55]} />
        <Monitor position={at(midX, deskY - 6, 0.75)} />
        <Easel position={at(midX - 10, backY + 16)} />
        <mesh position={at(midX + 36, deskY, 0.8)} rotation={[-Math.PI / 2, 0, 0.4]}>
          <cylinderGeometry args={[0.12, 0.12, 0.03, 10]} />
          <meshLambertMaterial color="#F4F1EC" />
        </mesh>
        {["#F7D3DD", "#CDE8F2", "#F8E3C2"].map((color, index) => (
          <mesh key={color} position={at(zone.x + 30 + index * 16, backY + 8, 0.1)}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
            <meshLambertMaterial color={color} />
          </mesh>
        ))}
      </group>
    );
  }
  if (zone.id === "review") {
    return (
      <group>
        <Desk position={at(midX, deskY)} size={[1.3, 0.08, 0.7]} />
        <mesh position={at(midX, deskY, 0.8)}>
          <boxGeometry args={[0.7, 0.04, 0.4]} />
          <meshLambertMaterial color="#F4F1EC" emissive="#9FD8FF" emissiveIntensity={0.45} />
        </mesh>
        {Array.from({ length: 4 }).map((_, index) => (
          <Block key={index} position={at(zone.x + 24 + index * 22, backY, 0.55)} size={[0.16, 0.12, 0.02]} color={index % 2 ? "#E2D6F2" : "#F7D3DD"} radius={0.01} />
        ))}
      </group>
    );
  }
  if (zone.id === "workstation") {
    return (
      <group>
        <Desk position={at(midX, deskY)} size={[1.5, 0.08, 0.62]} />
        <Monitor position={at(midX - 16, deskY - 4, 0.75)} />
        <Block position={at(zone.x + zone.width - 30, backY, 0.28)} size={[0.22, 0.5, 0.28]} color="#2E3138" />
        <mesh position={at(zone.x + zone.width - 30, backY + 2, 0.55)}>
          <boxGeometry args={[0.04, 0.28, 0.02]} />
          <meshLambertMaterial color="#9FD8FF" emissive="#9FD8FF" emissiveIntensity={0.6} />
        </mesh>
      </group>
    );
  }
  if (zone.id === "lab") {
    return (
      <group>
        <Desk position={at(midX, deskY)} size={[1.2, 0.08, 0.6]} />
        <RobotArm position={at(zone.x + zone.width - 52, backY)} />
        <Block position={at(zone.x + 32, backY, 0.4)} size={[0.4, 0.7, 0.22]} color="#F4F1EC" />
        <mesh position={at(midX + 10, deskY, 0.86)}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshLambertMaterial color="#F8FAFC" />
        </mesh>
        <mesh position={at(midX, zone.y + zone.height * 0.62, 0.02)} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[worldLen(zone.width * 0.7), 0.08]} />
          <meshLambertMaterial color="#F5D76E" />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <Desk position={at(midX, deskY)} />
      <Monitor position={at(midX, deskY - 6, 0.75)} />
    </group>
  );
}

function CommandRoom({ zone }: { zone: PlacedZone }) {
  const spot = stationsFor(zone, 1)[0];
  const hub = at(spot.desk.x, spot.desk.y);
  return (
    <group>
      <mesh position={[hub[0], 0.02, hub[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.78, 6]} />
        <meshLambertMaterial color="#7DD3C7" emissive="#7DD3C7" emissiveIntensity={0.35} />
      </mesh>
      <Block position={[hub[0], 0.42, hub[2]]} size={[0.9, 0.7, 0.9]} color="#C89F74" />
      {[-0.7, 0, 0.7].map((offset) => (
        <group key={offset} position={[hub[0] + offset, 0, hub[2] - 0.15]} rotation={[0, offset * -0.35, 0]}>
          <Block position={[0, 0.95, 0]} size={[0.42, 0.28, 0.04]} color="#2E3138" radius={0.02} />
          <mesh position={[0, 0.95, 0.03]}>
            <planeGeometry args={[0.34, 0.2]} />
            <meshLambertMaterial color="#9FD8FF" emissive="#9FD8FF" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={at(spot.seat.x + 28, spot.seat.y - 10, 0.35)}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
      <mesh position={at(spot.seat.x + 28, spot.seat.y - 10, 0.56)}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshLambertMaterial color="#CFEFEA" />
      </mesh>
    </group>
  );
}

function SlidesRoom({ zone }: { zone: PlacedZone }) {
  const anchor = at(zone.x + zone.width * 0.5, zone.y + 30);
  const podium = stationsFor(zone, 1)[0];
  const screen: [number, number, number] = [anchor[0], 1 + 0.85, anchor[2]];
  const bars = [
    { h: 0.7, color: "#8B5CF6" },
    { h: 1.15, color: "#A78BFA" },
    { h: 0.85, color: "#C4B5FD" },
  ];
  return (
    <group>
      <mesh position={screen} castShadow>
        <boxGeometry args={[Math.min(3, worldLen(zone.width * 0.4)), 1.15, 0.06]} />
        <meshLambertMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.25} />
      </mesh>
      {bars.map((bar, index) => (
        <mesh key={bar.color} position={[screen[0] - 0.7 + index * 0.7, 1 + bar.h / 2, screen[2] + 0.04]}>
          <boxGeometry args={[0.32, bar.h, 0.02]} />
          <meshLambertMaterial color={bar.color} />
        </mesh>
      ))}
      {[0.7, 1.15].map((dz) =>
        [-0.7, 0, 0.7].map((dx) => (
          <Chair key={`${dz}-${dx}`} position={[screen[0] + dx, 0, screen[2] + dz]} />
        )),
      )}
      <Lectern position={at(podium.desk.x, podium.desk.y)} />
    </group>
  );
}

function Lectern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0.48, 0]} size={[0.42, 0.9, 0.36]} color="#C89F74" />
      <mesh position={[0, 0.96, 0.04]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.06, 0.28]} />
        <meshLambertMaterial color="#E7D3B5" />
      </mesh>
      <mesh position={[0, 0.99, 0.05]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.22, 0.01, 0.16]} />
        <meshLambertMaterial color="#F4F1EC" />
      </mesh>
    </group>
  );
}


function Globe({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshLambertMaterial color="#CDE8F2" />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
    </group>
  );
}

function ReservedPods() {
  const speaking = useOfficeStore((state) => Array.from(state.agents.values()).some((agent) => agent.speechBubble));
  return (
    <group>
      {layout.reserved.map((slot) => {
        const desk = at(slot.x + slot.width / 2, slot.y + slot.height * 0.42);
        const chair = at(slot.x + slot.width / 2, slot.y + slot.height * 0.42 + 36);
        return (
          <group key={`${slot.col}-${slot.row}`}>
            <DashOutline
              corners={[
                { x: slot.x + 14, y: slot.y + 14 },
                { x: slot.x + slot.width - 14, y: slot.y + 14 },
                { x: slot.x + slot.width - 14, y: slot.y + slot.height - 14 },
                { x: slot.x + 14, y: slot.y + slot.height - 14 },
              ]}
            />
            <Desk position={desk} />
            <Chair position={chair} />
            <ZoneSign text="預留擴充" position={at(slot.x + slot.width / 2, slot.y + slot.height * 0.72, 0.2)} hidden={speaking} align="center" />
          </group>
        );
      })}
    </group>
  );
}

function DashOutline({ corners }: { corners: Array<{ x: number; y: number }> }) {
  return (
    <group>
      {corners.map((start, index) => (
        <DashEdge key={index} a={start} b={corners[(index + 1) % corners.length]} />
      ))}
    </group>
  );
}

function DashEdge({ a, b }: { a: { x: number; y: number }; b: { x: number; y: number } }) {
  const [ax, , az] = svgToWorld(a);
  const [bx, , bz] = svgToWorld(b);
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  const dash = 0.22;
  const gap = 0.16;
  const step = dash + gap;
  const count = Math.max(1, Math.floor(len / step));
  const ux = dx / (len || 1);
  const uz = dz / (len || 1);
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const distance = (index + 0.5) * step;
        if (distance > len) return null;
        return (
          <mesh
            key={index}
            position={[ax + ux * distance, 0.025, az + uz * distance]}
            rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]}
          >
            <planeGeometry args={[Math.min(dash, len), 0.045]} />
            <meshBasicMaterial color="#CDBBA2" transparent opacity={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Lounge() {
  const floor = occupiedFloor();
  const frontY = floor.svg.maxZoneY + 62;
  const sofa = at(floor.svg.x + 150, frontY);
  const bar = at(floor.svg.x + floor.svg.width - 170, frontY);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[sofa[0], 0.015, sofa[2]]} receiveShadow>
        <planeGeometry args={[2.4, 1.5]} />
        <meshLambertMaterial color="#FBE6CF" />
      </mesh>
      <Sofa position={[sofa[0] - 0.45, 0, sofa[2]]} />
      <Sofa position={[sofa[0] + 0.55, 0, sofa[2] + 0.35]} rotation={-Math.PI / 2} />
      <Block position={[sofa[0], 0.18, sofa[2] + 0.15]} size={[0.55, 0.28, 0.4]} color="#C89F74" />
      <FloorLamp position={[sofa[0] - 1.05, 0, sofa[2] - 0.2]} />
      <Block position={[sofa[0] + 1.7, 0.28, sofa[2] + 0.15]} size={[0.7, 0.42, 0.22]} color="#C89F74" />
      <Block position={[sofa[0] + 2.55, 0.42, sofa[2]]} size={[0.55, 0.78, 0.4]} color="#C89F74" />
      <mesh position={[sofa[0] + 2.35, 0.28, sofa[2] + 0.28]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshLambertMaterial color="#F4D2B0" />
      </mesh>
      <mesh position={[sofa[0] + 2.75, 0.28, sofa[2] + 0.28]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshLambertMaterial color="#F4D2B0" />
      </mesh>
      <Block position={bar} size={[1.3, 0.72, 0.4]} color="#C89F74" />
      <CoffeeMachine position={[bar[0] - 0.3, 0.72, bar[2]]} />
      <Plant position={[bar[0] + 0.85, 0, bar[2]]} scale={1.4} />
    </group>
  );
}
