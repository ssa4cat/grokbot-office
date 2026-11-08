import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { staticOffice, svgToWorld, WORLD_WIDTH } from "@/data/layout-office";
import { handoffPoints } from "./walkways";
import { useOfficeStore } from "@/store/office-store";
import { AgentCharacter } from "./AgentCharacter";
import { GrokRoom3D } from "./GrokRoom3D";

const BG_LIGHT = new THREE.Color("#EEF0F3");
const BG_DARK = new THREE.Color("#1c1917");

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

function flowPoints(sourceId: string, targetId: string): Array<[number, number, number]> {
  return handoffPoints(sourceId, targetId).map((point) => {
    const [x, , z] = svgToWorld(point);
    return [x, 0.08, z];
  });
}

function CollabLines() {
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const activeHandoff = useOfficeStore((s) => s.activeHandoff);

  const curves = useMemo(() => {
    return links.flatMap((link) => {
      const source = agents.get(link.sourceId);
      const target = agents.get(link.targetId);
      if (!source || !target) return [];
      const points = flowPoints(link.sourceId, link.targetId);
      if (points.length < 2) return [];
      const hot =
        (activeHandoff?.sourceId === link.sourceId && activeHandoff.targetId === link.targetId) ||
        selectedAgentId === link.sourceId ||
        selectedAgentId === link.targetId;
      const tip = points[Math.max(0, points.length - 2)];
      return [{
        key: `${link.pipeline ?? "article"}-${link.sourceId}-${link.targetId}-${link.kind ?? "flow"}`,
        points,
        color: hot ? "#C4B5FD" : "#A78BFA",
        opacity: hot ? 1 : 0.6,
        width: hot ? 2.4 : 1,
        dashed: link.kind === "return",
        tip,
      }];
    });
  }, [agents, links, selectedAgentId, activeHandoff]);

  return (
    <group>
      {curves.map((curve) => (
        <group key={curve.key}>
          <Line points={curve.points} color={curve.color} lineWidth={curve.width} transparent opacity={curve.opacity} dashed={curve.dashed} dashSize={0.08} gapSize={0.06} />
          <mesh position={curve.tip}>
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
        minPolarAngle={0.72}
        maxPolarAngle={1.2}
        minDistance={8}
        maxDistance={36}
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
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{
          fov: 32,
          position: [WORLD_WIDTH * 0.15, depth * 0.72, depth * 1.22],
          near: 0.1,
          far: 120,
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
