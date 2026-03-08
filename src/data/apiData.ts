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
  { id: 'usgs', name: 'USGS Earthquake', category: 'Geoscience', description: 'Earthquake monitoring', requiresKey: false, testUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1' },
  { id: 'wikipedia', name: 'Wikipedia', category: 'Knowledge', description: 'Free encyclopedia API', requiresKey: false, testUrl: 'https://en.wikipedia.org/api/rest_v1/page/summary/API' },
  { id: 'restcountries', name: 'REST Countries', category: 'Geography', description: 'Country information', requiresKey: false, testUrl: 'https://restcountries.com/v3.1/name/india' },
  { id: 'spacex', name: 'SpaceX', category: 'Space', description: 'SpaceX launch data', requiresKey: false, testUrl: 'https://api.spacexdata.com/v4/launches/latest' },
  { id: 'openmeteo', name: 'Open-Meteo', category: 'Weather', description: 'Weather forecast API', requiresKey: false, testUrl: 'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m' },
  { id: 'openlibrary', name: 'Open Library', category: 'Knowledge', description: 'Book information', requiresKey: false, testUrl: 'https://openlibrary.org/search.json?q=python&limit=1' },
  { id: 'coinpaprika', name: 'CoinPaprika', category: 'Finance', description: 'Cryptocurrency data', requiresKey: false, testUrl: 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin' },
  { id: 'nasa', name: 'NASA APOD', category: 'Space', description: 'Astronomy picture of the day', requiresKey: false, testUrl: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY' },
  { id: 'internetarchive', name: 'Internet Archive', category: 'Knowledge', description: 'Digital library', requiresKey: false, testUrl: 'https://archive.org/metadata/nasa' },
  { id: 'openaq', name: 'OpenAQ', category: 'Environment', description: 'Real-time air quality data', requiresKey: false, testUrl: 'https://api.openaq.org/v3/locations?limit=1&country=IN' },
  { id: 'worldbank', name: 'World Bank', category: 'Economics', description: 'Global economic indicators', requiresKey: false, testUrl: 'https://api.worldbank.org/v2/country/IN?format=json' },
  { id: 'who', name: 'WHO GHO', category: 'Health', description: 'Global health observatory', requiresKey: false, testUrl: 'https://ghoapi.azureedge.net/api/WHOSIS_000001?$top=1' },
  { id: 'semanticscholar', name: 'Semantic Scholar', category: 'Research', description: 'Academic paper search', requiresKey: false, testUrl: 'https://api.semanticscholar.org/graph/v1/paper/search?query=ml&limit=1' },
  { id: 'gdelt', name: 'GDELT Project', category: 'News', description: 'Global event database', requiresKey: false, testUrl: 'https://api.gdeltproject.org/api/v2/doc/doc?query=test&mode=artlist&maxrecords=1&format=json' },
  { id: 'duckduckgo', name: 'DuckDuckGo', category: 'Search', description: 'Instant answers API', requiresKey: false, testUrl: 'https://api.duckduckgo.com/?q=test&format=json' },
];

export const CATEGORIES = [...new Set(APIs.map(a => a.category))];

/**
 * Probe a single API endpoint and return real health metrics
 */
async function probeSingleApi(api: APIInfo, userApiKeys: Record<string, string> = {}): Promise<APIHealthMetrics> {
  let url = api.testUrl;

  // Replace key placeholder if user has provided one
  if (api.requiresKey && userApiKeys[api.id]) {
    url = url.replace(/api_key=[^&]+/, `api_key=${encodeURIComponent(userApiKeys[api.id])}`);
    url = url.replace(/appid=[^&]+/, `appid=${encodeURIComponent(userApiKeys[api.id])}`);
    url = url.replace(/key=[^&]+/, `key=${encodeURIComponent(userApiKeys[api.id])}`);
  }

  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Math.round(performance.now() - start);

    let status: HealthStatus;
    if (response.ok) {
      status = latency < 1000 ? 'healthy' : 'degraded';
    } else if (response.status === 429) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    // Try to extract rate limit info from headers
    let rateLimitRemaining: number | null = null;
    const rlHeader = response.headers.get('X-RateLimit-Remaining')
      || response.headers.get('x-ratelimit-remaining')
      || response.headers.get('RateLimit-Remaining');
    if (rlHeader) {
      rateLimitRemaining = parseInt(rlHeader, 10);
    }

    return {
      apiId: api.id,
      apiName: api.name,
      status,
      latencyMs: latency,
      statusCode: response.status,
      lastChecked: new Date().toISOString(),
      uptime24h: 0, // calculated from history
      rateLimitRemaining,
      errorMessage: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    const message = err instanceof DOMException && err.name === 'AbortError'
      ? 'Timeout (8s)'
      : err instanceof TypeError
        ? 'CORS / Network Error'
        : String(err);

    return {
      apiId: api.id,
      apiName: api.name,
      status: 'down',
      latencyMs: latency,
      statusCode: 0,
      lastChecked: new Date().toISOString(),
      uptime24h: 0,
      rateLimitRemaining: null,
      errorMessage: message,
    };
  }
}

/**
 * Probe all APIs in parallel and return real metrics
 */
export async function probeAllApis(userApiKeys: Record<string, string> = {}): Promise<APIHealthMetrics[]> {
  const results = await Promise.allSettled(
    APIs.map(api => probeSingleApi(api, userApiKeys))
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      apiId: APIs[i].id,
      apiName: APIs[i].name,
      status: 'down' as HealthStatus,
      latencyMs: 0,
      statusCode: 0,
      lastChecked: new Date().toISOString(),
      uptime24h: 0,
      rateLimitRemaining: null,
      errorMessage: 'Probe failed',
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
