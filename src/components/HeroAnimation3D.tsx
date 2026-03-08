import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";

/* ─── Robot Piece Definitions ─── */
interface Piece {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  walkPhase?: number;
  delay?: number;
}

const ROBOT_PIECES: Piece[] = [
  { pos: [0, 0, 0], scale: [0.65, 0.75, 0.4], rot: [0,0,0], color: "#1a2332", delay: 0 },
  { pos: [0, 0.65, 0], scale: [0.5, 0.42, 0.42], rot: [0,0,0], color: "#1a2332", delay: 0.05 },
  { pos: [0, 0.7, 0.22], scale: [0.38, 0.1, 0.02], rot: [0,0,0], color: "#26c6a0", emissive: "#26c6a0", emissiveIntensity: 0.8, delay: 0.2 },
  { pos: [0, 0.05, 0.21], scale: [0.45, 0.25, 0.02], rot: [0,0,0], color: "#c4a55a", delay: 0.1 },
  { pos: [-0.5, 0.15, 0], scale: [0.45, 0.14, 0.14], rot: [0,0,-0.4], color: "#c4a55a", delay: 0.15 },
  { pos: [0.5, 0.15, 0], scale: [0.45, 0.14, 0.14], rot: [0,0,0.4], color: "#c4a55a", delay: 0.15 },
  { pos: [-0.16, -0.6, 0], scale: [0.17, 0.5, 0.2], rot: [0,0,0], color: "#1a2332", delay: 0.1, walkPhase: 1 },
  { pos: [0.16, -0.6, 0], scale: [0.17, 0.5, 0.2], rot: [0,0,0], color: "#1a2332", delay: 0.1, walkPhase: -1 },
  { pos: [0, 1.0, 0], scale: [0.03, 0.18, 0.03], rot: [0,0,0], color: "#c4a55a", delay: 0.25 },
  { pos: [0, 1.15, 0], scale: [0.05, 0.05, 0.05], rot: [0,0,0], color: "#e85d3a", emissive: "#e85d3a", emissiveIntensity: 1.2, delay: 0.3 },
  { pos: [-0.16, -0.88, 0.04], scale: [0.2, 0.06, 0.26], rot: [0,0,0], color: "#c4a55a", delay: 0.15 },
  { pos: [0.16, -0.88, 0.04], scale: [0.2, 0.06, 0.26], rot: [0,0,0], color: "#c4a55a", delay: 0.15 },
  { pos: [-0.78, 0.38, 0], scale: [0.07, 0.07, 0.07], rot: [0,0,0], color: "#26c6a0", emissive: "#26c6a0", emissiveIntensity: 0.5, delay: 0.25 },
  { pos: [0.78, 0.38, 0], scale: [0.07, 0.07, 0.07], rot: [0,0,0], color: "#26c6a0", emissive: "#26c6a0", emissiveIntensity: 0.5, delay: 0.25 },
];

/* ─── Single Robot Piece ─── */
function RobotPieceBox({ piece, assemblyRef, isWalkingRef, timeRef }: {
  piece: Piece;
  assemblyRef: React.MutableRefObject<number>;
  isWalkingRef: React.MutableRefObject<boolean>;
  timeRef: React.MutableRefObject<number>;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const delay = piece.delay || 0;
    const raw = THREE.MathUtils.clamp((assemblyRef.current - delay) / Math.max(0.01, 1 - delay), 0, 1);
    const t = raw * raw * (3 - 2 * raw);

    ref.current.position.set(piece.pos[0] * t, piece.pos[1] * t, piece.pos[2] * t);
    ref.current.scale.set(
      Math.max(0.001, piece.scale[0] * t),
      Math.max(0.001, piece.scale[1] * t),
      Math.max(0.001, piece.scale[2] * t)
    );
    ref.current.rotation.set(piece.rot[0] * t, piece.rot[1] * t, piece.rot[2] * t);

    if (piece.walkPhase && isWalkingRef.current) {
      ref.current.rotation.x = Math.sin(timeRef.current * 8) * 0.35 * piece.walkPhase;
    }
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={piece.color}
        emissive={piece.emissive || piece.color}
        emissiveIntensity={piece.emissiveIntensity ?? 0.05}
        metalness={0.5}
        roughness={0.4}
      />
    </mesh>
  );
}

/* ─── ECG Heartbeat Line (full width) ─── */
function ECGLine({ visible }: { visible: boolean }) {
  const COUNT = 400;
  const progressRef = useRef(0);

  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      pts.push(new THREE.Vector3(i * 0.02 - 4, 0, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#26c6a0", transparent: true, opacity: 0.9 });
    return new THREE.Line(geo, mat);
  }, []);

  useFrame((_, delta) => {
    if (!visible) return;
    progressRef.current += delta * 2.5;
    const positions = lineObj.geometry.attributes.position;
    const arr = positions.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const x = i * 0.02 - 4;
      const t = progressRef.current - i * 0.02;
      const cycle = ((t % 1.4) + 1.4) % 1.4;
      let y = 0;
      if (cycle > 0.25 && cycle < 0.35) y = -0.1;
      else if (cycle > 0.35 && cycle < 0.45) y = 0.45;
      else if (cycle > 0.45 && cycle < 0.55) y = -0.18;
      else if (cycle > 0.55 && cycle < 0.65) y = 0.08;
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }
    positions.needsUpdate = true;
  });

  if (!visible) return null;

  return <primitive object={lineObj} position={[0, 1.7, 0]} />;
}

