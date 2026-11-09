import { Html, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Vector3, type Group } from "three";
import { getProfile, staticOffice, svgToWorld, type Accessory } from "@/data/layout-office";
import type { VisualAgent } from "@/gateway/types";
import { useOfficeStore } from "@/store/office-store";
import { ErrorIndicator } from "./ErrorIndicator";
import { SkillHologram } from "./SkillHologram";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface AgentCharacterProps {
  agent: VisualAgent;
}

const BODY = "#F4F1EC";
const INK = "#2B2B2B";
/** About 1.3× the desk top, so the figure stays a small person in the room. */
const BOT_HEIGHT = 0.98;

function SpeechBubble({ text }: { text: string }) {
  const anchor = useRef<Group>(null);
  const { camera, size } = useThree();
  const [below, setBelow] = useState(false);
  const [shift, setShift] = useState(0);
  const scratch = useRef(new Vector3());

  useFrame(() => {
    const node = anchor.current;
    if (!node) return;
    const world = node.getWorldPosition(scratch.current);
    world.y += 1.15;
    const projected = world.clone().project(camera);
    const sx = (projected.x * 0.5 + 0.5) * size.width;
    const sy = (-projected.y * 0.5 + 0.5) * size.height;
    const nextBelow = sy < 88;
    let nextShift = 0;
    if (sx < 118) nextShift = 118 - sx;
    if (sx > size.width - 118) nextShift = size.width - 118 - sx;
    setBelow((prev) => (prev === nextBelow ? prev : nextBelow));
    setShift((prev) => (Math.abs(prev - nextShift) < 4 ? prev : nextShift));
  });

  return (
    <group ref={anchor}>
      <Html position={[0, below ? 0.05 : 1.2, 0]} center zIndexRange={[200, 0]} style={{ pointerEvents: "none", zIndex: 30 }}>
        <div
          className="pointer-events-none rounded-2xl border border-slate-200 px-2.5 py-1.5 text-left text-[12px] leading-snug text-slate-800 shadow-md"
          style={{
            width: 168,
            minWidth: 120,
            maxWidth: 200,
            background: "#ffffff",
            whiteSpace: "normal",
            writingMode: "horizontal-tb",
            wordBreak: "break-word",
            transform: `translateX(${shift}px)`,
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wrapAngle(turn: number): number {
  let value = turn;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

export function AgentCharacter({ agent }: AgentCharacterProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const activeHandoff = useOfficeStore((s) => s.activeHandoff);
  const links = useOfficeStore((s) => s.links);
  const [hovered, setHovered] = useState(false);
  const [docColor, setDocColor] = useState<string | null>(null);
  const profile = getProfile(agent.id);
  const zoneAccent = staticOffice.layout.zones.find((zone) => zone.id === agent.zone)?.accent ?? profile?.accent ?? "#94a3b8";
  const accessory = profile?.accessory ?? null;
  const isSelected = selectedAgentId === agent.id;
  const [targetX, , targetZ] = svgToWorld(agent.position);
  const fadeLabel = useOfficeStore((state) => Array.from(state.agents.values()).some((other) => other.speechBubble));
  const yaw = useRef(Math.PI);
  const parked = useRef<{ x: number; z: number } | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    if (activeHandoff?.sourceId === agent.id) {
      const link = links.find((item) => item.sourceId === activeHandoff.sourceId && item.targetId === activeHandoff.targetId);
      setDocColor(link?.pipeline === "slides" ? "#6FB7C8" : "#A78BFA");
      return;
    }
    if (!agent.movement) setDocColor(null);
  }, [activeHandoff, agent.id, agent.movement, links]);

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;
    const time = state.clock.elapsedTime;
    const pos = groupRef.current.position;
    let targetYaw = Math.PI;
    const move = agent.movement;
    if (move && move.path.length > 1) {
      const index = Math.min(move.path.length - 1, Math.max(1, move.segmentIndex ?? 1));
      const prev = move.path[index - 1];
      const next = move.path[index];
      const [ax, , az] = svgToWorld(prev);
      const [bx, , bz] = svgToWorld(next);
      if (Math.hypot(bx - ax, bz - az) > 0.02) targetYaw = Math.atan2(bx - ax, bz - az);
    }
    const turn = wrapAngle(targetYaw - yaw.current);
    const aligned = reduced.current || Math.abs(turn) < 0.18;
    if (reduced.current) yaw.current = targetYaw;
    else yaw.current += turn * Math.min(1, delta * 8);
    groupRef.current.rotation.y = yaw.current;

    if (!aligned && move) {
      if (!parked.current) parked.current = { x: pos.x, z: pos.z };
      pos.x = parked.current.x;
      pos.z = parked.current.z;
    } else {
      parked.current = null;
      const lerp = 1 - Math.pow(0.08, delta);
      pos.x += (targetX - pos.x) * lerp;
      pos.z += (targetZ - pos.z) * lerp;
    }
    const stepping = Boolean(move) && aligned && !reduced.current;
    bodyRef.current.position.y = stepping ? Math.abs(Math.sin(time * Math.PI * 4)) * BOT_HEIGHT * 0.04 : 0;
  });

  return (
    <group
      ref={groupRef}
      position={[targetX, 0, targetZ]}
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
      <SoftShadow />
      <group ref={bodyRef}>
        <ChibiBody accent={zoneAccent} accessory={accessory} />
        {docColor && (
          <RoundedBox position={[0.2, 0.4, 0.12]} args={[0.1, 0.12, 0.04]} radius={0.012} smoothness={1} castShadow>
            <meshStandardMaterial color={docColor} roughness={0.85} metalness={0} />
          </RoundedBox>
        )}
      </group>

      {agent.status === "thinking" && <ThinkingIndicator />}
      {agent.status === "tool_calling" && agent.currentTool && (
        <SkillHologram tool={{ name: agent.currentTool.name }} position={[0.28, 0.5, -0.16]} />
      )}
      {agent.status === "error" && <ErrorIndicator />}

      {(isSelected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.24, 24]} />
          <meshStandardMaterial color={zoneAccent} roughness={0.85} metalness={0} />
        </mesh>
      )}

      {agent.speechBubble && <SpeechBubble text={agent.speechBubble.text} />}
      <Html position={[0, BOT_HEIGHT + 0.16, 0]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="pointer-events-none whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-center text-[12px] font-semibold shadow-sm"
          style={{ color: INK, opacity: fadeLabel ? 0 : 1 }}
        >
          {agent.name}
        </div>
      </Html>
    </group>
  );
}

