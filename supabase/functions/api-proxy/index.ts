import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_HOSTS = new Set([
  "api.openweathermap.org",
  "api.opencagedata.com",
  "api.themoviedb.org",
  "api.alphavantage.co",
  "api.rawg.io",
  "api.thedogapi.com",
  "api.opentripmap.com",
  "api.groq.com",
  "api-inference.huggingface.co",
  "www.omdbapi.com",
  "api.ncei.noaa.gov",
  "api.coingecko.com",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, apiKeyId } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedUrl = new URL(url);
    
    if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return new Response(JSON.stringify({ error: "Host not allowed" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: "Invalid protocol" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let apiKey = null;
    if (apiKeyId) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      if (claimsData?.claims?.sub) {
        const { data: keyData } = await supabase
          .from("user_api_keys")
          .select("encrypted_key")
          .eq("id", apiKeyId)
          .eq("user_id", claimsData.claims.sub)
          .single();
        
        if (keyData?.encrypted_key) {
          apiKey = keyData.encrypted_key;
        }
      }
    }

    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {},
    };

    if (apiKey) {
      const updatedUrl = new URL(parsedUrl);
      if (updatedUrl.searchParams.has("api_key")) {
        updatedUrl.searchParams.set("api_key", apiKey);
      } else if (updatedUrl.searchParams.has("key")) {
        updatedUrl.searchParams.set("key", apiKey);
      } else if (updatedUrl.searchParams.has("appid")) {
        updatedUrl.searchParams.set("appid", apiKey);
      }
      parsedUrl.href = updatedUrl.href;
    }

    const response = await fetch(parsedUrl.href, fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
