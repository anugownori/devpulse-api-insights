import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUp, ArrowDown, Minus, RefreshCw, Wifi, WifiOff, Clock, Key, TrendingUp, Loader2, Eye, ChevronDown } from "lucide-react";
import { probeAllApis, APIs, type APIHealthMetrics, type HealthStatus } from "@/data/apiData";
import ApiKeyManager, { type UserApiKey } from "./ApiKeyManager";
import ApiTrendChart, { type TrendPoint } from "./ApiTrendChart";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useHealthStore } from "@/hooks/useHealthStore";
import { Skeleton } from "@/components/ui/skeleton";

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

function AnimatedStat({ label, value, icon: Icon, color, borderColor }: {
  label: string; value: number | string; icon: any; color: string; borderColor: string;
}) {
  const numericValue = typeof value === "number" ? value : parseInt(value) || 0;
  const animated = useAnimatedCounter(numericValue);
  const suffix = typeof value === "string" && value.includes("ms") ? "ms" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-card rounded-xl p-5 border ${borderColor}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`text-3xl font-bold font-mono ${color}`}>
        {animated}{suffix}
      </p>
    </motion.div>
  );
}

function ResponsePreview({ apiId, responseData }: { apiId: string; responseData: any }) {
  if (!responseData) return null;
  const json = JSON.stringify(responseData, null, 2);
  const truncated = json.length > 300 ? json.slice(0, 300) + "\n..." : json;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 overflow-hidden"
    >
      <pre className="text-[10px] font-mono leading-relaxed p-3 rounded-lg bg-muted/30 border border-border overflow-x-auto max-h-40 text-muted-foreground">
        {truncated}
      </pre>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card gradient-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2.5 h-2.5 rounded-full bg-muted/50" />
              <Skeleton className="w-28 h-4 bg-muted/50" />
            </div>
            <Skeleton className="w-16 h-5 rounded bg-muted/50" />
          </div>
          <Skeleton className="w-full h-1.5 rounded-full bg-muted/50" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="w-16 h-3 bg-muted/50" />
              <Skeleton className="w-12 h-3 bg-muted/50" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="w-14 h-3 bg-muted/50" />
              <Skeleton className="w-10 h-3 bg-muted/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HealthDashboard() {
  const { metrics, probeCount, isProbing, setMetrics, setProbeCount, setIsProbing } = useHealthStore();
  const [filter, setFilter] = useState<HealthStatus | "all">("all");
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
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<Record<string, any>>({});
  const trendDataRef = useRef<Record<string, TrendPoint[]>>({});
  const uptimeHistoryRef = useRef<Record<string, boolean[]>>({});

  useEffect(() => {
    localStorage.setItem("devpulse_api_keys", JSON.stringify(apiKeys));
  }, [apiKeys]);

  const getUserKeyMap = useCallback((): Record<string, string> => {
    const map: Record<string, string> = {};
    apiKeys.forEach(k => { map[k.apiId] = k.key; });
    return map;
  }, [apiKeys]);

  // Fetch a small response preview for each API
  const fetchResponsePreviews = useCallback(async () => {
    const previews: Record<string, any> = {};
    const keyMap = getUserKeyMap();

    await Promise.allSettled(
      APIs.slice(0, 8).map(async (api) => {
        try {
          let url = api.testUrl;
          if (api.requiresKey && keyMap[api.id]) {
            url = url.replace(/api_key=[^&]+/, `api_key=${encodeURIComponent(keyMap[api.id])}`);
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            // Only keep a small slice
            if (Array.isArray(data)) {
              previews[api.id] = data.slice(0, 1);
            } else if (typeof data === "object") {
              const keys = Object.keys(data).slice(0, 5);
              const small: any = {};
              keys.forEach(k => {
                const val = data[k];
                if (typeof val === "string" && val.length > 100) small[k] = val.slice(0, 100) + "...";
                else if (Array.isArray(val)) small[k] = `[${val.length} items]`;
                else small[k] = val;
              });
              previews[api.id] = small;
            }
          }
        } catch { /* skip */ }
      })
    );
    setResponseData(prev => ({ ...prev, ...previews }));
  }, [getUserKeyMap]);

  const runProbe = useCallback(async () => {
    setIsProbing(true);
    try {
      const results = await probeAllApis(getUserKeyMap());

      const updatedResults = results.map(m => {
        const history = uptimeHistoryRef.current[m.apiId] || [];
        history.push(m.status === 'healthy' || m.status === 'degraded');
        if (history.length > 100) history.shift();
        uptimeHistoryRef.current[m.apiId] = history;
        const uptime = (history.filter(Boolean).length / history.length) * 100;
        return { ...m, uptime24h: uptime };
      });

      setMetrics(updatedResults);
      setProbeCount(probeCount + 1);

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
  }, [getUserKeyMap, probeCount, setMetrics, setProbeCount, setIsProbing]);

  useEffect(() => {
    runProbe();
    fetchResponsePreviews();
    const interval = setInterval(runProbe, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddKey = (key: UserApiKey) => setApiKeys(prev => [...prev, key]);
  const handleRemoveKey = (id: string) => setApiKeys(prev => prev.filter(k => k.id !== id));

  const filtered = filter === "all" ? metrics : metrics.filter(m => m.status === filter);
  const healthy = metrics.filter(m => m.status === "healthy").length;
  const degraded = metrics.filter(m => m.status === "degraded").length;
  const down = metrics.filter(m => m.status === "down").length;
  const avgLatency = metrics.length
    ? Math.round(metrics.filter(m => m.latencyMs > 0).reduce((s, m) => s + m.latencyMs, 0) / Math.max(metrics.filter(m => m.latencyMs > 0).length, 1))
    : 0;

  const hasData = metrics.length > 0;

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

        {/* Summary cards - animated counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <AnimatedStat label="Healthy" value={healthy} icon={ArrowUp} color="text-neon-green" borderColor="border-neon-green/20" />
          <AnimatedStat label="Degraded" value={degraded} icon={Minus} color="text-neon-amber" borderColor="border-neon-amber/20" />
          <AnimatedStat label="Down" value={down} icon={ArrowDown} color="text-neon-red" borderColor="border-neon-red/20" />
          <AnimatedStat label="Avg Latency" value={`${avgLatency}ms`} icon={Clock} color="text-neon-cyan" borderColor="border-neon-cyan/20" />
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

        {/* API Grid - with skeletons */}
        {!hasData ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((m, i) => {
                const cfg = statusConfig[m.status];
                const hasKey = apiKeys.some(k => k.apiId === m.apiId);
                const isPreviewOpen = expandedPreview === m.apiId;
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

                      {/* Response preview toggle */}
                      {responseData[m.apiId] && (
                        <button
                          onClick={() => setExpandedPreview(isPreviewOpen ? null : m.apiId)}
                          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-neon-cyan transition-colors mt-1 font-mono"
                        >
                          <Eye className="w-3 h-3" />
                          Response Preview
                          <ChevronDown className={`w-3 h-3 transition-transform ${isPreviewOpen ? "rotate-180" : ""}`} />
                        </button>
                      )}

                      <AnimatePresence>
                        {isPreviewOpen && (
                          <ResponsePreview apiId={m.apiId} responseData={responseData[m.apiId]} />
                        )}
                      </AnimatePresence>

                      <p className="text-[10px] text-muted-foreground font-mono pt-1">
                        {new Date(m.lastChecked).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
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
