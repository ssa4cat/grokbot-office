import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Group } from "three";
import { getProfile, svgToWorld, type Accessory } from "@/data/layout-office";
import type { VisualAgent } from "@/gateway/types";
import { useOfficeStore } from "@/store/office-store";
import { ErrorIndicator } from "./ErrorIndicator";
import { SkillHologram } from "./SkillHologram";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface AgentCharacterProps {
  agent: VisualAgent;
}

const MODEL_SCALE = 1.65;

export function AgentCharacter({ agent }: AgentCharacterProps) {
  const { t } = useTranslation("common");
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const tickMovement = useOfficeStore((s) => s.tickMovement);
  const [hovered, setHovered] = useState(false);
  const profile = getProfile(agent.id);
  const accent = profile?.accent ?? "#7dd3fc";
  const accessory = profile?.accessory ?? null;
  const isSelected = selectedAgentId === agent.id;
  const [targetX, , targetZ] = svgToWorld(agent.position);

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;
    const time = state.clock.elapsedTime;
    if (agent.movement) {
      tickMovement(agent.id, delta);
      const current = useOfficeStore.getState().agents.get(agent.id);
      if (current) {
        const [wx, , wz] = svgToWorld(current.position);
        const pos = groupRef.current.position;
        const lerp = Math.min(2.5 * delta, 0.1);
        pos.x += (wx - pos.x) * lerp;
        pos.z += (wz - pos.z) * lerp;
      }
      bodyRef.current.position.y = Math.abs(Math.sin(time * 8)) * 0.04;
      return;
    }
    const pos = groupRef.current.position;
    const lerp = 1 - Math.pow(0.05, delta);
    pos.x += (targetX - pos.x) * lerp;
    pos.z += (targetZ - pos.z) * lerp;
    bodyRef.current.position.y = Math.sin(time * 2) * 0.015;
  });

  const eye = agent.status === "idle" ? "#67e8f9" : accent;

  return (
    <group
      ref={groupRef}
      position={[targetX, 0, targetZ]}
      scale={MODEL_SCALE}
      onClick={(event) => {
        event.stopPropagation();
        selectAgent(agent.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <group ref={bodyRef}>
        {accessory === "cape" && (
          <mesh position={[0, 0.38, 0.06]} castShadow>
            <boxGeometry args={[0.36, 0.42, 0.02]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        )}
        <mesh position={[0, 0.32, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.2, 6, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.32} metalness={0.08} />
        </mesh>
        <AccessoryMark accessory={accessory} accent={accent} />
        <mesh position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.12} />
        </mesh>
        <mesh position={[-0.155, 0.62, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0.155, 0.62, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0.63, 0.12]}>
          <boxGeometry args={[0.18, 0.07, 0.03]} />
          <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.25} />
        </mesh>
        <mesh position={[-0.045, 0.635, 0.14]}>
          <sphereGeometry args={[0.02, 10, 10]} />
          <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0.045, 0.635, 0.14]}>
          <sphereGeometry args={[0.02, 10, 10]} />
          <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0.84, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.92, 0]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
        </mesh>
      </group>

      {agent.status === "thinking" && <ThinkingIndicator />}
      {agent.status === "tool_calling" && agent.currentTool && (
        <SkillHologram tool={{ name: agent.currentTool.name }} position={[0.35, 0.55, -0.2]} />
      )}
      {agent.status === "error" && <ErrorIndicator />}

      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 32]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
        </mesh>
      )}

      <Html position={[0, 1.15, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div className="pointer-events-none whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-center text-[11px] font-semibold text-slate-700 shadow">
          {agent.name}
          <span className="ml-1 font-normal text-slate-400">{t(`agent.statusLabels.${agent.status}`)}</span>
        </div>
      </Html>
    </group>
  );
}

function AccessoryMark({ accessory, accent }: { accessory: Accessory | null; accent: string }) {
  if (accessory === "cap") {
    return (
      <mesh position={[0.04, 0.76, 0.04]} rotation={[0.2, 0, 0.1]}>
        <boxGeometry args={[0.2, 0.05, 0.16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    );
  }
  if (accessory === "beret") {
    return (
      <mesh position={[0.03, 0.76, 0]} rotation={[0, 0, 0.2]}>
        <sphereGeometry args={[0.09, 12, 8]} />
        <meshStandardMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "goggles") {
    return (
      <mesh position={[0, 0.63, 0.15]}>
        <boxGeometry args={[0.2, 0.05, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
      </mesh>
    );
  }
  if (accessory === "badge") {
    return (
      <mesh position={[0, 0.34, 0.12]}>
        <boxGeometry args={[0.06, 0.05, 0.01]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
      </mesh>
    );
  }
  if (accessory === "pencil") {
    return (
      <mesh position={[0.16, 0.36, 0.08]} rotation={[0.4, 0, 0.6]}>
        <boxGeometry args={[0.02, 0.16, 0.02]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
    );
  }
  if (accessory === "pointer") {
    return (
      <mesh position={[0.18, 0.4, 0.08]} rotation={[0.5, 0, 0.4]}>
        <boxGeometry args={[0.02, 0.14, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} />
      </mesh>
    );
  }
  return null;
}
