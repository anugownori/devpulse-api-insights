import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/* ─── Letter that morphs into robot part ─── */
function MorphLetter({
  letter,
  startPos,
  endPos,
  startRot,
  endRot,
  startScale,
  endScale,
  color,
  endColor,
  phaseRef,
  walkPhaseMultiplier,
  timeRef,
  isWalkingRef,
}: {
  letter: string;
  startPos: [number, number, number];
  endPos: [number, number, number];
  startRot: [number, number, number];
  endRot: [number, number, number];
  startScale: number;
  endScale: number;
  color: string;
  endColor: string;
  phaseRef: React.MutableRefObject<number>;
  walkPhaseMultiplier?: number;
  timeRef: React.MutableRefObject<number>;
  isWalkingRef: React.MutableRefObject<boolean>;
}) {
  const ref = useRef<any>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = phaseRef.current;
    const ease = t * t * (3 - 2 * t);

    // Interpolate position
    const x = THREE.MathUtils.lerp(startPos[0], endPos[0], ease);
    const y = THREE.MathUtils.lerp(startPos[1], endPos[1], ease);
    const z = THREE.MathUtils.lerp(startPos[2], endPos[2], ease);
    ref.current.position.set(x, y, z);

    // Interpolate rotation
    ref.current.rotation.set(
      THREE.MathUtils.lerp(startRot[0], endRot[0], ease),
      THREE.MathUtils.lerp(startRot[1], endRot[1], ease),
      THREE.MathUtils.lerp(startRot[2], endRot[2], ease)
    );

    // Interpolate scale
    const s = THREE.MathUtils.lerp(startScale, endScale, ease);
    ref.current.scale.set(s, s, s);

    // Walk animation for legs (V letter)
    if (walkPhaseMultiplier && isWalkingRef.current) {
      ref.current.rotation.z += Math.sin(timeRef.current * 8) * 0.15 * walkPhaseMultiplier;
    }

    // Color morph
    if (ref.current.material) {
      const startC = new THREE.Color(color);
      const endC = new THREE.Color(endColor);
      ref.current.material.color.copy(startC).lerp(endC, ease);
    }
  });

  return (
    <Text
      ref={ref}
      position={startPos}
      fontSize={1.4}
      font={undefined}
      anchorX="center"
      anchorY="middle"
      material-transparent={true}
      material-opacity={1}
    >
      {letter}
    </Text>
  );
}

