"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check } from "lucide-react";
import { APIs } from "@/data/apiData";

const CODE_TEMPLATES: Record<string, { language: string; code: string }> = {
  "openaq+openmeteo": {
    language: "javascript",
    code: `// 🌍 OpenAQ + Open Meteo: Environment Dashboard
async function getEnvironmentData(lat, lon) {
  const [airQuality, weather] = await Promise.all([
    fetch(\`https://api.openaq.org/v3/locations?coordinates=\${lat},\${lon}&radius=25000&limit=1\`)
      .then(r => r.json()),
    fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m\`)
      .then(r => r.json())
  ]);

  return {
    air: {
      location: airQuality.results?.[0]?.name,
      sensors: airQuality.results?.[0]?.sensors
    },
    weather: {
      temp: weather.current?.temperature_2m,
      humidity: weather.current?.relative_humidity_2m,
      wind: weather.current?.wind_speed_10m
    },
    combined_risk: calculateRisk(airQuality, weather)
  };
}`,
  },
  "usgs+nasa": {
    language: "javascript",
    code: `// 🚀 USGS + NASA: Earth & Space Monitor
async function getEarthSpaceData() {
  const [earthquakes, apod] = await Promise.all([
    fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=5&minmagnitude=4.5')
      .then(r => r.json()),
    fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
      .then(r => r.json())
  ]);

  return {
    recentQuakes: earthquakes.features.map(f => ({
      magnitude: f.properties.mag,
      location: f.properties.place,
      time: new Date(f.properties.time).toISOString()
    })),
    astronomyPic: {
      title: apod.title,
      url: apod.url,
      explanation: apod.explanation
    }
  };
}`,
  },
  "worldbank+who": {
    language: "javascript",
    code: `// 📊 World Bank + WHO: Global Health Economics
async function getHealthEconomics(countryCode) {
  const [economic, health] = await Promise.all([
    fetch(\`https://api.worldbank.org/v2/country/\${countryCode}/indicator/NY.GDP.PCAP.CD?format=json&date=2020:2023\`)
      .then(r => r.json()),
    fetch('https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim eq \\'' + countryCode.toUpperCase() + '\\'&$top=5')
      .then(r => r.json())
  ]);

  return {
    gdpPerCapita: economic[1]?.map(d => ({ year: d.date, value: d.value })),
    healthIndicators: health.value?.map(d => ({
      year: d.TimeDim,
      lifeExpectancy: d.NumericValue
    })),
    correlation: analyzeCorrelation(economic, health)
  };
}`,
  },
  "gdelt+wikipedia": {
    language: "javascript",
    code: `// 📰 GDELT + Wikipedia: Smart News Context
async function getNewsWithContext(topic) {
  const [news, wiki] = await Promise.all([
    fetch(\`https://api.gdeltproject.org/api/v2/doc/doc?query=\${topic}&mode=artlist&maxrecords=5&format=json\`)
      .then(r => r.json()),
    fetch(\`https://en.wikipedia.org/api/rest_v1/page/summary/\${topic}\`)
      .then(r => r.json())
  ]);

  return {
    articles: news.articles?.map(a => ({
      title: a.title,
      url: a.url,
      source: a.domain,
      tone: a.tone
    })),
    context: {
      summary: wiki.extract,
      thumbnail: wiki.thumbnail?.source
    }
  };
}`,
  },
};

const TEMPLATE_KEYS = Object.keys(CODE_TEMPLATES);

export default function CodeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_KEYS[0]);
  const [copied, setCopied] = useState(false);
  const [selectedApis, setSelectedApis] = useState<string[]>([]);

  const template = CODE_TEMPLATES[selectedTemplate];

  const handleCopy = () => {
    navigator.clipboard.writeText(template.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleApi = (id: string) => {
    setSelectedApis(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id].slice(0, 3)
    );
  };

  return (
    <section id="codegen" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              Code <span className="text-accent">Generator</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl font-light">
            Select API combinations and get production-ready integration boilerplate instantly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: API selection + templates */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Integration Templates
            </h3>
            {TEMPLATE_KEYS.map(key => {
              const apis = key.split("+");
              const names = apis.map(id => APIs.find(a => a.id === id)?.name || id);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    selectedTemplate === key
                      ? "glass-card border border-accent/25 glow-accent"
                      : "glass-card-hover"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-mono text-xs">▸</span>
                    <span className="font-medium text-foreground">{names.join(" + ")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                    {apis.map(id => APIs.find(a => a.id === id)?.category).join(" × ")}
                  </p>
                </button>
              );
            })}

            {/* Custom combo */}
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Build Your Combo (select up to 3)
              </h3>
              <div className="flex flex-wrap gap-2">
                {APIs.slice(0, 10).map(api => (
                  <button
                    key={api.id}
                    onClick={() => toggleApi(api.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      selectedApis.includes(api.id)
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {api.name}
                  </button>
                ))}
              </div>
              {selectedApis.length >= 2 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-accent mt-3 font-mono"
                >
                  ✓ {selectedApis.map(id => APIs.find(a => a.id === id)?.name).join(" + ")} — AI code generation coming soon
                </motion.p>
              )}
            </div>
          </div>

          {/* Right: Code preview */}
          <motion.div
            key={selectedTemplate}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 glass-card rounded-2xl border border-border/50 overflow-hidden float-card"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-status-down/50" />
                  <span className="w-3 h-3 rounded-full bg-status-degraded/50" />
                  <span className="w-3 h-3 rounded-full bg-status-healthy/50" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{template.language}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/20"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto text-foreground/80">
              <code>{template.code}</code>
            </pre>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
