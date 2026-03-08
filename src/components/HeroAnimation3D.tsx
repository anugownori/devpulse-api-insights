import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface LetterConfig {
  letter: string;
  startPos: [number, number, number];
  endPos: [number, number, number];
  endRot: [number, number, number];
  endScale: number;
  sitPos: [number, number, number];
  sitRot: [number, number, number];
  sitScale: number;
  startColor: string;
  endColor: string;
  isLegs?: boolean;
  isTorso?: boolean;
}

const LETTERS: LetterConfig[] = [
  {
    letter: "D",
    startPos: [-0.62, 0, 0],
    endPos: [0, 0.9, 0],
    endRot: [0, 0, -Math.PI / 2],
    endScale: 0.75,
    sitPos: [0.03, 0.82, 0.08],
    sitRot: [0, 0, -Math.PI / 2 - 0.12],
    sitScale: 0.72,
    startColor: "hsl(35 18% 85%)",
    endColor: "hsl(192 46% 52%)",
  },
  {
    letter: "E",
    startPos: [0, 0, 0],
    endPos: [0, 0.02, 0],
    endRot: [0, 0, 0],
    endScale: 1,
    sitPos: [0, -0.06, 0.08],
    sitRot: [0, 0, -0.15],
    sitScale: 0.95,
    startColor: "hsl(35 18% 85%)",
    endColor: "hsl(38 45% 56%)",
    isTorso: true,
  },
  {
    letter: "V",
    startPos: [0.58, 0, 0],
    endPos: [0, -0.82, 0],
    endRot: [Math.PI, 0, 0],
    endScale: 0.9,
    sitPos: [0, -0.42, 0.25],
    sitRot: [Math.PI * 0.55, 0, 0],
    sitScale: 0.9,
    startColor: "hsl(35 18% 85%)",
    endColor: "hsl(210 31% 18%)",
    isLegs: true,
  },
];

function AnimLetter({
  cfg,
  morphT,
  sitT,
  timeRef,
  walkDir,
  isWalking,
}: {
  cfg: LetterConfig;
  morphT: React.MutableRefObject<number>;
  sitT: React.MutableRefObject<number>;
  timeRef: React.MutableRefObject<number>;
  walkDir: React.MutableRefObject<number>;
  isWalking: React.MutableRefObject<boolean>;
}) {
  const ref = useRef<any>(null);
  const startColor = useMemo(() => new THREE.Color(cfg.startColor), [cfg.startColor]);
  const endColor = useMemo(() => new THREE.Color(cfg.endColor), [cfg.endColor]);

  useFrame(() => {
    if (!ref.current) return;

    const m = morphT.current * morphT.current * (3 - 2 * morphT.current);
    const s = sitT.current * sitT.current * (3 - 2 * sitT.current);

    const mx = THREE.MathUtils.lerp(cfg.startPos[0], cfg.endPos[0], m);
    const my = THREE.MathUtils.lerp(cfg.startPos[1], cfg.endPos[1], m);
    const mz = THREE.MathUtils.lerp(cfg.startPos[2], cfg.endPos[2], m);

    const rx = THREE.MathUtils.lerp(0, cfg.endRot[0], m);
    const ry = THREE.MathUtils.lerp(0, cfg.endRot[1], m);
    const rz = THREE.MathUtils.lerp(0, cfg.endRot[2], m);

    ref.current.position.set(
      THREE.MathUtils.lerp(mx, cfg.sitPos[0], s),
      THREE.MathUtils.lerp(my, cfg.sitPos[1], s),
      THREE.MathUtils.lerp(mz, cfg.sitPos[2], s)
    );

    const walk = isWalking.current ? Math.sin(timeRef.current * 9) : 0;
    const legSwing = cfg.isLegs ? walk * 0.16 * walkDir.current : 0;
    const torsoSwing = cfg.isTorso ? -walk * 0.05 * walkDir.current : 0;

    ref.current.rotation.set(
      THREE.MathUtils.lerp(rx, cfg.sitRot[0], s),
      THREE.MathUtils.lerp(ry, cfg.sitRot[1], s),
      THREE.MathUtils.lerp(rz + legSwing + torsoSwing, cfg.sitRot[2], s)
    );

    const ms = THREE.MathUtils.lerp(1, cfg.endScale, m);
    const fs = THREE.MathUtils.lerp(ms, cfg.sitScale, s);
    ref.current.scale.set(fs, fs, fs);

    if (ref.current.material) {
      ref.current.material.color.copy(startColor).lerp(endColor, m);
      ref.current.material.opacity = 1;
    }
  });

  return (
    <Text
      ref={ref}
      fontSize={1.18}
      anchorX="center"
      anchorY="middle"
      material-transparent
      material-opacity={1}
    >
      {cfg.letter}
    </Text>
  );
}

