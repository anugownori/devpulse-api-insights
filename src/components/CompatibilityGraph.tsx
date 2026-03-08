import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GitBranch, ArrowRight } from "lucide-react";
import { APIs, COMPATIBILITY_EDGES } from "@/data/apiData";

export default function CompatibilityGraph() {
  const [selectedApi, setSelectedApi] = useState<string | null>(null);

  const connections = useMemo(() => {
    if (!selectedApi) return COMPATIBILITY_EDGES.slice(0, 8);
    return COMPATIBILITY_EDGES.filter(e => e.source === selectedApi || e.target === selectedApi)
      .sort((a, b) => b.score - a.score);
  }, [selectedApi]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-neon-green";
    if (score >= 60) return "text-neon-cyan";
    if (score >= 40) return "text-neon-amber";
    return "text-neon-red";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-neon-green/10 border-neon-green/20";
    if (score >= 60) return "bg-neon-cyan/10 border-neon-cyan/20";
    if (score >= 40) return "bg-neon-amber/10 border-neon-amber/20";
    return "bg-neon-red/10 border-neon-red/20";
  };

  return (
    <section id="compatibility" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-6 h-6 text-neon-magenta" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Compatibility <span className="text-neon-magenta text-glow-magenta">Graph</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Discover which APIs work best together. Select an API to see its compatibility scores.
          </p>
        </motion.div>

        {/* API selector */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedApi(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !selectedApi ? "bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30" : "glass-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All Connections
          </button>
          {APIs.map(api => (
            <button
              key={api.id}
              onClick={() => setSelectedApi(api.id === selectedApi ? null : api.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedApi === api.id
                  ? "bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {api.name}
            </button>
          ))}
        </div>

        {/* Connections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((edge, i) => {
            const sourceApi = APIs.find(a => a.id === edge.source);
            const targetApi = APIs.find(a => a.id === edge.target);
            return (
              <motion.div
                key={`${edge.source}-${edge.target}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card rounded-xl p-5 border ${scoreBg(edge.score)} hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{sourceApi?.name}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{targetApi?.name}</span>
                  </div>
                  <span className={`text-2xl font-bold font-mono ${scoreColor(edge.score)}`}>
                    {edge.score}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{edge.reason}</p>
                {/* Score bar */}
                <div className="mt-3 w-full h-1.5 rounded-full bg-muted/20">
                  <motion.div
                    className={`h-full rounded-full ${edge.score >= 80 ? "bg-neon-green" : edge.score >= 60 ? "bg-neon-cyan" : "bg-neon-amber"}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${edge.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {connections.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No compatibility data found for this API.
          </div>
        )}
      </div>
    </section>
  );
}
