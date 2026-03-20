"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, BookOpen, FileText, Globe, Loader2, Zap } from "lucide-react";

interface DocResult {
  source: string;
  title: string;
  snippet: string;
  url: string;
  icon: typeof BookOpen;
}

const API_SERVICE_MAP: Record<string, { name: string; docUrl: string; description: string }> = {
  "openai": {
    name: "OpenAI API",
    docUrl: "https://platform.openai.com/docs/api-reference",
    description: "Access OpenAI's language models, image generation, embeddings, and more"
  },
  "chatgpt": {
    name: "ChatGPT",
    docUrl: "https://platform.openai.com/docs/guides/gpt",
    description: "Build applications with GPT models powered by OpenAI"
  },
  "gpt": {
    name: "GPT Models",
    docUrl: "https://platform.openai.com/docs/models/gpt-4o",
    description: "Explore OpenAI's GPT-4 and GPT-4o models"
  },
  "claude": {
    name: "Claude API",
    docUrl: "https://docs.anthropic.com/en/api",
    description: "Anthropic's Claude models for safe and beneficial AI"
  },
  "anthropic": {
    name: "Anthropic",
    docUrl: "https://docs.anthropic.com/en/api",
    description: "Official Anthropic API documentation"
  },
  "google cloud": {
    name: "Google Cloud",
    docUrl: "https://cloud.google.com/apis",
    description: "APIs for Google Cloud services"
  },
  "google api": {
    name: "Google APIs",
    docUrl: "https://developers.google.com/apis-explorer",
    description: "Explore all Google APIs"
  },
  "aws": {
    name: "AWS",
    docUrl: "https://docs.aws.amazon.com/api-gateway/",
    description: "Amazon Web Services API Gateway and services"
  },
  "amazon": {
    name: "Amazon API",
    docUrl: "https://developer.amazon.com/docs",
    description: "Amazon developer APIs"
  },
  "azure": {
    name: "Microsoft Azure",
    docUrl: "https://learn.microsoft.com/en-us/azure/applied-ai-services/",
    description: "Azure AI and cloud APIs"
  },
  "microsoft": {
    name: "Microsoft APIs",
    docUrl: "https://learn.microsoft.com/en-us/azure/applied-ai-services/",
    description: "Microsoft Azure and AI APIs"
  },
  "gemini": {
    name: "Google Gemini API",
    docUrl: "https://ai.google.dev/docs",
    description: "Google's Gemini AI model API"
  },
  "mistral": {
    name: "Mistral AI",
    docUrl: "https://docs.mistral.ai/",
    description: "Mistral AI's open and commercial models"
  },
  "groq": {
    name: "Groq API",
    docUrl: "https://console.groq.com/docs",
    description: "Fast inference API with LLaMA and Mixtral models"
  },
  "huggingface": {
    name: "Hugging Face",
    docUrl: "https://huggingface.co/docs",
    description: "Transformers, datasets, and model hub"
  },
  "cohere": {
    name: "Cohere API",
    docUrl: "https://docs.cohere.com/",
    description: "Enterprise AI platform with Command and Embed models"
  },
  "replicate": {
    name: "Replicate",
    docUrl: "https://replicate.com/docs",
    description: "Run open-source models via API"
  },
  "cloudflare": {
    name: "Cloudflare API",
    docUrl: "https://developers.cloudflare.com/api/",
    description: "Cloudflare's developer API"
  },
  "stripe": {
    name: "Stripe API",
    docUrl: "https://stripe.com/docs/api",
    description: "Payment processing and financial APIs"
  },
  "twilio": {
    name: "Twilio API",
    docUrl: "https://www.twilio.com/docs/usage/api",
    description: "Communications APIs for SMS, voice, and more"
  },
  "sendgrid": {
    name: "SendGrid API",
    docUrl: "https://docs.sendgrid.com/api-reference",
    description: "Email delivery and marketing APIs"
  },
  "firebase": {
    name: "Firebase",
    docUrl: "https://firebase.google.com/docs/reference",
    description: "Google's app development platform"
  },
  "supabase": {
    name: "Supabase",
    docUrl: "https://supabase.com/docs",
    description: "Open source Firebase alternative with Postgres"
  },
  "prisma": {
    name: "Prisma",
    docUrl: "https://www.prisma.io/docs",
    description: "Next-generation ORM for Node.js and TypeScript"
  },
  "openapi": {
    name: "OpenAPI Specification",
    docUrl: "https://swagger.io/specification/",
    description: "Standard for designing REST APIs"
  },
  "rest api": {
    name: "REST API",
    docUrl: "https://restfulapi.net/",
    description: "Best practices for REST API design"
  },
  "graphql": {
    name: "GraphQL",
    docUrl: "https://graphql.org/learn/",
    description: "Query language for APIs"
  },
  "weatherapi": {
    name: "WeatherAPI",
    docUrl: "https://www.weatherapi.com/docs/",
    description: "Weather forecasting API"
  },
  "openweathermap": {
    name: "OpenWeatherMap",
    docUrl: "https://openweathermap.org/api",
    description: "Weather data API"
  },
  "newsapi": {
    name: "News API",
    docUrl: "https://newsapi.org/docs",
    description: "Breaking news headlines API"
  },
  "github api": {
    name: "GitHub API",
    docUrl: "https://docs.github.com/en/rest",
    description: "GitHub's REST and GraphQL APIs"
  },
  "twitter api": {
    name: "X/Twitter API",
    docUrl: "https://developer.twitter.com/en/docs",
    description: "X platform APIs"
  },
  "discord api": {
    name: "Discord API",
    docUrl: "https://discord.com/developers/docs",
    description: "Build bots and integrations for Discord"
  },
  "spotify api": {
    name: "Spotify Web API",
    docUrl: "https://developer.spotify.com/documentation/web-api",
    description: "Music and podcast data API"
  },
  "youtube api": {
    name: "YouTube API",
    docUrl: "https://developers.google.com/youtube/v3/docs",
    description: "YouTube Data and Player APIs"
  },
  "maps api": {
    name: "Maps APIs",
    docUrl: "https://developers.google.com/maps",
    description: "Google Maps Platform APIs"
  },
  "nasa api": {
    name: "NASA Open APIs",
    docUrl: "https://api.nasa.gov/",
    description: "NASA's free public APIs"
  },
  "openlibrary api": {
    name: "Open Library API",
    docUrl: "https://openlibrary.org/developers/api",
    description: "Open book data and metadata"
  },
  "tmdb": {
    name: "TMDB API",
    docUrl: "https://developer.themoviedb.org/docs",
    description: "The Movie Database API"
  },
  "spoonacular": {
    name: "Spoonacular API",
    docUrl: "https://spoonacular.com/food-api/docs",
    description: "Food and recipe API"
  },
  "api key": {
    name: "API Keys Guide",
    docUrl: "https://platform.openai.com/docs/api-keys",
    description: "How to get and use API keys"
  },
  "api documentation": {
    name: "API Documentation Guide",
    docUrl: "https://swagger.io/tools/swagger-ui/",
    description: "Build beautiful API documentation"
  },
  "spacex": {
    name: "SpaceX API",
    docUrl: "https://github.com/r-spacex/SpaceX-API",
    description: "Launch data, rockets, and missions from SpaceX"
  },
  "nasa": {
    name: "NASA Open APIs",
    docUrl: "https://api.nasa.gov/",
    description: "NASA's free public APIs for space data"
  },
  "earthquake": {
    name: "USGS Earthquake API",
    docUrl: "https://earthquake.usgs.gov/fdsnws/event/1/",
    description: "Real-time earthquake data from USGS"
  },
  "weather": {
    name: "Weather APIs",
    docUrl: "https://open-meteo.com/en/docs",
    description: "Free weather forecast API"
  },
  "openlibrary": {
    name: "Open Library API",
    docUrl: "https://openlibrary.org/developers/api",
    description: "Free book data and metadata"
  },
  "usgs": {
    name: "USGS APIs",
    docUrl: "https://earthquake.usgs.gov/fdsnws/event/1/",
    description: "Geoscience data from USGS"
  },
  "alphavantage": {
    name: "Alpha Vantage API",
    docUrl: "https://www.alphavantage.co/documentation/",
    description: "Stock market and finance data"
  },
  "alphacast": {
    name: "AlphaCast API",
    docUrl: "https://documenter.getpostman.com/view/12384768/TzXqDR8k",
    description: "Sports predictions API"
  },
  "omdb": {
    name: "OMDb API",
    docUrl: "https://www.omdbapi.com/",
    description: "Movie and TV show database"
  }
};

