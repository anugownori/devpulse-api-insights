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
  // === Already existing ===
  { id: 'usgs', name: 'USGS Earthquake', category: 'Geoscience', description: 'Earthquake monitoring', requiresKey: false, testUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1' },
  { id: 'wikipedia', name: 'Wikipedia', category: 'Knowledge', description: 'Free encyclopedia API', requiresKey: false, testUrl: 'https://en.wikipedia.org/api/rest_v1/page/summary/API' },
  { id: 'restcountries', name: 'REST Countries', category: 'Geography', description: 'Country information', requiresKey: false, testUrl: 'https://restcountries.com/v3.1/name/india' },
  { id: 'spacex', name: 'SpaceX', category: 'Space', description: 'SpaceX launch data', requiresKey: false, testUrl: 'https://api.spacexdata.com/v4/launches/latest' },
  { id: 'openmeteo', name: 'Open Meteo', category: 'Weather', description: 'Weather forecast API', requiresKey: false, testUrl: 'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m' },
  { id: 'openlibrary', name: 'Open Library', category: 'Knowledge', description: 'Book information', requiresKey: false, testUrl: 'https://openlibrary.org/search.json?q=python&limit=1' },
  { id: 'coinpaprika', name: 'CoinPaprika', category: 'Finance', description: 'Cryptocurrency data', requiresKey: false, testUrl: 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin' },
  { id: 'nasa', name: 'NASA APOD', category: 'Space', description: 'Astronomy picture of the day', requiresKey: false, testUrl: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY' },
  { id: 'internetarchive', name: 'Internet Archive', category: 'Knowledge', description: 'Digital library', requiresKey: false, testUrl: 'https://archive.org/metadata/nasa' },
  { id: 'openaq', name: 'OpenAQ', category: 'Environment', description: 'Real time air quality data', requiresKey: false, testUrl: 'https://api.openaq.org/v3/locations?limit=1&country=IN' },
  { id: 'worldbank', name: 'World Bank', category: 'Economics', description: 'Global economic indicators', requiresKey: false, testUrl: 'https://api.worldbank.org/v2/country/IN?format=json' },
  { id: 'who', name: 'WHO GHO', category: 'Health', description: 'Global health observatory', requiresKey: false, testUrl: 'https://ghoapi.azureedge.net/api/WHOSIS_000001?$top=1' },
  { id: 'semanticscholar', name: 'Semantic Scholar', category: 'Research', description: 'Academic paper search', requiresKey: false, testUrl: 'https://api.semanticscholar.org/graph/v1/paper/search?query=ml&limit=1' },
  { id: 'gdelt', name: 'GDELT Project', category: 'News', description: 'Global event database', requiresKey: false, testUrl: 'https://api.gdeltproject.org/api/v2/doc/doc?query=test&mode=artlist&maxrecords=1&format=json' },
  { id: 'duckduckgo', name: 'DuckDuckGo', category: 'Search', description: 'Instant answers API', requiresKey: false, testUrl: 'https://api.duckduckgo.com/?q=test&format=json' },

  // === NEW from PDF ===
  { id: 'fakestore', name: 'Fake Store', category: 'E Commerce', description: 'Mock e commerce products, carts & users', requiresKey: false, testUrl: 'https://fakestoreapi.com/products/1' },
  { id: 'dogapi', name: 'The Dog API', category: 'Animals', description: 'Dog breeds, images & traits', requiresKey: true, testUrl: 'https://api.thedogapi.com/v1/breeds?limit=1' },
  { id: 'rawg', name: 'RAWG Games', category: 'Gaming', description: 'Video game database', requiresKey: true, testUrl: 'https://api.rawg.io/api/games?key=KEY&page_size=1' },
  { id: 'opentriviadb', name: 'Open Trivia DB', category: 'Entertainment', description: 'Trivia questions by category/difficulty', requiresKey: false, testUrl: 'https://opentdb.com/api.php?amount=1' },
  { id: 'opentripmap', name: 'OpenTripMap', category: 'Tourism', description: 'Tourism places & POIs worldwide', requiresKey: true, testUrl: 'https://api.opentripmap.com/0.1/en/places/geoname?name=Paris' },
  { id: 'openmeteo_marine', name: 'Open Meteo Marine', category: 'Weather', description: 'Marine weather forecasts', requiresKey: false, testUrl: 'https://marine-api.open-meteo.com/v1/marine?latitude=54.5&longitude=10.1&hourly=wave_height&forecast_days=1' },
  { id: 'omdb', name: 'OMDb', category: 'Entertainment', description: 'Movie & TV show database', requiresKey: true, testUrl: 'https://www.omdbapi.com/?t=inception&apikey=KEY' },
  { id: 'opensky', name: 'OpenSky Network', category: 'Aviation', description: 'Real-time aircraft tracking', requiresKey: false, testUrl: 'https://opensky-network.org/api/states/all?lamin=45.8389&lomin=5.9962&lamax=47.8229&lomax=10.5226' },
  { id: 'noaa', name: 'NOAA Climate', category: 'Environment', description: 'Historical climate & weather datasets', requiresKey: true, testUrl: 'https://www.ncei.noaa.gov/cdo-web/api/v2/datasets' },
  { id: 'reddit', name: 'Reddit JSON', category: 'Social', description: 'Posts, comments & subreddit data', requiresKey: false, testUrl: 'https://www.reddit.com/r/programming/top.json?limit=1' },
  { id: 'europarl', name: 'EU Parliament', category: 'Government', description: 'Parliamentary debates & voting records', requiresKey: false, testUrl: 'https://data.europarl.europa.eu/api/v1/meps?format=application%2Fld%2Bjson&offset=0&limit=1' },
  { id: 'groq', name: 'Groq AI', category: 'AI/ML', description: 'Fast LLM inference (Llama, Mixtral)', requiresKey: true, testUrl: 'https://api.groq.com/openai/v1/models' },
  { id: 'huggingface', name: 'Hugging Face', category: 'AI/ML', description: 'NLP, vision & ML model inference', requiresKey: true, testUrl: 'https://api-inference.huggingface.co/models/gpt2' },
  { id: 'alphavantage', name: 'Alpha Vantage', category: 'Finance', description: 'Stocks, forex & crypto data', requiresKey: true, testUrl: 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo' },
  { id: 'tmdb', name: 'TMDB', category: 'Entertainment', description: 'Movies, TV shows, actors & ratings', requiresKey: true, testUrl: 'https://api.themoviedb.org/3/movie/popular?api_key=KEY' },
  { id: 'openweather', name: 'OpenWeather', category: 'Weather', description: 'Current weather & forecasts', requiresKey: true, testUrl: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=KEY' },
  { id: 'opencage', name: 'OpenCage Geocoding', category: 'Geography', description: 'Forward & reverse geocoding', requiresKey: true, testUrl: 'https://api.opencagedata.com/geocode/v1/json?q=Berlin&key=KEY' },
  { id: 'openchargemap', name: 'Open Charge Map', category: 'Energy', description: 'Global EV charging station locations', requiresKey: false, testUrl: 'https://api.openchargemap.io/v3/poi/?output=json&maxresults=1&compact=true&verbose=false' },
  { id: 'openstreetmap', name: 'OpenStreetMap', category: 'Geography', description: 'Open map data & geographic elements', requiresKey: false, testUrl: 'https://nominatim.openstreetmap.org/search?q=berlin&format=json&limit=1' },
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
  // Original edges
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

  // New edges for PDF APIs
  { source: 'fakestore', target: 'tmdb', score: 52, reason: 'Mock product data + entertainment catalog' },
  { source: 'opentriviadb', target: 'wikipedia', score: 74, reason: 'Trivia answers enriched with encyclopedia data' },
  { source: 'openmeteo_marine', target: 'openmeteo', score: 95, reason: 'Land + marine weather data synergy' },
  { source: 'openmeteo_marine', target: 'opensky', score: 62, reason: 'Marine weather conditions for aviation routes' },
  { source: 'opensky', target: 'openmeteo', score: 72, reason: 'Flight tracking with weather overlay' },
  { source: 'opensky', target: 'restcountries', score: 58, reason: 'Aircraft positions mapped to country data' },
  { source: 'reddit', target: 'gdelt', score: 70, reason: 'Social media sentiment + global news events' },
  { source: 'reddit', target: 'duckduckgo', score: 65, reason: 'Reddit discussions + instant search answers' },
  { source: 'alphavantage', target: 'coinpaprika', score: 88, reason: 'Traditional stocks + crypto market data' },
  { source: 'alphavantage', target: 'worldbank', score: 72, reason: 'Stock markets + economic indicators' },
  { source: 'tmdb', target: 'omdb', score: 92, reason: 'Two movie databases for cross-referencing' },
  { source: 'tmdb', target: 'opentriviadb', score: 55, reason: 'Movie data + entertainment trivia' },
  { source: 'openweather', target: 'openmeteo', score: 90, reason: 'Two weather sources for comparison' },
  { source: 'openweather', target: 'openaq', score: 80, reason: 'Weather conditions + air quality correlation' },
  { source: 'opencage', target: 'restcountries', score: 78, reason: 'Geocoding + country metadata' },
  { source: 'opencage', target: 'openstreetmap', score: 88, reason: 'Geocoding + open map data' },
  { source: 'openstreetmap', target: 'openchargemap', score: 82, reason: 'Map rendering + EV charger locations' },
  { source: 'openstreetmap', target: 'opentripmap', score: 85, reason: 'Map data + tourism POIs' },
  { source: 'openchargemap', target: 'openmeteo', score: 55, reason: 'Charging stations + weather at location' },
  { source: 'europarl', target: 'worldbank', score: 60, reason: 'EU legislation + economic impact data' },
  { source: 'europarl', target: 'gdelt', score: 68, reason: 'Parliamentary activity + global news events' },
  { source: 'groq', target: 'huggingface', score: 90, reason: 'Both AI inference APIs, model comparison' },
  { source: 'groq', target: 'semanticscholar', score: 65, reason: 'AI inference + research paper analysis' },
  { source: 'huggingface', target: 'wikipedia', score: 60, reason: 'NLP models + encyclopedia text corpus' },
  { source: 'noaa', target: 'openmeteo', score: 85, reason: 'Historical climate + live weather forecast' },
  { source: 'noaa', target: 'usgs', score: 70, reason: 'Climate data + geological events' },
  { source: 'dogapi', target: 'opentriviadb', score: 45, reason: 'Fun data APIs for entertainment apps' },
  { source: 'rawg', target: 'tmdb', score: 62, reason: 'Games + movies entertainment data' },
  { source: 'rawg', target: 'reddit', score: 68, reason: 'Game data + community discussions' },
];
