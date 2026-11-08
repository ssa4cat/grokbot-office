import { Html } from "@react-three/drei";
import { staticOffice, svgToWorld, type Furnishing, type PlacedZone } from "@/data/layout-office";
import type { ThemeMode } from "@/gateway/types";

const layout = staticOffice.layout;

function worldSize(width: number, height: number): [number, number] {
  return [(width / layout.width) * 18, (height / layout.height) * layout.worldDepth];
}

export function GrokRoom3D({ theme }: { theme: ThemeMode }) {
  const dark = theme === "dark";
  const floor = dark ? "#1e293b" : "#f4f8fc";
  const wall = dark ? "#243044" : "#f8fbff";
  const depth = layout.worldDepth;
  const width = 18;

  return (
    <group>
      <hemisphereLight args={[dark ? "#7dd3fc" : "#e0f2fe", dark ? "#44403c" : "#fff7ed", dark ? 0.45 : 0.85]} />
      <ambientLight intensity={dark ? 0.35 : 0.55} color="#ffffff" />
      <directionalLight
        position={[8, 16, 10]}
        intensity={dark ? 0.8 : 1.25}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        color="#fffaf3"
      />
      <pointLight position={[width / 2, 2.2, 0.6]} intensity={1.4} color="#7dd3fc" distance={10} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, -0.06, depth / 2]} receiveShadow>
        <planeGeometry args={[width + 6, depth + 6]} />
        <meshStandardMaterial color={dark ? "#0f172a" : "#dbeafe"} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floor} roughness={0.85} />
      </mesh>

      <mesh position={[width / 2, 1.35, 0.08]} castShadow>
        <boxGeometry args={[width, 2.7, 0.12]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[0.06, 1.35, depth / 2]}>
        <boxGeometry args={[0.12, 2.7, depth]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      {Array.from({ length: 5 }).map((_, index) => (
        <mesh key={`window-${index}`} position={[2.2 + index * 3.1, 1.7, 0.16]}>
          <planeGeometry args={[2.1, 1.15]} />
          <meshStandardMaterial color="#b9e6ff" emissive="#7dd3fc" emissiveIntensity={dark ? 0.35 : 0.55} />
        </mesh>
      ))}
      <mesh position={[width / 2, 2.55, 0.18]}>
        <boxGeometry args={[width * 0.46, 0.06, 0.04]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>
      <Html position={[width / 2, 2.15, 0.24]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontWeight: 800,
            letterSpacing: "0.28em",
            fontSize: 22,
            color: dark ? "#e0f2fe" : "#0369a1",
            textShadow: "0 0 12px rgba(34,211,238,0.85)",
            whiteSpace: "nowrap",
          }}
        >
          {layout.title}
        </div>
      </Html>

      {layout.zones.map((zone) => (
        <Zone3D key={zone.id} zone={zone} dark={dark} />
      ))}
      <Amenity3D dark={dark} />
    </group>
  );
}

function Zone3D({ zone, dark }: { zone: PlacedZone; dark: boolean }) {
  const [cx, , cz] = svgToWorld({ x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 });
  const [zw, zd] = worldSize(zone.width - 8, zone.height - 8);
  const [dx, , dz] = svgToWorld({ x: zone.x + zone.width / 2, y: zone.y + zone.height * 0.46 });
  const [lx, , lz] = svgToWorld({ x: zone.x + 36, y: zone.y + 28 });
  const [px, , pz] = svgToWorld({ x: zone.x + zone.width - 28, y: zone.y + zone.height - 30 });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.012, cz]} receiveShadow>
        <planeGeometry args={[zw, zd]} />
        <meshStandardMaterial color={zone.accent} transparent opacity={dark ? 0.22 : 0.14} />
      </mesh>
      <Html position={[lx, 0.05, lz]} center style={{ pointerEvents: "none" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: zone.accent, whiteSpace: "nowrap" }}>{zone.name}</div>
      </Html>
      {zone.furnishing === "command" ? (
        <CommandPad position={[dx, 0, dz]} accent={zone.accent} />
      ) : zone.furnishing === "slides" ? (
        <SlideDeck position={[dx, 0, dz]} accent={zone.accent} />
      ) : (
        <DeskSet position={[dx, 0, dz]} accent={zone.accent} kind={zone.furnishing} dark={dark} />
      )}
      <Plant3D position={[px, 0, pz]} />
    </group>
  );
}

