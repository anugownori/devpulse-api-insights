import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUp, ArrowDown, Minus, RefreshCw, Wifi, WifiOff, Clock, Key, TrendingUp, Loader2 } from "lucide-react";
import { probeAllApis, APIs, type APIHealthMetrics, type HealthStatus } from "@/data/apiData";
import ApiKeyManager, { type UserApiKey } from "./ApiKeyManager";
import ApiTrendChart, { type TrendPoint } from "./ApiTrendChart";

const statusConfig: Record<HealthStatus, { color: string; bg: string; label: string; icon: typeof Wifi }> = {
  healthy: { color: "text-neon-green", bg: "bg-neon-green/10", label: "Healthy", icon: Wifi },
  degraded: { color: "text-neon-amber", bg: "bg-neon-amber/10", label: "Degraded", icon: Clock },
  down: { color: "text-neon-red", bg: "bg-neon-red/10", label: "Down", icon: WifiOff },
  unknown: { color: "text-muted-foreground", bg: "bg-muted/10", label: "Unknown", icon: Minus },
};

function LatencyBar({ latency, max = 3000 }: { latency: number; max?: number }) {
  const pct = Math.min((latency / max) * 100, 100);
  const color = latency < 300 ? "bg-neon-green" : latency < 1000 ? "bg-neon-amber" : "bg-neon-red";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted/30">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

export default function HealthDashboard() {
  const [metrics, setMetrics] = useState<APIHealthMetrics[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [filter, setFilter] = useState<HealthStatus | "all">("all");
  const [probeCount, setProbeCount] = useState(0);
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>(() => {
    try {
      const saved = localStorage.getItem("devpulse_api_keys");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<Record<string, TrendPoint[]>>({});
  const trendDataRef = useRef<Record<string, TrendPoint[]>>({});
  // Track uptime history per API
  const uptimeHistoryRef = useRef<Record<string, boolean[]>>({});

  // Persist API keys
  useEffect(() => {
    localStorage.setItem("devpulse_api_keys", JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Build user key map from saved keys
  const getUserKeyMap = useCallback((): Record<string, string> => {
    const map: Record<string, string> = {};
    apiKeys.forEach(k => { map[k.apiId] = k.key; });
    return map;
  }, [apiKeys]);

  // Real probe function
  const runProbe = useCallback(async () => {
    setIsProbing(true);
    try {
      const results = await probeAllApis(getUserKeyMap());

      // Update uptime history & calculate uptime
      const updatedResults = results.map(m => {
        const history = uptimeHistoryRef.current[m.apiId] || [];
        history.push(m.status === 'healthy' || m.status === 'degraded');
        // Keep last 100 checks
        if (history.length > 100) history.shift();
        uptimeHistoryRef.current[m.apiId] = history;
        const uptime = (history.filter(Boolean).length / history.length) * 100;
        return { ...m, uptime24h: uptime };
      });

      setMetrics(updatedResults);
      setProbeCount(prev => prev + 1);

      // Update trend data with real values
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const updated = { ...trendDataRef.current };
      updatedResults.forEach(m => {
        const existing = updated[m.apiId] || [];
        existing.push({ time, latency: m.latencyMs, status: m.statusCode });
        if (existing.length > 30) existing.shift();
        updated[m.apiId] = existing;
      });
      trendDataRef.current = updated;
      setTrendData({ ...updated });
    } catch (err) {
      console.error("Probe error:", err);
    } finally {
      setIsProbing(false);
    }
  }, [getUserKeyMap]);

  // Initial probe + interval
  useEffect(() => {
    runProbe();
    const interval = setInterval(runProbe, 30000); // every 30s
    return () => clearInterval(interval);
  }, [runProbe]);

  const handleAddKey = (key: UserApiKey) => setApiKeys(prev => [...prev, key]);
  const handleRemoveKey = (id: string) => setApiKeys(prev => prev.filter(k => k.id !== id));

  const filtered = filter === "all" ? metrics : metrics.filter(m => m.status === filter);
  const healthy = metrics.filter(m => m.status === "healthy").length;
  const degraded = metrics.filter(m => m.status === "degraded").length;
  const down = metrics.filter(m => m.status === "down").length;
  const avgLatency = metrics.length
    ? Math.round(metrics.filter(m => m.latencyMs > 0).reduce((s, m) => s + m.latencyMs, 0) / Math.max(metrics.filter(m => m.latencyMs > 0).length, 1))
    : 0;

  return (
    <section id="dashboard" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-neon-cyan" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                API Health <span className="text-neon-cyan text-glow-cyan">Monitor</span>
              </h2>
              {isProbing && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-neon-cyan">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  PROBING LIVE
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTrends(!showTrends)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showTrends
                    ? "bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Trends
              </button>
              <button
                onClick={() => setShowKeyManager(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:border-neon-cyan/20 border border-transparent"
              >
                <Key className="w-4 h-4" />
                API Keys
                {apiKeys.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs flex items-center justify-center font-mono">
                    {apiKeys.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Live health probing across {APIs.length} public APIs. All data is real — probed every 30 seconds from your browser.
            {probeCount > 0 && (
              <span className="text-neon-cyan font-mono text-sm ml-2">({probeCount} probes completed)</span>
            )}
          </p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Healthy", value: healthy, icon: ArrowUp, color: "text-neon-green", borderColor: "border-neon-green/20" },
            { label: "Degraded", value: degraded, icon: Minus, color: "text-neon-amber", borderColor: "border-neon-amber/20" },
            { label: "Down", value: down, icon: ArrowDown, color: "text-neon-red", borderColor: "border-neon-red/20" },
            { label: "Avg Latency", value: `${avgLatency}ms`, icon: Clock, color: "text-neon-cyan", borderColor: "border-neon-cyan/20" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-xl p-5 border ${card.borderColor}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <p className={`text-3xl font-bold font-mono ${card.color}`}>{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Trend Charts */}
        <AnimatePresence>
          {showTrends && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-neon-magenta" />
                <h3 className="text-lg font-semibold text-foreground">Live Latency Trends</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {probeCount > 0 ? `${Math.min(probeCount, 30)} data points` : 'Collecting...'}
                </span>
              </div>
              {probeCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running first probe...
                </div>
              ) : (
                <div className="space-y-2">
                  {APIs.map(api => (
                    <ApiTrendChart
                      key={api.id}
                      apiName={api.name}
                      data={trendData[api.id] || []}
                      isExpanded={expandedTrend === api.id}
                      onToggle={() => setExpandedTrend(prev => prev === api.id ? null : api.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters + refresh */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2">
            {(["all", "healthy", "degraded", "down"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={runProbe}
            disabled={isProbing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg glass-card text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isProbing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isProbing ? "Probing..." : "Probe Now"}
          </button>
        </div>

        {/* API Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => {
              const cfg = statusConfig[m.status];
              const hasKey = apiKeys.some(k => k.apiId === m.apiId);
              return (
                <motion.div
                  key={m.apiId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card gradient-border rounded-xl p-5 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.status === "healthy" ? "bg-neon-green animate-pulse-glow" : m.status === "degraded" ? "bg-neon-amber" : "bg-neon-red"}`} />
                      <h3 className="font-semibold text-foreground">{m.apiName}</h3>
                      {hasKey && <Key className="w-3 h-3 text-neon-cyan" />}
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className="font-mono text-foreground">{m.latencyMs}ms</span>
                    </div>
                    <LatencyBar latency={m.latencyMs} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="font-mono text-foreground">
                        {m.uptime24h > 0 ? `${m.uptime24h.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-mono ${m.statusCode >= 200 && m.statusCode < 300 ? "text-neon-green" : m.statusCode === 0 ? "text-neon-red" : "text-neon-amber"}`}>
                        {m.statusCode || "ERR"}
                      </span>
                    </div>
                    {m.rateLimitRemaining !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rate Limit</span>
                        <span className="font-mono text-foreground">{m.rateLimitRemaining} left</span>
                      </div>
                    )}
                    {m.errorMessage && (
                      <p className="text-xs text-neon-red mt-1 font-mono">{m.errorMessage}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono pt-1">
                      {new Date(m.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <ApiKeyManager
        apiKeys={apiKeys}
        onAddKey={handleAddKey}
        onRemoveKey={handleRemoveKey}
        isOpen={showKeyManager}
        onClose={() => setShowKeyManager(false)}
      />
    </section>
  );
}