/* ─── BP Cuff Band (wide fabric-like band around P) ─── */
function BPCuff({ wrapProgress }: { wrapProgress: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  // Multiple strips to simulate a wide BP cuff
  const strips = useMemo(() => {
    const result: { yOffset: number; radius: number }[] = [];
    for (let i = 0; i < 6; i++) {
      result.push({ yOffset: (i - 2.5) * 0.08, radius: 0.65 + i * 0.01 });
    }
    return result;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = wrapProgress.current;
    groupRef.current.visible = t > 0.01;
    // Scale Y to simulate wrapping
    groupRef.current.scale.set(t, t, t);
  });

  return (
    <group ref={groupRef} position={[0.65, 0, 0.05]}>
      {strips.map((strip, i) => (
        <mesh key={i} position={[0, strip.yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[strip.radius, 0.035, 8, 48]} />
          <meshStandardMaterial
            color="#2a5a4a"
            emissive="#26c6a0"
            emissiveIntensity={0.3}
            transparent
            opacity={0.9}
            metalness={0.2}
            roughness={0.7}
          />
        </mesh>
      ))}
      {/* Velcro/clasp detail */}
      <mesh position={[0.65, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.45, 0.08]} />
        <meshStandardMaterial color="#1a3a2e" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Tube coming out of cuff */}
      <mesh position={[0, -0.35, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ─── ECG Heartbeat Line ─── */
function ECGLine({ visible }: { visible: boolean }) {
  const COUNT = 500;
  const progressRef = useRef(0);

  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      pts.push(new THREE.Vector3(i * 0.018 - 4.5, 0, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#26c6a0", transparent: true, opacity: 0.95, linewidth: 2 });
    return new THREE.Line(geo, mat);
  }, []);

  useFrame((_, delta) => {
    if (!visible) return;
    progressRef.current += delta * 2.2;
    const positions = lineObj.geometry.attributes.position;
    const arr = positions.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const x = i * 0.018 - 4.5;
      const t = progressRef.current - i * 0.015;
      const cycle = ((t % 1.6) + 1.6) % 1.6;
      let y = 0;
      // P wave
      if (cycle > 0.15 && cycle < 0.25) y = 0.08 * Math.sin((cycle - 0.15) / 0.1 * Math.PI);
      // QRS complex
      else if (cycle > 0.35 && cycle < 0.40) y = -0.12;
      else if (cycle > 0.40 && cycle < 0.48) y = 0.5;
      else if (cycle > 0.48 && cycle < 0.55) y = -0.2;
      // T wave
      else if (cycle > 0.7 && cycle < 0.85) y = 0.12 * Math.sin((cycle - 0.7) / 0.15 * Math.PI);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }
    positions.needsUpdate = true;
  });

  if (!visible) return null;
  return <primitive object={lineObj} position={[0, 1.6, 0]} />;
}

/* ─── Pulse Text ─── */
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
  const morphRef = useRef(0);       // 0=letters, 1=robot
  const walkRef = useRef(0);        // walk progress (moves robot group)
  const wrapRef = useRef(0);        // BP cuff wrap progress
  const ecgVisRef = useRef(false);
  const isWalkingRef = useRef(false);
  const timeRef = useRef(0);
  const robotGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    timeRef.current = t;

    // Phase 1 (1.5s–3.5s): Letters morph into robot
    if (t > 1.5 && t < 3.5) {
      morphRef.current = Math.min(1, (t - 1.5) / 2);
    } else if (t >= 3.5) {
      morphRef.current = 1;
    }

    // Phase 2 (3.5s–5.5s): Robot walks toward P
    if (t > 3.5 && t < 5.5) {
      isWalkingRef.current = true;
      walkRef.current = Math.min(1, (t - 3.5) / 2);
    } else if (t >= 5.5) {
      isWalkingRef.current = false;
      walkRef.current = 1;
    }

    // Phase 3 (5.5s–6.5s): BP cuff wraps around P
    if (t > 5.5 && t < 6.5) {
      wrapRef.current = Math.min(1, (t - 5.5) / 1);
    } else if (t >= 6.5) {
      wrapRef.current = 1;
    }

    // Phase 4 (6.8s): ECG appears
    if (t > 6.8) {
      ecgVisRef.current = true;
    }

    // Move robot group
    if (robotGroupRef.current) {
      const walkEase = walkRef.current * walkRef.current * (3 - 2 * walkRef.current);
      const x = THREE.MathUtils.lerp(-1.5, 0.3, walkEase);
      const bob = morphRef.current > 0.5 ? Math.sin(t * 2.5) * 0.04 : 0;
      robotGroupRef.current.position.set(x, bob, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#4aa8c0" />
      <pointLight position={[1.5, 0.5, 1]} intensity={0.5} color="#c4a55a" distance={5} />
      <pointLight position={[-1, 1, 2]} intensity={0.3} color="#26c6a0" distance={5} />

      {/* Robot group: D, E, V letters that morph into robot */}
      <group ref={robotGroupRef}>
        {/* D → Body (center, stays upright, grows slightly) */}
        <MorphLetter
          letter="D"
          startPos={[-0.55, 0, 0]}
          endPos={[0, -0.1, 0]}
          startRot={[0, 0, 0]}
          endRot={[0, 0, 0]}
          startScale={1}
          endScale={0.9}
          color="#ddd8d0"
          endColor="#1a2332"
          phaseRef={morphRef}
          timeRef={timeRef}
          isWalkingRef={isWalkingRef}
        />
        {/* E → Head (moves up, shrinks to be the head) */}
        <MorphLetter
          letter="E"
          startPos={[0, 0, 0]}
          endPos={[0, 0.85, 0]}
          startRot={[0, 0, 0]}
          endRot={[0, 0, 0]}
          startScale={1}
          endScale={0.55}
          color="#ddd8d0"
          endColor="#26c6a0"
          phaseRef={morphRef}
          timeRef={timeRef}
          isWalkingRef={isWalkingRef}
        />
        {/* V → Legs (moves down, inverts to look like legs/feet) */}
        <MorphLetter
          letter="V"
          startPos={[0.5, 0, 0]}
          endPos={[0, -0.85, 0]}
          startRot={[0, 0, 0]}
          endRot={[Math.PI, 0, 0]}
          startScale={1}
          endScale={0.7}
          color="#ddd8d0"
          endColor="#c4a55a"
          phaseRef={morphRef}
          walkPhaseMultiplier={1}
          timeRef={timeRef}
          isWalkingRef={isWalkingRef}
        />
      </group>

      {/* "Pulse" text */}
      <PulseText />

      {/* BP Cuff wraps around the P in Pulse */}
      <BPCuff wrapProgress={wrapRef} />

      {/* Full ECG line */}
      <ECGLine visible={ecgVisRef.current} />

      {/* ECG backdrop */}
      <ECGBackdrop visRef={ecgVisRef} />
    </>
  );
}

function ECGBackdrop({ visRef }: { visRef: React.MutableRefObject<boolean> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible = visRef.current;
  });
  return (
    <mesh ref={ref} position={[0, 1.6, -0.05]} visible={false}>
      <planeGeometry args={[9.5, 0.9]} />
      <meshStandardMaterial color="#0a1510" transparent opacity={0.25} />
    </mesh>
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