function DeskSet({
  position,
  accent,
  kind,
  dark,
}: {
  position: [number, number, number];
  accent: string;
  kind: Furnishing;
  dark: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.06, 0.7]} />
        <meshStandardMaterial color={dark ? "#334155" : "#ffffff"} roughness={0.45} />
      </mesh>
      {[
        [-0.58, 0.18, -0.28],
        [0.58, 0.18, -0.28],
        [-0.58, 0.18, 0.28],
        [0.58, 0.18, 0.28],
      ].map((leg) => (
        <mesh key={leg.join(",")} position={leg as [number, number, number]}>
          <boxGeometry args={[0.05, 0.36, 0.05]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, -0.18]} castShadow>
        <boxGeometry args={[0.72, 0.42, 0.03]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.78, -0.155]}>
        <planeGeometry args={[0.64, 0.34]} />
        <meshStandardMaterial color="#e0f2fe" emissive={accent} emissiveIntensity={0.55} />
      </mesh>
      {kind === "lab" && (
        <mesh position={[0.55, 0.52, 0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#fff" emissive={accent} emissiveIntensity={0.25} />
        </mesh>
      )}
    </group>
  );
}

function SlideDeck({ position, accent }: { position: [number, number, number]; accent: string }) {
  return (
    <group position={position}>
      <mesh position={[-1.4, 0.85, 0]} castShadow>
        <boxGeometry args={[1.8, 1.05, 0.04]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-1.4, 0.85, 0.03]}>
        <planeGeometry args={[1.6, 0.88]} />
        <meshStandardMaterial color="#f5f3ff" emissive={accent} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[1.15, 0.55, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.03]} />
        <meshStandardMaterial color="#faf5ff" emissive={accent} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function CommandPad({ position, accent }: { position: [number, number, number]; accent: string }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.35]}>
        <ringGeometry args={[0.28, 0.48, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 0.95, -0.15]}>
        <planeGeometry args={[0.85, 0.62]} />
        <meshStandardMaterial color="#ecfeff" emissive="#67e8f9" emissiveIntensity={0.7} transparent opacity={0.92} side={2} />
      </mesh>
    </group>
  );
}

function Plant3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.16, 8]} />
        <meshStandardMaterial color="#e7c3a0" />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <mesh position={[0.08, 0.32, 0.02]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  );
}

function Amenity3D({ dark }: { dark: boolean }) {
  const amenity = layout.amenity;
  const [sx, , sz] = svgToWorld({ x: amenity.x + 110, y: amenity.y + amenity.height * 0.62 });
  const [cx, , cz] = svgToWorld({ x: amenity.x + amenity.width - 160, y: amenity.y + amenity.height * 0.62 });
  return (
    <group>
      <group position={[sx, 0, sz]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[1.3, 0.28, 0.5]} />
          <meshStandardMaterial color={dark ? "#44403c" : "#ffffff"} />
        </mesh>
        <mesh position={[0, 0.42, -0.18]}>
          <boxGeometry args={[1.3, 0.28, 0.12]} />
          <meshStandardMaterial color={dark ? "#57534e" : "#fff7ed"} />
        </mesh>
        <mesh position={[-0.28, 0.38, 0.02]}>
          <boxGeometry args={[0.36, 0.08, 0.32]} />
          <meshStandardMaterial color="#fb923c" />
        </mesh>
        <mesh position={[0.28, 0.38, 0.02]}>
          <boxGeometry args={[0.36, 0.08, 0.32]} />
          <meshStandardMaterial color="#fdba74" />
        </mesh>
      </group>
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[1.5, 0.7, 0.45]} />
          <meshStandardMaterial color={dark ? "#292524" : "#fff"} />
        </mesh>
        <mesh position={[-0.4, 0.82, 0]}>
          <boxGeometry args={[0.28, 0.22, 0.22]} />
          <meshStandardMaterial color="#44403c" />
        </mesh>
        <mesh position={[-0.4, 0.96, 0.08]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  );
}