function ChibiBody({ accent, accessory }: { accent: string; accessory: Accessory | null }) {
  return (
    <group>
      <RoundedBox position={[-0.08, 0.08, 0]} args={[0.09, 0.14, 0.09]} radius={0.03} smoothness={1} castShadow>
        <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
      </RoundedBox>
      <RoundedBox position={[0.08, 0.08, 0]} args={[0.09, 0.14, 0.09]} radius={0.03} smoothness={1} castShadow>
        <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
      </RoundedBox>
      <RoundedBox position={[0, 0.38, 0]} args={[0.34, 0.36, 0.22]} radius={0.07} smoothness={1} castShadow>
        <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
      </RoundedBox>
      <RoundedBox position={[-0.2, 0.36, 0]} args={[0.08, 0.16, 0.08]} radius={0.03} smoothness={1} castShadow>
        <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
      </RoundedBox>
      <RoundedBox position={[0.2, 0.36, 0]} args={[0.08, 0.16, 0.08]} radius={0.03} smoothness={1} castShadow>
        <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
      </RoundedBox>
      <RoundedBox position={[0, 0.76, 0]} args={[0.36, 0.4, 0.32]} radius={0.12} smoothness={1} castShadow>
        <meshStandardMaterial color={BODY} roughness={0.85} metalness={0} />
      </RoundedBox>
      <mesh position={[-0.07, 0.78, 0.15]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color={INK} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0.07, 0.78, 0.15]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color={INK} roughness={0.85} metalness={0} />
      </mesh>
      <AccessoryMark accessory={accessory} accent={accent} />
    </group>
  );
}

function AccentMaterial({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.85} metalness={0} />;
}

function AccessoryMark({ accessory, accent }: { accessory: Accessory | null; accent: string }) {
  if (accessory === "cap") {
    return (
      <mesh position={[0.02, 0.96, 0.02]} rotation={[0.15, 0, 0.05]} castShadow>
        <boxGeometry args={[0.16, 0.04, 0.14]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "beret") {
    return (
      <mesh position={[0.02, 0.96, 0]} rotation={[0, 0, 0.15]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "goggles" || accessory === "glasses") {
    return (
      <mesh position={[0, 0.78, 0.16]}>
        <boxGeometry args={[0.18, 0.035, 0.02]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "badge") {
    return (
      <mesh position={[0, 0.4, 0.12]}>
        <boxGeometry args={[0.06, 0.05, 0.015]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "pencil") {
    return (
      <mesh position={[0.16, 0.42, 0.08]} rotation={[0.4, 0, 0.5]} castShadow>
        <boxGeometry args={[0.02, 0.12, 0.02]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "pointer") {
    return (
      <mesh position={[0.18, 0.44, 0.08]} rotation={[0.5, 0, 0.4]} castShadow>
        <boxGeometry args={[0.018, 0.12, 0.018]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  if (accessory === "headset") {
    return (
      <group>
        <mesh position={[-0.16, 0.78, 0]}>
          <boxGeometry args={[0.04, 0.06, 0.05]} />
          <AccentMaterial color={accent} />
        </mesh>
        <mesh position={[0.16, 0.78, 0]}>
          <boxGeometry args={[0.04, 0.06, 0.05]} />
          <AccentMaterial color={accent} />
        </mesh>
      </group>
    );
  }
  if (accessory === "cape") {
    return (
      <mesh position={[0, 0.4, -0.1]}>
        <boxGeometry args={[0.16, 0.18, 0.02]} />
        <AccentMaterial color={accent} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.98, 0]} castShadow>
      <sphereGeometry args={[0.035, 8, 6]} />
      <AccentMaterial color={accent} />
    </mesh>
  );
}

function SoftShadow() {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    gradient.addColorStop(0, "rgba(0,0,0,0.18)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  if (!map) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} scale={[1.2, 1, 0.72]}>
      <circleGeometry args={[0.24, 20]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}
