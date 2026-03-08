import { motion } from "framer-motion";
import { Activity, Zap, GitBranch, Code2, Search, Shield } from "lucide-react";
import { useHealthStore } from "@/hooks/useHealthStore";

const features = [
  { icon: Activity, label: "Health Monitor", color: "text-neon-cyan" },
  { icon: GitBranch, label: "Compatibility", color: "text-neon-magenta" },
  { icon: Code2, label: "Code Gen", color: "text-neon-green" },
  { icon: Search, label: "Doc Search", color: "text-neon-amber" },
  { icon: Shield, label: "Rate Limits", color: "text-neon-cyan" },
  { icon: Zap, label: "Real-time", color: "text-neon-magenta" },
];

const PulseOrb = ({ delay, className }: { delay: number; className: string }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.15, 0.3, 0.15],
    }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export default function HeroSection() {
  const { metrics, isProbing } = useHealthStore();
  const healthy = metrics.filter(m => m.status === "healthy").length;
  const total = metrics.length;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      <PulseOrb delay={0} className="w-96 h-96 bg-neon-cyan -top-20 -left-20" />
      <PulseOrb delay={1.5} className="w-80 h-80 bg-neon-magenta top-1/3 right-0" />
      <PulseOrb delay={3} className="w-72 h-72 bg-neon-green bottom-10 left-1/3" />

      <div className="absolute inset-0 scanline opacity-30" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge - LIVE data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8"
        >
          <span className={`w-2 h-2 rounded-full ${isProbing ? "bg-neon-amber animate-pulse" : "bg-neon-green animate-pulse-glow"}`} />
          <span className="text-sm text-muted-foreground font-mono">
            {total > 0
              ? <>{isProbing ? "PROBING" : "MONITORING"} <span className="text-neon-green">{healthy}</span>/<span className="text-foreground">{total}</span> APIs HEALTHY IN REAL-TIME</>
              : "INITIALIZING API PROBES..."
            }
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="text-foreground">DEV</span>
          <span className="text-neon-cyan text-glow-cyan animate-color-shift">PULSE</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Real-time API intelligence that monitors health, discovers compatibility,
          generates integration code & provides AI-powered docs — built for{" "}
          <span className="text-neon-magenta text-glow-magenta">developers</span>.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="glass-card gradient-border px-4 py-2.5 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform cursor-default"
            >
              <f.icon className={`w-4 h-4 ${f.color}`} />
              <span className="text-sm font-medium text-foreground">{f.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex gap-4 justify-center"
        >
          <a
            href="#dashboard"
            className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-lg glow-cyan hover:scale-105 transition-transform"
          >
            Launch Dashboard
          </a>
          <a
            href="#compatibility"
            className="px-8 py-3.5 rounded-lg glass-card gradient-border text-foreground font-semibold text-lg hover:scale-105 transition-transform"
          >
            Explore APIs
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-neon-cyan" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