function BPCuff({ wrapT, pulseTextX }: { wrapT: React.MutableRefObject<number>; pulseTextX: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = wrapT.current;
    const e = t * t * (3 - 2 * t);
    groupRef.current.visible = e > 0.01;
    groupRef.current.scale.set(e, e, e);
    groupRef.current.rotation.y = (1 - e) * Math.PI * 0.9;
  });

  // Lock to ONLY the P-stem region (left side of "Pulse")
  const cuffX = pulseTextX - 0.86;
  const cuffY = -0.02;

  return (
    <group ref={groupRef} position={[cuffX, cuffY, 0.1]}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.36, 36, 1, true]} />
        <meshStandardMaterial
          color="hsl(154 47% 18%)"
          emissive="hsl(162 70% 44%)"
          emissiveIntensity={0.12}
          side={THREE.DoubleSide}
          metalness={0.08}
          roughness={0.82}
        />
      </mesh>

      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.018, 8, 36]} />
        <meshStandardMaterial color="hsl(162 70% 44%)" emissive="hsl(162 70% 44%)" emissiveIntensity={0.45} />
      </mesh>

      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.018, 8, 36]} />
        <meshStandardMaterial color="hsl(162 70% 44%)" emissive="hsl(162 70% 44%)" emissiveIntensity={0.45} />
      </mesh>

      <mesh position={[0.23, 0, 0.03]}>
        <boxGeometry args={[0.07, 0.28, 0.04]} />
        <meshStandardMaterial color="hsl(164 49% 12%)" metalness={0.25} roughness={0.62} />
      </mesh>

      <mesh position={[0, 0.42, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.62, 6]} />
        <meshStandardMaterial color="hsl(220 6% 22%)" />
      </mesh>
    </group>
  );
}

function ECGLine({ visible }: { visible: React.MutableRefObject<boolean> }) {
  const COUNT = 520;
  const progressRef = useRef(0);

  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      pts.push(new THREE.Vector3(i * 0.018 - 4.6, 0, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "hsl(162 70% 44%)", transparent: true, opacity: 0.95 });
    return new THREE.Line(geo, mat);
  }, []);

  useFrame((_, delta) => {
    lineObj.visible = visible.current;
    if (!visible.current) return;

    progressRef.current += delta * 2.2;
    const positions = lineObj.geometry.attributes.position;
    const arr = positions.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const x = i * 0.018 - 4.6;
      const t = progressRef.current - i * 0.015;
      const cycle = ((t % 1.65) + 1.65) % 1.65;
      let y = 0;

      if (cycle > 0.14 && cycle < 0.24) y = 0.08 * Math.sin(((cycle - 0.14) / 0.1) * Math.PI);
      else if (cycle > 0.36 && cycle < 0.42) y = -0.12;
      else if (cycle > 0.42 && cycle < 0.5) y = 0.52;
      else if (cycle > 0.5 && cycle < 0.57) y = -0.2;
      else if (cycle > 0.72 && cycle < 0.87) y = 0.12 * Math.sin(((cycle - 0.72) / 0.15) * Math.PI);

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }

    positions.needsUpdate = true;
  });

  return <primitive object={lineObj} position={[0, 1.58, 0]} />;
}

