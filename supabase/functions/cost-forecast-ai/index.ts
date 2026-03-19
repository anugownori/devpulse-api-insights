const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://devpluse.in",
]);

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin || "") ? origin! : "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historical_costs, dates, slope, predicted_14d_total } = await req.json();

    const trendWord = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";
    return new Response(
      JSON.stringify({
        summary: `Your spending is ${trendWord}. Predicted 14-day cost: $${predicted_14d_total.toFixed(2)}. ${slope > 0.01 ? "Consider reviewing your agent cost limits to prevent overspend." : "Your costs look well-controlled."}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Forecast AI error:", error);
    return new Response(
      JSON.stringify({ summary: "Unable to generate AI forecast at this time." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