function findApiServiceMatch(query: string): DocResult | null {
  const q = query.toLowerCase().trim();
  for (const [key, service] of Object.entries(API_SERVICE_MAP)) {
    if (q.includes(key) || key.includes(q)) {
      return {
        source: "Official Docs",
        title: service.name,
        snippet: service.description,
        url: service.docUrl,
        icon: Zap,
      };
    }
  }
  return null;
}

async function searchWikipedia(query: string): Promise<DocResult[]> {
  const apiMatch = findApiServiceMatch(query);
  if (apiMatch) {
    return [apiMatch];
  }
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              Doc <span className="text-primary">Search</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light">
            Smart search: API services → official docs, everything else → Wikipedia, Semantic Scholar & DuckDuckGo.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mb-10"
        >
          <div className="glass-card gradient-border rounded-2xl flex items-center overflow-hidden float-card">
            <Search className="w-5 h-5 text-muted-foreground ml-5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search API docs... (try: OpenAI, AWS, ChatGPT, weather, machine learning)"
              className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-4 bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex gap-2 mt-4 justify-center flex-wrap">
            {["OpenAI", "ChatGPT", "Claude", "AWS", "Gemini", "machine learning"].map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="text-xs px-3.5 py-1.5 rounded-full glass-card text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
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
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Searching live across multiple sources...</p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {results.map((r, i) => (
                <motion.a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="block glass-card-hover gradient-border rounded-xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <r.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-primary/60">{r.source}</span>
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
