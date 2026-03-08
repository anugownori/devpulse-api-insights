export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface APIInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  requiresKey: boolean;
  testUrl: string;
}

export interface APIHealthMetrics {
  apiId: string;
  apiName: string;
  status: HealthStatus;
  latencyMs: number;
  statusCode: number;
  lastChecked: string;
  uptime24h: number;
  rateLimitRemaining: number | null;
  errorMessage: string | null;
}

export interface CompatibilityEdge {
  source: string;
  target: string;
  score: number;
  reason: string;
}

export const APIs: APIInfo[] = [
  { id: 'openaq', name: 'OpenAQ', category: 'Environment', description: 'Real-time air quality data', requiresKey: false, testUrl: 'https://api.openaq.org/v3/locations?limit=1' },
  { id: 'usgs', name: 'USGS Earthquake', category: 'Geoscience', description: 'Earthquake monitoring', requiresKey: false, testUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1' },
  { id: 'worldbank', name: 'World Bank', category: 'Economics', description: 'Global economic indicators', requiresKey: false, testUrl: 'https://api.worldbank.org/v2/country/IN?format=json' },
  { id: 'who', name: 'WHO GHO', category: 'Health', description: 'Global health observatory', requiresKey: false, testUrl: 'https://ghoapi.azureedge.net/api/WHOSIS_000001?$top=1' },
  { id: 'gdelt', name: 'GDELT Project', category: 'News', description: 'Global event database', requiresKey: false, testUrl: 'https://api.gdeltproject.org/api/v2/doc/doc?query=test&mode=artlist&maxrecords=1&format=json' },
  { id: 'wikipedia', name: 'Wikipedia', category: 'Knowledge', description: 'Free encyclopedia API', requiresKey: false, testUrl: 'https://en.wikipedia.org/api/rest_v1/page/summary/API' },
  { id: 'restcountries', name: 'REST Countries', category: 'Geography', description: 'Country information', requiresKey: false, testUrl: 'https://restcountries.com/v3.1/name/india' },
  { id: 'spacex', name: 'SpaceX', category: 'Space', description: 'SpaceX launch data', requiresKey: false, testUrl: 'https://api.spacexdata.com/v4/launches/latest' },
  { id: 'openmeteo', name: 'Open-Meteo', category: 'Weather', description: 'Weather forecast API', requiresKey: false, testUrl: 'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m' },
  { id: 'openlibrary', name: 'Open Library', category: 'Knowledge', description: 'Book information', requiresKey: false, testUrl: 'https://openlibrary.org/search.json?q=python&limit=1' },
  { id: 'semanticscholar', name: 'Semantic Scholar', category: 'Research', description: 'Academic paper search', requiresKey: false, testUrl: 'https://api.semanticscholar.org/graph/v1/paper/search?query=ml&limit=1' },
  { id: 'coinpaprika', name: 'CoinPaprika', category: 'Finance', description: 'Cryptocurrency data', requiresKey: false, testUrl: 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin' },
  { id: 'nasa', name: 'NASA APOD', category: 'Space', description: 'Astronomy picture of the day', requiresKey: true, testUrl: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY' },
  { id: 'duckduckgo', name: 'DuckDuckGo', category: 'Search', description: 'Instant answers API', requiresKey: false, testUrl: 'https://api.duckduckgo.com/?q=test&format=json' },
  { id: 'internetarchive', name: 'Internet Archive', category: 'Knowledge', description: 'Digital library', requiresKey: false, testUrl: 'https://archive.org/metadata/nasa' },
];

export const CATEGORIES = [...new Set(APIs.map(a => a.category))];

// Simulated health data generator
export function generateMockHealth(): APIHealthMetrics[] {
  return APIs.map(api => {
    const rand = Math.random();
    const status: HealthStatus = rand > 0.85 ? 'down' : rand > 0.7 ? 'degraded' : 'healthy';
    const latency = status === 'down' ? 0 : status === 'degraded' ? 800 + Math.random() * 2000 : 50 + Math.random() * 400;
    
    return {
      apiId: api.id,
      apiName: api.name,
      status,
      latencyMs: Math.round(latency),
      statusCode: status === 'down' ? 0 : status === 'degraded' ? 503 : 200,
      lastChecked: new Date().toISOString(),
      uptime24h: status === 'down' ? 45 + Math.random() * 30 : status === 'degraded' ? 85 + Math.random() * 10 : 95 + Math.random() * 5,
      rateLimitRemaining: Math.floor(Math.random() * 1000),
      errorMessage: status === 'down' ? 'Connection timeout' : null,
    };
  });
}

// Compatibility data
export const COMPATIBILITY_EDGES: CompatibilityEdge[] = [
  { source: 'openaq', target: 'openmeteo', score: 92, reason: 'Both use geolocation, complementary environmental data' },
  { source: 'openaq', target: 'who', score: 78, reason: 'Air quality impacts health indicators' },
  { source: 'openaq', target: 'worldbank', score: 65, reason: 'Environmental vs economic correlation' },
  { source: 'usgs', target: 'openmeteo', score: 70, reason: 'Geolocation-based, natural phenomena' },
  { source: 'usgs', target: 'nasa', score: 75, reason: 'Earth science + space science' },
  { source: 'worldbank', target: 'who', score: 88, reason: 'Health & economic indicators by country' },
  { source: 'worldbank', target: 'restcountries', score: 82, reason: 'Country-level data enrichment' },
  { source: 'gdelt', target: 'wikipedia', score: 60, reason: 'News context from encyclopedia' },
  { source: 'gdelt', target: 'semanticscholar', score: 55, reason: 'News + academic research correlation' },
  { source: 'spacex', target: 'nasa', score: 90, reason: 'Space data synergy' },
  { source: 'openlibrary', target: 'wikipedia', score: 72, reason: 'Knowledge cross-reference' },
  { source: 'openlibrary', target: 'semanticscholar', score: 68, reason: 'Books + papers research' },
  { source: 'coinpaprika', target: 'worldbank', score: 58, reason: 'Crypto vs traditional finance' },
  { source: 'openmeteo', target: 'restcountries', score: 64, reason: 'Weather by country/location' },
  { source: 'duckduckgo', target: 'wikipedia', score: 85, reason: 'Search + knowledge base' },
  { source: 'internetarchive', target: 'openlibrary', score: 80, reason: 'Digital archive resources' },
];
