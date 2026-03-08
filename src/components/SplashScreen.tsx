import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PULSE_POINTS = 60;

function generateECGPath() {
  const points: string[] = [];
  for (let i = 0; i <= PULSE_POINTS; i++) {
    const x = (i / PULSE_POINTS) * 100;
    let y = 50;
    const pos = i / PULSE_POINTS;
    if (pos > 0.35 && pos < 0.38) y = 35;
    else if (pos > 0.38 && pos < 0.4) y = 50;
    else if (pos > 0.4 && pos < 0.42) y = 70;
    else if (pos > 0.42 && pos < 0.45) y = 10;
    else if (pos > 0.45 && pos < 0.48) y = 80;
    else if (pos > 0.48 && pos < 0.5) y = 45;
    else if (pos > 0.5 && pos < 0.52) y = 50;
    else if (pos > 0.65 && pos < 0.68) y = 40;
    else if (pos > 0.68 && pos < 0.7) y = 55;
    points.push(`${x},${y}`);
  }
  return `M${points.join(" L")}`;
}

const ecgPath = generateECGPath();

function BeatingHeart({ phase, onDoubleTap }: { phase: "idle" | "loading" | "done"; onDoubleTap: () => void }) {
  return (
    <motion.div
      className="cursor-pointer select-none"
      onDoubleClick={onDoubleTap}
      onTouchEnd={(e) => {
        // Handle double tap on mobile
        const now = Date.now();
        const lastTap = (e.currentTarget as any)._lastTap || 0;
        if (now - lastTap < 400) {
          onDoubleTap();
        }
        (e.currentTarget as any)._lastTap = now;
      }}
      animate={
        phase === "idle"
          ? { scale: [1, 1.08, 1, 1.12, 1] }
          : phase === "loading"
          ? { scale: [1, 1.3, 0.95, 1.25, 1] }
          : { scale: [1, 2.5], opacity: [1, 0] }
      }
      transition={
        phase === "idle"
          ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
          : phase === "loading"
          ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.8, ease: "easeIn" }
      }
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-[0_0_40px_hsl(4_70%_55%/0.6)]"
      >
        <defs>
          <linearGradient id="heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350 80% 58%)" />
            <stop offset="50%" stopColor="hsl(4 70% 55%)" />
            <stop offset="100%" stopColor="hsl(340 75% 50%)" />
          </linearGradient>
          <filter id="heart-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heart-grad)"
          filter="url(#heart-glow)"
        />
      </svg>
    </motion.div>
  );
}

function PulseLoader({ progress }: { progress: number }) {
  return (
    <div className="w-72 md:w-96">
      {/* ECG Line */}
      <svg viewBox="0 0 100 100" className="w-full h-16 mb-6" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset={`${Math.max(progress - 10, 0)}%`} stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset={`${progress}%`} stopColor="hsl(var(--status-healthy))" stopOpacity="1" />
            <stop offset={`${Math.min(progress + 1, 100)}%`} stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={ecgPath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeOpacity="0.15" />
        <motion.path
          d={ecgPath}
          fill="none"
          stroke="url(#ecg-grad)"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress / 100 }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      </svg>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--status-healthy)), hsl(var(--primary)))`,
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-y-0 w-8 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--status-healthy) / 0.6), transparent)",
            left: `${progress - 4}%`,
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>

      {/* Status text */}
      <motion.p
        className="text-center text-xs font-mono text-muted-foreground mt-4 tracking-widest uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {progress < 25
          ? "Initializing probes..."
          : progress < 50
          ? "Connecting to APIs..."
          : progress < 75
          ? "Measuring heartbeats..."
          : progress < 100
          ? "Syncing dashboards..."
          : "Launching..."}
      </motion.p>
    </div>
  );
}

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const handleDoubleTap = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("loading");

    // Simulate loading progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 6 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setPhase("done");
          setTimeout(onComplete, 800);
        }, 400);
        return;
      }
      setProgress(p);
    }, 120);
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" || progress < 100 ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full bg-destructive/10 -top-20 -left-20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "blur(100px)" }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full bg-primary/10 bottom-0 right-0"
              animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
              transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "blur(80px)" }}
            />
          </div>

          {/* Dot grid */}
          <div className="absolute inset-0 dot-grid opacity-40" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {phase === "idle" && (
              <>
                <BeatingHeart phase={phase} onDoubleTap={handleDoubleTap} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-center"
                >
                  <p className="text-sm text-muted-foreground font-mono tracking-wider mb-2">
                    DOUBLE TAP THE HEART
                  </p>
                  <p className="text-xs text-muted-foreground/50 font-mono">
                    to check the pulse
                  </p>
                </motion.div>

                {/* Ripple rings */}
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-32 h-32 rounded-full border border-destructive/20"
                    style={{ top: "50%", left: "50%", x: "-50%", y: "-80%" }}
                    animate={{ scale: [1, 2.5 + i * 0.5], opacity: [0.3, 0] }}
                    transition={{
                      duration: 2.5,
                      delay: i * 0.6,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}

            {phase === "loading" && (
              <>
                <BeatingHeart phase={phase} onDoubleTap={handleDoubleTap} />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <PulseLoader progress={progress} />
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
