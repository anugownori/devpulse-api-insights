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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback without AI
      const trendWord = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";
      return new Response(
        JSON.stringify({
          summary: `Your spending is ${trendWord}. Predicted 14-day cost: $${predicted_14d_total.toFixed(2)}. ${slope > 0.01 ? "Consider reviewing your agent cost limits to prevent overspend." : "Your costs look well-controlled."}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a cost analysis AI for an AI agent monitoring platform called AgentGuard. Analyze these spending patterns and give a concise 2-3 sentence insight.

Historical daily costs (last ${historical_costs.length} days): ${JSON.stringify(historical_costs.map((c: number) => `$${c.toFixed(4)}`))}
Trend slope: ${slope.toFixed(6)} per day
Predicted 14-day total: $${predicted_14d_total.toFixed(2)}

Give actionable advice. Be specific about whether the user should adjust agent limits, switch providers, or if spending is healthy.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });

    const aiData = await response.json();
    const summary = aiData.choices?.[0]?.message?.content || "Unable to generate insight.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Forecast AI error:", error);
    return new Response(
      JSON.stringify({ summary: "Unable to generate AI forecast at this time." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
