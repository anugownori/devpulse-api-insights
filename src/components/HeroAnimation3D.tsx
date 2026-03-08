import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * Each letter (D, E, V) has a start state (readable text) and an end state
 * (repositioned/rotated/scaled to form a robot silhouette).
 *
 * Robot layout:
 *   D → Head: rotated 90° so the round bump faces forward like a helmet
 *   E → Torso: the 3 horizontal bars become arms + belt, vertical bar = spine
 *   V → Legs: flipped upside-down (Λ) for two legs
 */

interface LetterConfig {
  letter: string;
  // text state
  startPos: [number, number, number];
  // robot state
  endPos: [number, number, number];
  endRot: [number, number, number];
  endScale: number;
  startColor: string;
  endColor: string;
  isLegs?: boolean;
}

const LETTERS: LetterConfig[] = [
  {
    letter: "D",
    startPos: [-0.6, 0, 0],
    endPos: [0, 0.72, 0],      // head
    endRot: [0, 0, -Math.PI / 2], // rotate so D's bump is on top like a helmet
    endScale: 0.6,
    startColor: "#ddd8d0",
    endColor: "#4aa8c0",
  },
  {
    letter: "E",
    startPos: [0, 0, 0],
    endPos: [0, 0, 0],          // torso center
    endRot: [0, 0, 0],
    endScale: 0.85,
    startColor: "#ddd8d0",
    endColor: "#c4a55a",
  },
  {
    letter: "V",
    startPos: [0.55, 0, 0],
    endPos: [0, -0.78, 0],      // legs
    endRot: [Math.PI, 0, 0],    // flip upside down → Λ
    endScale: 0.75,
    startColor: "#ddd8d0",
    endColor: "#1a2332",
    isLegs: true,
  },
];

/* ─── Animated Letter ─── */
function AnimLetter({
  cfg,
  morphT,
  timeRef,
  isWalking,
}: {
  cfg: LetterConfig;
  morphT: React.MutableRefObject<number>;
  timeRef: React.MutableRefObject<number>;
  isWalking: React.MutableRefObject<boolean>;
}) {
  const ref = useRef<any>(null);
  const startColor = useMemo(() => new THREE.Color(cfg.startColor), [cfg.startColor]);
  const endColorObj = useMemo(() => new THREE.Color(cfg.endColor), [cfg.endColor]);

  useFrame(() => {
    if (!ref.current) return;
    const raw = morphT.current;
    const t = raw * raw * (3 - 2 * raw); // smoothstep

    ref.current.position.set(
      THREE.MathUtils.lerp(cfg.startPos[0], cfg.endPos[0], t),
      THREE.MathUtils.lerp(cfg.startPos[1], cfg.endPos[1], t),
      THREE.MathUtils.lerp(cfg.startPos[2], cfg.endPos[2], t)
    );
    ref.current.rotation.set(
      THREE.MathUtils.lerp(0, cfg.endRot[0], t),
      THREE.MathUtils.lerp(0, cfg.endRot[1], t),
      THREE.MathUtils.lerp(0, cfg.endRot[2], t)
    );
    const s = THREE.MathUtils.lerp(1, cfg.endScale, t);
    ref.current.scale.set(s, s, s);

    // Walking wobble for legs
    if (cfg.isLegs && isWalking.current) {
      ref.current.rotation.z += Math.sin(timeRef.current * 9) * 0.12;
    }

    // Color lerp
    if (ref.current.material) {
      ref.current.material.color.copy(startColor).lerp(endColorObj, t);
    }
  });

  return (
    <Text
      ref={ref}
      fontSize={1.2}
      anchorX="center"
      anchorY="middle"
      material-transparent
      material-opacity={1}
      font={undefined}
    >
      {cfg.letter}
    </Text>
  );
}

/* ─── Robot eyes (appear after morph) ─── */
function RobotEyes({ morphT }: { morphT: React.MutableRefObject<number> }) {
  const lRef = useRef<THREE.Mesh>(null);
  const rRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const vis = morphT.current > 0.85;
    if (lRef.current) lRef.current.visible = vis;
    if (rRef.current) rRef.current.visible = vis;
    if (vis) {
      const blink = Math.sin(state.clock.elapsedTime * 3) > 0.95 ? 0.02 : 0.07;
      if (lRef.current) lRef.current.scale.y = blink;
      if (rRef.current) rRef.current.scale.y = blink;
    }
  });

  return (
    <>
      <mesh ref={lRef} position={[-0.15, 0.75, 0.15]} visible={false}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#26c6a0" emissive="#26c6a0" emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={rRef} position={[0.15, 0.75, 0.15]} visible={false}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#26c6a0" emissive="#26c6a0" emissiveIntensity={1.5} />
      </mesh>
    </>
  );
}

