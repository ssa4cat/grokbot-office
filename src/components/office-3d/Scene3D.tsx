import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { staticOffice, svgToWorld, WORLD_WIDTH } from "@/data/layout-office";
import { useOfficeStore } from "@/store/office-store";
import { AgentCharacter } from "./AgentCharacter";
import { GrokRoom3D } from "./GrokRoom3D";

const BG_LIGHT = new THREE.Color("#d7ecfb");
const BG_DARK = new THREE.Color("#0b1220");

function BackgroundSync() {
  const theme = useOfficeStore((s) => s.theme);
  const { gl } = useThree();
  const colorRef = useRef(new THREE.Color(theme === "light" ? BG_LIGHT : BG_DARK));

  useEffect(() => {
    gl.setClearColor(colorRef.current);
  }, [gl]);

  useFrame(() => {
    const target = theme === "light" ? BG_LIGHT : BG_DARK;
    colorRef.current.lerp(target, 0.05);
    gl.setClearColor(colorRef.current);
  });

  return null;
}

function CollabLines() {
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);

  const curves = useMemo(() => {
    return links.flatMap((link) => {
      const source = agents.get(link.sourceId);
      const target = agents.get(link.targetId);
      if (!source || !target) return [];
      const [x1, , z1] = svgToWorld(source.position);
      const [x2, , z2] = svgToWorld(target.position);
      const returning = link.kind === "return";
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const dist = Math.hypot(dx, dz) || 1;
      const bend = (returning ? -0.35 : 0.35) * Math.min(dist, 2.4);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, 0.35, z1),
        new THREE.Vector3(midX - (dz / dist) * bend, 0.9, midZ + (dx / dist) * bend),
        new THREE.Vector3(x2, 0.35, z2),
      );
      const points = curve.getPoints(28).map((point) => [point.x, point.y, point.z] as [number, number, number]);
      const tip = curve.getPoint(0.9);
      return [{ key: `${link.sourceId}-${link.targetId}-${link.kind ?? "flow"}`, points, color: returning ? "#fb923c" : "#22d3ee", dashed: returning, tip }];
    });
  }, [agents, links]);

  return (
    <group>
      {curves.map((curve) => (
        <group key={curve.key}>
          <Line points={curve.points} color={curve.color} lineWidth={curve.dashed ? 2 : 3} dashed={curve.dashed} dashSize={0.12} gapSize={0.08} />
          <mesh position={[curve.tip.x, curve.tip.y, curve.tip.z]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={curve.color} emissive={curve.color} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SceneContent() {
  const agents = useOfficeStore((s) => s.agents);
  const theme = useOfficeStore((s) => s.theme);
  const agentList = Array.from(agents.values()).filter((agent) => !agent.isPlaceholder);
  const depth = staticOffice.layout.worldDepth;
  const target: [number, number, number] = [WORLD_WIDTH / 2, 0.3, depth * 0.58];

  return (
    <>
      <BackgroundSync />
      <OrbitControls
        enableRotate
        enablePan
        enableZoom
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={6}
        maxDistance={28}
        target={target}
        enableDamping
        dampingFactor={0.08}
      />
      <GrokRoom3D theme={theme} />
      <CollabLines />
      {agentList.map((agent) => (
        <AgentCharacter key={agent.id} agent={agent} />
      ))}
    </>
  );
}

export default function Scene3D() {
  const depth = staticOffice.layout.worldDepth;
  return (
    <div className="h-full w-full">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        shadows
        camera={{
          fov: 38,
          position: [WORLD_WIDTH * 0.95, depth * 1.55, depth * 1.55],
          near: 0.1,
          far: 100,
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
