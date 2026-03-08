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

async function searchWikipedia(query: string): Promise<DocResult[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.extract) return [];
    return [{
      source: "Wikipedia",
      title: data.title || query,
      snippet: data.extract,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${query}`,
      icon: Globe,
    }];
  } catch { return []; }
}

async function searchSemanticScholar(query: string): Promise<DocResult[]> {
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=3&fields=title,abstract,url`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((p: any) => p.title)
      .map((p: any) => ({
        source: "Semantic Scholar",
        title: p.title,
        snippet: p.abstract || "No abstract available",
        url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
        icon: FileText,
      }));
  } catch { return []; }
}

async function searchDuckDuckGo(query: string): Promise<DocResult[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query + " API documentation")}&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results: DocResult[] = [];
    if (data.Abstract) {
      results.push({
        source: "DuckDuckGo",
        title: data.Heading || query,
        snippet: data.Abstract,
        url: data.AbstractURL || "#",
        icon: BookOpen,
      });
    }
    for (const topic of (data.RelatedTopics || []).slice(0, 3)) {
      if (topic?.Text) {
        results.push({
          source: "DuckDuckGo",
          title: topic.Text.slice(0, 80),
          snippet: topic.Text,
          url: topic.FirstURL || "#",
          icon: BookOpen,
        });
      }
    }
    return results;
  } catch { return []; }
}

export default function DocSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const [wiki, scholar, ddg] = await Promise.allSettled([
        searchWikipedia(query),
        searchSemanticScholar(query),
        searchDuckDuckGo(query),
      ]);

      const all: DocResult[] = [
        ...(wiki.status === "fulfilled" ? wiki.value : []),
        ...(scholar.status === "fulfilled" ? scholar.value : []),
        ...(ddg.status === "fulfilled" ? ddg.value : []),
      ];
      setResults(all);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
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
            Live documentation search across Wikipedia, Semantic Scholar, and DuckDuckGo — all real-time.
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
              placeholder="Search API docs... (try: air quality, earthquake, machine learning)"
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
            {["air quality", "earthquake", "machine learning", "bitcoin"].map(s => (
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
              <p className="text-muted-foreground">Searching live across multiple sources...</p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {results.map((r, i) => (
                <motion.a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="block glass-card rounded-xl p-5 hover:border-neon-amber/20 border border-transparent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <r.icon className="w-5 h-5 text-neon-amber mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neon-amber/70">{r.source}</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{r.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{r.snippet}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </motion.a>
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