function ECGBackdrop({ visible }: { visible: React.MutableRefObject<boolean> }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible = visible.current;
  });

  return (
    <mesh ref={ref} position={[0, 1.58, -0.05]} visible={false}>
      <planeGeometry args={[9.6, 0.92]} />
      <meshStandardMaterial color="hsl(154 35% 8%)" transparent opacity={0.27} />
    </mesh>
  );
}

const PULSE_X = 1.5;
const ROBOT_HOME_X = -1.5;
const ROBOT_NEAR_P_X = 0.32;

function Scene() {
  const morphT = useRef(0);
  const wrapT = useRef(0);
  const sitT = useRef(0);
  const ecgVisible = useRef(false);
  const isWalking = useRef(false);
  const walkDir = useRef(1);
  const timeRef = useRef(0);
  const robotGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    timeRef.current = t;

    // 1.0s → 2.8s : DEV morphs into robot
    if (t > 1.0) morphT.current = Math.min(1, (t - 1.0) / 1.8);

    // 2.8s → 4.6s : robot walks to P
    let x = ROBOT_HOME_X;
    if (t >= 2.8 && t < 4.6) {
      isWalking.current = true;
      walkDir.current = 1;
      const a = (t - 2.8) / 1.8;
      const e = a * a * (3 - 2 * a);
      x = THREE.MathUtils.lerp(ROBOT_HOME_X, ROBOT_NEAR_P_X, e);
    }

    // 4.6s → 5.7s : wrap cuff only on P
    if (t >= 4.6) {
      isWalking.current = false;
      x = ROBOT_NEAR_P_X;
      wrapT.current = Math.min(1, (t - 4.6) / 1.1);
    }

    // 5.8s onward : show ECG
    if (t > 5.8) ecgVisible.current = true;

    // 6.1s → 7.9s : robot returns to original place
    if (t >= 6.1 && t < 7.9) {
      isWalking.current = true;
      walkDir.current = -1;
      const r = (t - 6.1) / 1.8;
      const e = r * r * (3 - 2 * r);
      x = THREE.MathUtils.lerp(ROBOT_NEAR_P_X, ROBOT_HOME_X, e);
    }

    // 7.9s → 8.7s : robot sits at original place
    if (t >= 7.9) {
      isWalking.current = false;
      x = ROBOT_HOME_X;
      sitT.current = Math.min(1, (t - 7.9) / 0.8);
    }

    if (robotGroupRef.current) {
      const walkBob = isWalking.current ? Math.sin(t * 7.5) * 0.04 : 0;
      const sitDrop = THREE.MathUtils.lerp(0, -0.2, sitT.current);
      robotGroupRef.current.position.set(x, walkBob + sitDrop, 0);
      robotGroupRef.current.rotation.set(0, 0, THREE.MathUtils.lerp(0, -0.16, sitT.current));
    }
  });

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight position={[5, 5, 5]} intensity={0.82} color="hsl(31 90% 94%)" />
      <directionalLight position={[-3, 2, -2]} intensity={0.34} color="hsl(192 46% 52%)" />
      <pointLight position={[1.5, 0.5, 1]} intensity={0.45} color="hsl(38 45% 56%)" distance={5} />
      <pointLight position={[-1, 1, 2]} intensity={0.28} color="hsl(162 70% 44%)" distance={5} />

      <group ref={robotGroupRef}>
        {LETTERS.map((cfg) => (
          <AnimLetter
            key={cfg.letter}
            cfg={cfg}
            morphT={morphT}
            sitT={sitT}
            timeRef={timeRef}
            walkDir={walkDir}
            isWalking={isWalking}
          />
        ))}
      </group>

      <PulseText />
      <BPCuff wrapT={wrapT} pulseTextX={PULSE_X} />
      <ECGLine visible={ecgVisible} />
      <ECGBackdrop visible={ecgVisible} />
    </>
  );
}

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
      color="hsl(38 45% 56%)"
      anchorX="center"
      anchorY="middle"
      material-transparent
    >
      Pulse
    </Text>
  );
}

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
        <span className="text-xs font-mono text-muted-foreground tracking-wider">DEV IS CHECKING API PULSE</span>
      </div>
    </div>
  );
}
