import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historical_costs, dates, slope, predicted_14d_total } = await req.json();

    // Lovable API removed. Only fallback summary is provided.
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
