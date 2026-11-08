import { RoundedBox } from "@react-three/drei";

export function Block({
  position,
  size,
  color,
  radius = 0.035,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  radius?: number;
}) {
  const limit = Math.min(size[0], size[1], size[2]) * 0.24;
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={Math.min(radius, limit)}
      smoothness={2}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial color={color} />
    </RoundedBox>
  );
}

export function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.2, 7]} />
        <meshLambertMaterial color="#C97B5A" />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#6FAF6B" />
      </mesh>
      <mesh position={[0.07, 0.38, 0.02]}>
        <sphereGeometry args={[0.11, 7, 5]} />
        <meshLambertMaterial color="#4C8A52" />
      </mesh>
    </group>
  );
}

export function Desk({ position, size = [1.15, 0.08, 0.62] }: { position: [number, number, number]; size?: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0.71, 0]} size={size} color="#C89F74" />
      {[
        [-0.42, 0.34, -0.22],
        [0.42, 0.34, -0.22],
        [-0.42, 0.34, 0.22],
        [0.42, 0.34, 0.22],
      ].map((leg) => (
        <Block key={leg.join()} position={leg as [number, number, number]} size={[0.06, 0.64, 0.06]} color="#4A4F57" radius={0.02} />
      ))}
    </group>
  );
}

export function Monitor({ position, wide = false }: { position: [number, number, number]; wide?: boolean }) {
  const w = wide ? 0.72 : 0.46;
  return (
    <group position={position}>
      <Block position={[0, 0.16, 0]} size={[0.06, 0.22, 0.06]} color="#4A4F57" radius={0.02} />
      <Block position={[0, 0.34, 0]} size={[w, 0.32, 0.04]} color="#2E3138" radius={0.02} />
      <mesh position={[0, 0.34, 0.025]}>
        <planeGeometry args={[w - 0.06, 0.24]} />
        <meshLambertMaterial color="#9FD8FF" emissive="#9FD8FF" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

export function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[0, 0.28, 0]} size={[0.34, 0.06, 0.34]} color="#F4F1EC" />
      <Block position={[0, 0.48, 0.14]} size={[0.34, 0.32, 0.06]} color="#E7E1D8" />
      {[
        [-0.12, 0.12, -0.12],
        [0.12, 0.12, -0.12],
        [-0.12, 0.12, 0.12],
        [0.12, 0.12, 0.12],
      ].map((leg) => (
        <Block key={leg.join()} position={leg as [number, number, number]} size={[0.04, 0.22, 0.04]} color="#4A4F57" radius={0.015} />
      ))}
    </group>
  );
}

export function FilingCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0.55, 0]} size={[0.46, 1.05, 0.38]} color="#F4F1EC" />
      {[-0.22, 0, 0.22].map((y) => (
        <Block key={y} position={[0, 0.55 + y, 0.2]} size={[0.34, 0.04, 0.02]} color="#CDBBA2" radius={0.01} />
      ))}
    </group>
  );
}

export function BookShelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0.42, 0]} size={[0.7, 0.8, 0.22]} color="#C89F74" />
      {[-0.18, 0.05, 0.22].map((y) => (
        <group key={y} position={[0, 0.28 + y, 0.02]}>
          {["#CDE8F2", "#F7D3DD", "#F8E3C2", "#D6EFDD"].map((color, index) => (
            <Block key={color} position={[-0.24 + index * 0.16, 0, 0]} size={[0.1, 0.22, 0.08]} color={color} radius={0.01} />
          ))}
        </group>
      ))}
    </group>
  );
}

export function Easel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-0.16, 0.45, 0]} rotation={[0, 0, 0.18]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
        <meshLambertMaterial color="#C89F74" />
      </mesh>
      <mesh position={[0.16, 0.45, 0]} rotation={[0, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
        <meshLambertMaterial color="#C89F74" />
      </mesh>
      <mesh position={[0, 0.2, 0.08]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
        <meshLambertMaterial color="#C89F74" />
      </mesh>
      <Block position={[0, 0.72, 0]} size={[0.46, 0.36, 0.04]} color="#FFFFFF" />
      <mesh position={[-0.08, 0.78, 0.03]}>
        <boxGeometry args={[0.12, 0.1, 0.01]} />
        <meshLambertMaterial color="#F7D3DD" />
      </mesh>
      <mesh position={[0.08, 0.7, 0.03]}>
        <boxGeometry args={[0.1, 0.08, 0.01]} />
        <meshLambertMaterial color="#CDE8F2" />
      </mesh>
    </group>
  );
}

export function CorkBoard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0, 0]} size={[0.9, 0.6, 0.04]} color="#C9A27A" />
      <Block position={[-0.22, 0.1, 0.03]} size={[0.18, 0.14, 0.02]} color="#F8E3C2" radius={0.01} />
      <Block position={[0.05, -0.06, 0.03]} size={[0.16, 0.12, 0.02]} color="#F7D3DD" radius={0.01} />
      <Block position={[0.24, 0.12, 0.03]} size={[0.14, 0.1, 0.02]} color="#D9DCF7" radius={0.01} />
    </group>
  );
}

export function RobotArm({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0.15, 0]} size={[0.28, 0.16, 0.28]} color="#4A4F57" />
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshLambertMaterial color="#F5D5D5" />
      </mesh>
      <mesh position={[0.12, 0.58, 0]} rotation={[0, 0, -0.7]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.42, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
      <mesh position={[0.32, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshLambertMaterial color="#F5D5D5" />
      </mesh>
      <mesh position={[0.46, 0.62, 0]} rotation={[0, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
    </group>
  );
}

export function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0.28, 0]} size={[0.32, 0.42, 0.28]} color="#F4F1EC" />
      <mesh position={[0.18, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
      <mesh position={[0, 0.5, 0.1]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshLambertMaterial color="#9FD8FF" emissive="#9FD8FF" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[0, 0.22, 0]} size={[1.15, 0.28, 0.48]} color="#FBE6CF" />
      <Block position={[0, 0.42, -0.18]} size={[1.15, 0.32, 0.12]} color="#F4D2B0" />
      <Block position={[-0.52, 0.36, 0]} size={[0.1, 0.22, 0.48]} color="#F4D2B0" />
      <Block position={[0.52, 0.36, 0]} size={[0.1, 0.22, 0.48]} color="#F4D2B0" />
    </group>
  );
}

export function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.05, 6]} />
        <meshLambertMaterial color="#4A4F57" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <coneGeometry args={[0.16, 0.18, 6]} />
        <meshLambertMaterial color="#FFE2B8" emissive="#FFE2B8" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}
