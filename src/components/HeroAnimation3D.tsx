import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

/* ─── ECG Heartbeat Line ─── */
function ECGLine({ visible }: { visible: boolean }) {
  const lineRef = useRef<THREE.Line>(null);
  const progressRef = useRef(0);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 200; i++) pts.push(new THREE.Vector3(i * 0.015 - 1.5, 0, 0));
    return pts;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  useFrame((_, delta) => {
    if (!visible || !lineRef.current) return;
    progressRef.current += delta * 3;
    const positions = lineRef.current.geometry.attributes.position;
    const arr = positions.array as Float32Array;
    for (let i = 0; i < 200; i++) {
      const x = i * 0.015 - 1.5;
      const t = progressRef.current - i * 0.04;
      let y = 0;
      const cycle = t % 1.2;
      if (cycle > 0.2 && cycle < 0.3) y = -0.08;
      else if (cycle > 0.3 && cycle < 0.4) y = 0.35;
      else if (cycle > 0.4 && cycle < 0.5) y = -0.15;
      else if (cycle > 0.5 && cycle < 0.55) y = 0.06;
      else y = 0;
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }
    positions.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#26c6a0", transparent: true, opacity: 0.95 }))} ref={lineRef} />
  );
}

/* ─── BP Band (Torus wrapping around P) ─── */
function BPBand({ visible, targetPos }: { visible: boolean; targetPos: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (visible) {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1, delta * 3);
    } else {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 0, delta * 5);
    }
    ref.current.scale.setScalar(scaleRef.current);
    ref.current.rotation.y += delta * 0.8;
  });

  return (
    <mesh ref={ref} position={targetPos}>
      <torusGeometry args={[0.55, 0.08, 16, 48]} />
      <meshStandardMaterial
        color="hsl(160, 45%, 48%)"
        emissive="hsl(160, 45%, 48%)"
        emissiveIntensity={0.4}
        transparent
        opacity={0.85}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
  );
}

/* ─── Monitor Screen on Robot ─── */
function MonitorScreen({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const opRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    opRef.current = visible
      ? THREE.MathUtils.lerp(opRef.current, 1, delta * 2)
      : THREE.MathUtils.lerp(opRef.current, 0, delta * 4);
  });

  return (
    <group ref={ref} position={[0, 0.55, 0.36]}>
      {/* Screen background */}
      <mesh>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial
          color="#0a1a15"
          emissive="#0d2a20"
          emissiveIntensity={0.3}
          transparent
          opacity={visible ? 0.95 : 0}
        />
      </mesh>
      {/* ECG on screen */}
      <group position={[0, 0, 0.01]} scale={[0.18, 0.25, 1]}>
        <ECGLine visible={visible} />
      </group>
    </group>
  );
}

