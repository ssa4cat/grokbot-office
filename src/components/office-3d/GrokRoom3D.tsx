import { Html } from "@react-three/drei";
import { staticOffice, svgToWorld, type PlacedZone } from "@/data/layout-office";
import type { ThemeMode } from "@/gateway/types";
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
import { boundaryToward, commandCenter, standPoint, walkSegments } from "./walkways";

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
  const [floorX, , floorZ] = at(layout.width / 2, layout.height / 2);
  const floorW = 18.6;
  const floorD = (layout.height / layout.width) * 18 + 1.2;
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
      <mesh position={[floorX, 0.04, floorZ - floorD / 2]} receiveShadow>
        <boxGeometry args={[floorW, 0.08, 0.08]} />
        <meshLambertMaterial color="#CDBBA2" />
      </mesh>

      <mesh position={[floorX, 1.25, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[floorW, 2.5, 0.12]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh position={[0.04, 1.25, floorZ]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 2.5, floorD]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      {Array.from({ length: 5 }).map((_, index) => (
        <mesh key={index} position={[1.8 + index * 3.2, 1.65, 0.14]}>
          <planeGeometry args={[2.0, 1.05]} />
          <meshLambertMaterial color="#D7E8F5" emissive="#FFE2B8" emissiveIntensity={0.18} />
        </mesh>
      ))}
      <Html position={[floorW * 0.55, 2.15, 0.2]} center style={{ pointerEvents: "none" }}>
        <div style={{ fontWeight: 800, letterSpacing: "0.22em", fontSize: 18, color: "#0369a1" }}>{layout.title}</div>
      </Html>
      <Html position={[floorW * 0.22, 1.7, 0.2]} center style={{ pointerEvents: "none" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b6258" }}>09:41</div>
      </Html>

      {walkSegments().map((segment, index) => (
        <WalkStrip key={index} a={segment.a} b={segment.b} width={segment.width} />
      ))}

      {layout.zones.map((zone) => (
        <ZoneRoom key={zone.id} zone={zone} />
      ))}
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
  const sign = at(zone.x + 36, zone.y + 22, 0.46);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.012, cz]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshLambertMaterial color={rug} />
      </mesh>
      <ZoneWalls zone={zone} />
      <Html position={sign} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: rug,
            color: "#3f3a34",
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
          }}
        >
          {zone.name}
        </div>
      </Html>
      <ZoneKit zone={zone} />
      <Plant position={at(zone.x + zone.width - 28, zone.y + 30)} scale={zone.id === "slides" ? 1.35 : 1} />
    </group>
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

function ZoneKit({ zone }: { zone: PlacedZone }) {
  const midX = zone.x + zone.width / 2;
  const deskY = zone.y + zone.height * 0.4;
  const backY = zone.y + 34;
  if (zone.id === "slides") return <SlidesRoom zone={zone} />;
  if (zone.id === "command") return <CommandRoom zone={zone} />;
  if (zone.id === "research") {
    return (
      <group>
        <Desk position={at(midX - 28, deskY)} />
        <Desk position={at(midX + 36, deskY)} size={[0.7, 0.08, 0.55]} />
        <Monitor position={at(midX - 36, deskY - 8, 0.75)} />
        <Monitor position={at(midX - 8, deskY - 8, 0.75)} />
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
        <Chair position={at(midX - 36, deskY + 28)} rotation={Math.PI} />
        <Chair position={at(midX + 36, deskY + 28)} rotation={Math.PI} />
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
        <Desk position={at(midX - 16, deskY)} size={[1.2, 0.08, 0.6]} />
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
  const spot = standPoint(zone);
  const hub = at(zone.x + zone.width / 2, zone.y + zone.height * 0.46);
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
      <mesh position={at(spot.x + 28, spot.y - 10, 0.35)}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
      <mesh position={at(spot.x + 28, spot.y - 10, 0.56)}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshLambertMaterial color="#CFEFEA" />
      </mesh>
    </group>
  );
}

function SlidesRoom({ zone }: { zone: PlacedZone }) {
  const anchor = at(zone.x + zone.width * 0.5, zone.y + 30);
  const screen: [number, number, number] = [anchor[0], 1 + 0.85, anchor[2]];
  const bars = [
    { h: 0.7, color: "#8B5CF6" },
    { h: 1.15, color: "#A78BFA" },
    { h: 0.85, color: "#C4B5FD" },
  ];
  return (
    <group>
      <mesh position={screen} castShadow>
        <boxGeometry args={[3, 1.7, 0.06]} />
        <meshLambertMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.25} />
      </mesh>
      {bars.map((bar, index) => (
        <mesh key={bar.color} position={[screen[0] - 0.7 + index * 0.7, 1 + bar.h / 2, screen[2] + 0.04]}>
          <boxGeometry args={[0.32, bar.h, 0.02]} />
          <meshLambertMaterial color={bar.color} />
        </mesh>
      ))}
      {[1.25, 1.9].map((dz) =>
        [-1.15, -0.5, 0.95].map((dx) => (
          <Chair key={`${dz}-${dx}`} position={[screen[0] + dx, 0, screen[2] + dz]} />
        )),
      )}
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

function Lounge() {
  const amenity = layout.amenity;
  const sofa = at(amenity.x + 120, amenity.y + amenity.height * 0.62);
  const bar = at(amenity.x + amenity.width - 180, amenity.y + amenity.height * 0.55);
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
      <Block position={bar} size={[1.3, 0.72, 0.4]} color="#C89F74" />
      <CoffeeMachine position={[bar[0] - 0.3, 0.72, bar[2]]} />
      <Plant position={[bar[0] + 0.85, 0, bar[2]]} scale={1.4} />
    </group>
  );
}
