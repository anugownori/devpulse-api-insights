import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, BookOpen, FileText, Globe, Loader2 } from "lucide-react";

interface DocResult {
  source: string;
  title: string;
  snippet: string;
  url: string;
  icon: typeof BookOpen;
}

const MOCK_RESULTS: Record<string, DocResult[]> = {
  "openaq": [
    { source: "OpenAQ Docs", title: "Getting Started with OpenAQ API v3", snippet: "The OpenAQ API provides real-time and historical air quality data from thousands of monitoring stations worldwide. Use the /locations endpoint to find stations near coordinates.", url: "#", icon: BookOpen },
    { source: "Wikipedia", title: "Air Quality Index", snippet: "An air quality index (AQI) is used to communicate how polluted the air currently is. PM2.5 and PM10 are the primary particulate matter measurements.", url: "#", icon: Globe },
    { source: "Semantic Scholar", title: "Urban Air Quality Monitoring Systems", snippet: "Recent advances in IoT-enabled air quality sensors have enabled real-time monitoring networks in major cities across the developing world.", url: "#", icon: FileText },
  ],
  "earthquake": [
    { source: "USGS Docs", title: "USGS Earthquake API Documentation", snippet: "Query earthquakes by location, magnitude, and time range. The GeoJSON format provides coordinates, magnitude, and event properties.", url: "#", icon: BookOpen },
    { source: "Wikipedia", title: "Seismology", snippet: "Seismology is the scientific study of earthquakes and the propagation of elastic waves through the Earth. The Richter scale measures earthquake magnitude.", url: "#", icon: Globe },
  ],
  "weather api": [
    { source: "Open-Meteo Docs", title: "Free Weather API - No Key Required", snippet: "Open-Meteo offers free weather data including temperature, humidity, wind speed, and precipitation forecasts. No API key required for non-commercial use.", url: "#", icon: BookOpen },
    { source: "Wikipedia", title: "Weather Forecasting", snippet: "Weather forecasting is the application of science and technology to predict atmospheric conditions for a given location and time.", url: "#", icon: Globe },
    { source: "DuckDuckGo", title: "Weather API Comparison 2024", snippet: "Comparing free weather APIs: Open-Meteo, OpenWeather, WeatherAPI - features, rate limits, and data accuracy.", url: "#", icon: FileText },
  ],
};

export default function DocSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    setTimeout(() => {
      const q = query.toLowerCase();
      const key = Object.keys(MOCK_RESULTS).find(k => q.includes(k)) || Object.keys(MOCK_RESULTS)[0];
      setResults(MOCK_RESULTS[key] || MOCK_RESULTS["openaq"]);
      setIsSearching(false);
    }, 1200);
  };

  return (
    <section id="docs" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <Search className="w-6 h-6 text-neon-amber" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Doc <span className="text-neon-amber">Search</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            AI-powered documentation search across Wikipedia, Semantic Scholar, and API docs.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mb-10"
        >
          <div className="glass-card gradient-border rounded-2xl flex items-center overflow-hidden">
            <Search className="w-5 h-5 text-muted-foreground ml-5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search API docs... (try: openaq, earthquake, weather api)"
              className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-4 bg-neon-amber/10 text-neon-amber font-semibold hover:bg-neon-amber/20 transition-colors"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex gap-2 mt-3 justify-center">
            {["openaq", "earthquake", "weather api"].map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="text-xs px-3 py-1 rounded-full glass-card text-muted-foreground hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Loader2 className="w-8 h-8 text-neon-amber animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Searching across multiple sources...</p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-xl p-5 hover:border-neon-amber/20 border border-transparent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <r.icon className="w-5 h-5 text-neon-amber mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neon-amber/70">{r.source}</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{r.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.snippet}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </motion.div>
              ))}
              {hasSearched && results.length === 0 && !isSearching && (
                <p className="text-center text-muted-foreground py-12">No results found. Try a different query.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