/* ─── BP Band around P ─── */
function BPBand({ visible, position }: { visible: boolean; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, visible ? 1 : 0, delta * 3);
    ref.current.scale.setScalar(scaleRef.current);
    ref.current.rotation.y += delta * 0.8;
  });

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.5, 0.07, 16, 48]} />
      <meshStandardMaterial
        color="hsl(160, 45%, 48%)"
        emissive="hsl(160, 45%, 48%)"
        emissiveIntensity={0.5}
        transparent
        opacity={0.85}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

/* ─── Dev Text (fades out and transforms into robot) ─── */
function DevText({ visible }: { visible: boolean }) {
  const ref = useRef<any>(null);
  const opRef = useRef(1);

  useFrame((_, delta) => {
    if (!ref.current) return;
    opRef.current = THREE.MathUtils.lerp(opRef.current, visible ? 1 : 0, delta * 4);
    if (ref.current.material) {
      ref.current.material.opacity = opRef.current;
    }
  });

  if (opRef.current < 0.01 && !visible) return null;

  return (
    <Text
      ref={ref}
      position={[-1.5, 0, 0.1]}
      fontSize={1.4}
      color="#ddd8d0"
      anchorX="center"
      anchorY="middle"
      material-transparent={true}
    >
      Dev
    </Text>
  );
}

/* ─── Pulse Text (P gets the band) ─── */
function PulseText() {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (ref.current.material) {
      ref.current.material.opacity = 0.85 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <Text
      ref={ref}
      position={[1.5, 0, 0.1]}
      fontSize={1.4}
      color="#c4a55a"
      anchorX="center"
      anchorY="middle"
      material-transparent={true}
    >
      Pulse
    </Text>
  );
}

/* ─── Main Scene ─── */
function Scene() {
  const [devVisible, setDevVisible] = useState(true);
  const [bandVisible, setBandVisible] = useState(false);
  const [ecgVisible, setEcgVisible] = useState(false);

  const assemblyRef = useRef(0);
  const robotPosRef = useRef(new THREE.Vector3(-1.5, 0, 0));
  const isWalkingRef = useRef(false);
  const timeRef = useRef(0);
  const phaseFlags = useRef({ devFaded: false, bandDone: false, ecgDone: false });
  const robotGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    timeRef.current = t;

    // Phase 1: 1.5s - Dev text fades, robot assembles
    if (t > 1.5 && !phaseFlags.current.devFaded) {
      phaseFlags.current.devFaded = true;
      setDevVisible(false);
    }

    // Assembly progress (1.5s - 3.5s)
    if (t > 1.5 && t < 3.5) {
      assemblyRef.current = Math.min(1, (t - 1.5) / 2);
    } else if (t >= 3.5) {
      assemblyRef.current = 1;
    }

    // Walking phase (3.5s - 5.5s)
    if (t > 3.5 && t < 5.5) {
      isWalkingRef.current = true;
      const walkT = Math.min(1, (t - 3.5) / 2);
      const eased = walkT * walkT * (3 - 2 * walkT);
      robotPosRef.current.x = THREE.MathUtils.lerp(-1.5, 0.5, eased);
    } else if (t >= 5.5) {
      isWalkingRef.current = false;
      robotPosRef.current.x = 0.5;
    }

    // Band appears at 5.5s
    if (t > 5.5 && !phaseFlags.current.bandDone) {
      phaseFlags.current.bandDone = true;
      setBandVisible(true);
    }

    // ECG starts at 6.2s
    if (t > 6.2 && !phaseFlags.current.ecgDone) {
      phaseFlags.current.ecgDone = true;
      setEcgVisible(true);
    }

    // Robot group position + bobbing
    if (robotGroupRef.current) {
      const bob = assemblyRef.current > 0.5 ? Math.sin(t * 2.5) * 0.04 : 0;
      robotGroupRef.current.position.set(robotPosRef.current.x, bob, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4aa8c0" />
      <pointLight position={[1.5, 0.5, 1]} intensity={0.5} color="#c4a55a" distance={5} />
      <pointLight position={[-1, 1, 2]} intensity={0.3} color="#26c6a0" distance={5} />

      {/* "Dev" text - fades out as robot forms */}
      <DevText visible={devVisible} />

      {/* "Pulse" text - stays, P gets band */}
      <Float speed={1.5} rotationIntensity={0.03} floatIntensity={0.1}>
        <PulseText />
      </Float>

      {/* Robot assembles from "Dev" position */}
      <group ref={robotGroupRef}>
        {ROBOT_PIECES.map((piece, i) => (
          <RobotPieceBox
            key={i}
            piece={piece}
            assemblyRef={assemblyRef}
            isWalkingRef={isWalkingRef}
            timeRef={timeRef}
          />
        ))}
      </group>

      {/* Band wraps around P */}
      <BPBand visible={bandVisible} position={[1.1, 0.1, 0]} />

      {/* Full-width ECG pulse line */}
      <ECGLine visible={ecgVisible} />

      {/* ECG backdrop */}
      {ecgVisible && (
        <mesh position={[0, 1.7, -0.05]}>
          <planeGeometry args={[8.5, 0.9]} />
          <meshStandardMaterial color="#0a1510" transparent opacity={0.25} />
        </mesh>
      )}
    </>
  );
}

/* ─── Exported Component ─── */
export default function HeroAnimation3D() {
  return (
    <div className="w-full h-[300px] md:h-[380px] lg:h-[420px] relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(34 80% 56% / 0.06), transparent 70%)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0.3, 6], fov: 42 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-4 py-2 rounded-full">
        <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse-soft" />
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          DEV IS CHECKING API PULSE
        </span>
      </div>
    </div>
  );
}