/* ─── Robot "Dev" ─── */
function Robot({ onArrived }: { onArrived: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(-4);
  const arrivedRef = useRef(false);
  const armAngleRef = useRef(0);
  const [phase, setPhase] = useState<"approaching" | "wrapping" | "monitoring">("approaching");

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (phase === "approaching") {
      posRef.current = THREE.MathUtils.lerp(posRef.current, -0.3, delta * 1.2);
      if (posRef.current > -0.5 && !arrivedRef.current) {
        arrivedRef.current = true;
        setPhase("wrapping");
        onArrived();
      }
    }

    // Bobbing
    groupRef.current.position.set(posRef.current, Math.sin(t * 2) * 0.05 - 0.2, 0);
    groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.03;

    // Arm animation for wrapping
    if (phase === "wrapping") {
      armAngleRef.current = THREE.MathUtils.lerp(armAngleRef.current, 0.8, delta * 2);
      if (armAngleRef.current > 0.75) setPhase("monitoring");
    } else if (phase === "monitoring") {
      armAngleRef.current = 0.5 + Math.sin(t * 2) * 0.1;
    }
  });

  const metalMat = useMemo(
    () => ({ color: "#c4a55a", metalness: 0.8, roughness: 0.2, emissive: "#c4a55a", emissiveIntensity: 0.1 }),
    []
  );
  const bodyMat = useMemo(
    () => ({ color: "#1a2332", metalness: 0.5, roughness: 0.4, emissive: "#1a2332", emissiveIntensity: 0.05 }),
    []
  );
  const accentMat = useMemo(
    () => ({ color: "#26c6a0", emissive: "#26c6a0", emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.5 }),
    []
  );

  return (
    <group ref={groupRef} position={[-4, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.55, 0.45, 0.45]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      {/* Visor / Eyes */}
      <mesh position={[0, 1.12, 0.23]}>
        <boxGeometry args={[0.42, 0.12, 0.02]} />
        <meshStandardMaterial {...accentMat} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#e85d3a" emissive="#e85d3a" emissiveIntensity={1} />
      </mesh>

      {/* Body / Torso */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.7, 0.75, 0.45]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      {/* Chest plate */}
      <mesh position={[0, 0.55, 0.23]}>
        <boxGeometry args={[0.5, 0.3, 0.02]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>
      {/* Monitor on chest */}
      <MonitorScreen visible={phase === "monitoring"} />

      {/* Left Arm (reaching toward P) */}
      <group position={[0.45, 0.6, 0]} rotation={[0, 0, -armAngleRef.current]}>
        <mesh position={[0.25, 0, 0]}>
          <boxGeometry args={[0.45, 0.15, 0.15]} />
          <meshStandardMaterial {...metalMat} />
        </mesh>
        {/* Hand / gripper */}
        <mesh position={[0.52, 0, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial {...accentMat} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[-0.45, 0.6, 0]} rotation={[0, 0, 0.3]}>
        <mesh position={[-0.25, 0, 0]}>
          <boxGeometry args={[0.45, 0.15, 0.15]} />
          <meshStandardMaterial {...metalMat} />
        </mesh>
        <mesh position={[-0.52, 0, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial {...accentMat} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh position={[0.18, -0.1, 0]}>
        <boxGeometry args={[0.18, 0.5, 0.2]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[-0.18, -0.1, 0]}>
        <boxGeometry args={[0.18, 0.5, 0.2]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      {/* Feet */}
      <mesh position={[0.18, -0.38, 0.05]}>
        <boxGeometry args={[0.2, 0.08, 0.3]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>
      <mesh position={[-0.18, -0.38, 0.05]}>
        <boxGeometry args={[0.2, 0.08, 0.3]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>
    </group>
  );
}

/* ─── Glowing "P" Letter ─── */
function PulseLetter() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.05;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(t * 3) * 0.15;
  });

  return (
    <mesh ref={ref} position={[1.2, 0.3, 0]}>
      <boxGeometry args={[0.6, 1.4, 0.2]} />
      <meshStandardMaterial
        color="hsl(34, 80%, 56%)"
        emissive="hsl(34, 80%, 56%)"
        emissiveIntensity={0.3}
        metalness={0.6}
        roughness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ─── Main Scene ─── */
function Scene() {
  const [bandVisible, setBandVisible] = useState(false);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4aa8c0" />
      <pointLight position={[1.2, 0.5, 1]} intensity={0.5} color="#c4a55a" distance={5} />
      <pointLight position={[-1, 1, 2]} intensity={0.3} color="#26c6a0" distance={5} />

      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <PulseLetter />
      </Float>

      <BPBand visible={bandVisible} targetPos={[1.2, 0.3, 0]} />
      <Robot onArrived={() => setTimeout(() => setBandVisible(true), 600)} />

      {/* ECG floating above the scene */}
      <group position={[0.5, 1.8, 0]}>
        <ECGLine visible={bandVisible} />
      </group>
    </>
  );
}

/* ─── Exported Component ─── */
export default function HeroAnimation3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-[400px] md:h-[500px] lg:h-[550px] relative">
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(34 80% 56% / 0.06), transparent 70%)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 40 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>
      {/* Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-4 py-2 rounded-full">
        <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse-soft" />
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          DEV IS CHECKING API PULSE
        </span>
      </div>
    </div>
  );
}
