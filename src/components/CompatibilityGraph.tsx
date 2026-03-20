"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GitBranch, ArrowRight, Zap } from "lucide-react";
import { APIs, COMPATIBILITY_EDGES } from "@/data/apiData";
import { useHealthStore } from "@/hooks/useHealthStore";

/**
 * Compute LIVE compatibility score from base score + current health of both APIs.
 * Both healthy = full score, one degraded = -15%, one down = -40%.
 */
function computeLiveScore(
  baseScore: number,
  sourceStatus: string | undefined,
  targetStatus: string | undefined
): number {
  const statusPenalty: Record<string, number> = {
    healthy: 0,
    degraded: 15,
    down: 40,
    unknown: 25,
  };
  const p1 = statusPenalty[sourceStatus || "unknown"] ?? 25;
  const p2 = statusPenalty[targetStatus || "unknown"] ?? 25;
  const penalty = Math.max(p1, p2);
  return Math.round(Math.max(0, Math.min(100, baseScore - penalty)));
}

export default function CompatibilityGraph() {
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const { metrics } = useHealthStore();
  const statusByApiId = useMemo(() => {
    const map: Record<string, string> = {};
    metrics.forEach(m => { map[m.apiId] = m.status; });
    return map;
  }, [metrics]);

  const connections = useMemo(() => {
    const base = !selectedApi ? COMPATIBILITY_EDGES.slice(0, 12) : COMPATIBILITY_EDGES.filter(e => e.source === selectedApi || e.target === selectedApi);
    return base
      .map(e => ({
        ...e,
        liveScore: computeLiveScore(e.score, statusByApiId[e.source], statusByApiId[e.target]),
      }))
      .sort((a, b) => b.liveScore - a.liveScore)
      .slice(0, 12);
  }, [selectedApi, statusByApiId]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-status-healthy";
    if (score >= 60) return "text-secondary";
    if (score >= 40) return "text-status-degraded";
    return "text-status-down";
  };

  const scoreBorderColor = (score: number) => {
    if (score >= 80) return "border-status-healthy/15";
    if (score >= 60) return "border-secondary/15";
    if (score >= 40) return "border-status-degraded/15";
    return "border-status-down/15";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 80) return "bg-status-healthy";
    if (score >= 60) return "bg-secondary";
    return "bg-status-degraded";
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
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              Compatibility <span className="text-secondary">Graph</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl font-light flex items-center gap-2">
            Live compatibility scores based on current API health. Select an API to see its best pairings.
            {metrics.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-primary/80 font-mono">
                <Zap className="w-3 h-3" /> Live
              </span>
            )}
          </p>
        </motion.div>

        {/* API selector */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedApi(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedApi ? "bg-secondary/15 text-secondary border border-secondary/25" : "glass-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All Connections
          </button>
          {APIs.map(api => (
            <button
              key={api.id}
              onClick={() => setSelectedApi(api.id === selectedApi ? null : api.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedApi === api.id
                  ? "bg-secondary/15 text-secondary border border-secondary/25"
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
                className="card-3d"
              >
                <div className={`card-3d-inner glass-card-hover rounded-xl p-5 border ${scoreBorderColor(edge.liveScore)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{sourceApi?.name}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{targetApi?.name}</span>
                    </div>
                    <span className={`text-2xl font-bold font-mono ${scoreColor(edge.liveScore)}`}>
                      {edge.liveScore}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{edge.reason}</p>
                  <div className="mt-3 w-full h-1.5 rounded-full bg-muted/20">
                    <motion.div
                      className={`h-full rounded-full ${scoreBarColor(edge.liveScore)}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${edge.liveScore}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
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
