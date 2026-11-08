import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { linkAppearance, staticOffice, svgToWorld, WORLD_WIDTH } from "@/data/layout-office";
import { handoffPoints, occupiedFloor } from "./walkways";
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
    return [x, 0.05, z];
  });
}

function FlowRibbon({
  points,
  color,
  opacity,
  width,
  dashed,
  hot,
}: {
  points: Array<[number, number, number]>;
  color: string;
  opacity: number;
  width: number;
  dashed?: boolean;
  hot?: boolean;
}) {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const angle = prev && last ? Math.atan2(last[0] - prev[0], last[2] - prev[2]) : 0;
  return (
    <group>
      {points.slice(0, -1).map((start, index) => {
        const end = points[index + 1];
        const dx = end[0] - start[0];
        const dz = end[2] - start[2];
        const len = Math.hypot(dx, dz);
        if (len < 0.04) return null;
        const pieces = dashed ? Math.max(1, Math.round(len / 0.28)) : 1;
        return (
          <group key={index}>
            {Array.from({ length: pieces }, (_, piece) => {
              if (dashed && piece % 2 === 1) return null;
              const span = len / pieces;
              const along = (piece + 0.5) * span;
              return (
                <mesh
                  key={piece}
                  position={[start[0] + (dx / len) * along, 0.05, start[2] + (dz / len) * along]}
                  rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]}
                >
                  <planeGeometry args={[dashed ? span * 0.62 : len, width]} />
                  <meshLambertMaterial color={color} transparent opacity={opacity} depthWrite={false} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {hot && last && (
        <mesh position={[last[0], 0.06, last[2]]} rotation={[-Math.PI / 2, 0, -angle]}>
          <coneGeometry args={[width * 1.4, width * 2.4, 3]} />
          <meshLambertMaterial color={color} />
        </mesh>
      )}
    </group>
  );
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
      const look = linkAppearance(link);
      const hot =
        (activeHandoff?.sourceId === link.sourceId && activeHandoff.targetId === link.targetId) ||
        selectedAgentId === link.sourceId ||
        selectedAgentId === link.targetId;
      return [{
        key: `${link.pipeline ?? "article"}-${link.sourceId}-${link.targetId}-${link.kind ?? "flow"}`,
        points,
        color: look.color,
        opacity: hot ? 1 : 0.35,
        width: hot ? 0.14 : 0.065,
        dashed: look.dashed,
        hot,
      }];
    });
  }, [agents, links, selectedAgentId, activeHandoff]);

  return (
    <group>
      {curves.map((curve) => (
        <group key={curve.key}>
          <FlowRibbon points={curve.points} color={curve.color} opacity={curve.opacity} width={curve.width} dashed={curve.dashed} hot={curve.hot} />
        </group>
      ))}
    </group>
  );
}

function floorFrame() {
  const floor = occupiedFloor();
  return { floorX: floor.centerX, floorZ: floor.centerZ, floorW: floor.floorW, floorD: floor.floorD };
}

function FitCamera() {
  const { camera, size } = useThree();
  const controls = useThree((state) => state.controls) as { target: THREE.Vector3; update: () => void } | null;
  const { floorX, floorZ, floorW, floorD } = floorFrame();

  useLayoutEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    if (!persp.isPerspectiveCamera) return;
    const center = new THREE.Vector3(floorX, 0.55, floorZ);
    const corners: THREE.Vector3[] = [];
    for (const y of [0, 1.35]) {
      for (const x of [floorX - floorW / 2, floorX + floorW / 2]) {
        for (const z of [floorZ - floorD / 2, floorZ + floorD / 2]) {
          corners.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    const elev = (38 * Math.PI) / 180;
    const azimuth = 0.62;
    const margin = 24;
    let lo = 8;
    let hi = 110;
    const place = (dist: number) => {
      persp.position.set(
        center.x + Math.cos(elev) * dist * Math.sin(azimuth),
        center.y + Math.sin(elev) * dist,
        center.z + Math.cos(elev) * dist * Math.cos(azimuth),
      );
      persp.lookAt(center);
      persp.updateProjectionMatrix();
      persp.updateMatrixWorld();
    };
    for (let i = 0; i < 24; i++) {
      const dist = (lo + hi) / 2;
      place(dist);
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const corner of corners) {
        const projected = corner.clone().project(persp);
        const sx = (projected.x * 0.5 + 0.5) * size.width;
        const sy = (-projected.y * 0.5 + 0.5) * size.height;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      const scale = Math.max((maxX - minX) / (size.width - margin * 2), (maxY - minY) / (size.height - margin * 2));
      const outside = minX < margin || minY < margin || maxX > size.width - margin || maxY > size.height - margin;
      if (outside || scale > 0.85) lo = dist;
      else hi = dist;
    }
    place(hi);
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  }, [camera, controls, floorD, floorW, floorX, floorZ, size.height, size.width]);

  return null;
}

function SceneContent() {
  const agents = useOfficeStore((s) => s.agents);
  const theme = useOfficeStore((s) => s.theme);
  const agentList = Array.from(agents.values()).filter((agent) => !agent.isPlaceholder);
  const { floorX, floorZ } = floorFrame();
  const target: [number, number, number] = [floorX, 0.55, floorZ];

  return (
    <>
      <BackgroundSync />
      <OrbitControls
        makeDefault
        enableRotate
        enablePan
        enableZoom
        minPolarAngle={0.7}
        maxPolarAngle={1.15}
        minDistance={10}
        maxDistance={120}
        target={target}
        enableDamping
        dampingFactor={0.08}
      />
      <FitCamera />
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