/* ─── BP Cuff: wraps ONLY around the vertical leg of the letter P ─── */
function BPCuff({ wrapT, pulseTextX }: {
  wrapT: React.MutableRefObject<number>;
  pulseTextX: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = wrapT.current;
    groupRef.current.visible = t > 0.01;
    // Animate: scale from 0 to full, slight rotation to simulate wrapping
    const ease = t * t * (3 - 2 * t);
    groupRef.current.scale.set(ease, ease, ease);
    groupRef.current.rotation.y = (1 - ease) * Math.PI;
  });

  // Position on the P's vertical stem (left side of "Pulse" text)
  // "Pulse" is centered at pulseTextX. P's stem is roughly 0.7 units left of center.
  const cuffX = pulseTextX - 0.72;
  const cuffY = -0.25; // lower part of P's stem, like wrapping on a forearm

  return (
    <group ref={groupRef} position={[cuffX, cuffY, 0.08]}>
      {/* Main cuff - wide cylinder band */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.4, 32, 1, true]} />
        <meshStandardMaterial
          color="#1a4a3a"
          emissive="#26c6a0"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.02, 8, 32]} />
        <meshStandardMaterial color="#26c6a0" emissive="#26c6a0" emissiveIntensity={0.5} />
      </mesh>
      {/* Bottom rim */}
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.02, 8, 32]} />
        <meshStandardMaterial color="#26c6a0" emissive="#26c6a0" emissiveIntensity={0.5} />
      </mesh>
      {/* Velcro tab */}
      <mesh position={[0.28, 0, 0.02]}>
        <boxGeometry args={[0.08, 0.35, 0.04]} />
        <meshStandardMaterial color="#0d2a20" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Rubber tube going up to the monitor area */}
      <mesh position={[0, 0.55, 0.1]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

/* ─── ECG Heartbeat Line (full width) ─── */
function ECGLine({ visible }: { visible: React.MutableRefObject<boolean> }) {
  const COUNT = 500;
  const progressRef = useRef(0);
  const lineRef = useRef<THREE.Line>(null);

  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      pts.push(new THREE.Vector3(i * 0.018 - 4.5, 0, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#26c6a0", transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geo, mat);
    return line;
  }, []);

  useFrame((_, delta) => {
    lineObj.visible = visible.current;
    if (!visible.current) return;
    progressRef.current += delta * 2.2;
    const positions = lineObj.geometry.attributes.position;
    const arr = positions.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const x = i * 0.018 - 4.5;
      const t = progressRef.current - i * 0.015;
      const cycle = ((t % 1.6) + 1.6) % 1.6;
      let y = 0;
      if (cycle > 0.15 && cycle < 0.25) y = 0.08 * Math.sin((cycle - 0.15) / 0.1 * Math.PI);
      else if (cycle > 0.35 && cycle < 0.40) y = -0.12;
      else if (cycle > 0.40 && cycle < 0.48) y = 0.5;
      else if (cycle > 0.48 && cycle < 0.55) y = -0.2;
      else if (cycle > 0.7 && cycle < 0.85) y = 0.12 * Math.sin((cycle - 0.7) / 0.15 * Math.PI);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }
    positions.needsUpdate = true;
  });

  return <primitive object={lineObj} position={[0, 1.6, 0]} />;
}

/* ─── ECG Backdrop ─── */
function ECGBackdrop({ visible }: { visible: React.MutableRefObject<boolean> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => { if (ref.current) ref.current.visible = visible.current; });
  return (
    <mesh ref={ref} position={[0, 1.6, -0.05]} visible={false}>
      <planeGeometry args={[9.5, 0.9]} />
      <meshStandardMaterial color="#0a1510" transparent opacity={0.25} />
    </mesh>
  );
}

/* ─── Main Scene ─── */
const PULSE_X = 1.5;

function Scene() {
  const morphT = useRef(0);
  const walkT = useRef(0);
  const wrapT = useRef(0);
  const ecgVis = useRef(false);
  const isWalking = useRef(false);
  const timeRef = useRef(0);
  const robotGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    timeRef.current = t;

    // 1.5–3.5s: morph D,E,V → robot
    if (t > 1.5) morphT.current = Math.min(1, (t - 1.5) / 2);

    // 3.5–5.5s: walk toward P
    if (t > 3.5 && t < 5.5) {
      isWalking.current = true;
      walkT.current = Math.min(1, (t - 3.5) / 2);
    } else if (t >= 5.5) {
      isWalking.current = false;
      walkT.current = 1;
    }

    // 5.5–6.5s: wrap BP cuff
    if (t > 5.5) wrapT.current = Math.min(1, (t - 5.5) / 1);

    // 6.8s: ECG
    if (t > 6.8) ecgVis.current = true;

    // Move robot
    if (robotGroup.current) {
      const e = walkT.current * walkT.current * (3 - 2 * walkT.current);
      const x = THREE.MathUtils.lerp(-1.5, 0.3, e);
      const bob = morphT.current > 0.8 ? Math.sin(t * 2.5) * 0.04 : 0;
      robotGroup.current.position.set(x, bob, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4aa8c0" />
      <pointLight position={[1.5, 0.5, 1]} intensity={0.5} color="#c4a55a" distance={5} />
      <pointLight position={[-1, 1, 2]} intensity={0.3} color="#26c6a0" distance={5} />

      {/* Robot: D, E, V letters morph into robot shape */}
      <group ref={robotGroup}>
        {LETTERS.map((cfg) => (
          <AnimLetter
            key={cfg.letter}
            cfg={cfg}
            morphT={morphT}
            timeRef={timeRef}
            isWalking={isWalking}
          />
        ))}
        <RobotEyes morphT={morphT} />
      </group>

      {/* "Pulse" text stays in place */}
      <PulseText />

      {/* BP cuff wraps only around P's vertical stem */}
      <BPCuff wrapT={wrapT} pulseTextX={PULSE_X} />

      {/* ECG line */}
      <ECGLine visible={ecgVis} />
      <ECGBackdrop visible={ecgVis} />
    </>
  );
}

/* ─── Pulse Text ─── */
function PulseText() {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (!ref.current?.material) return;
    ref.current.material.opacity = 0.85 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });
  return (
    <Text
      ref={ref}
      position={[PULSE_X, 0, 0.1]}
      fontSize={1.4}
      color="#c4a55a"
      anchorX="center"
      anchorY="middle"
      material-transparent
    >
      Pulse
    </Text>
  );
}

/* ─── Export ─── */
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
