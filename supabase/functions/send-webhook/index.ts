import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, alert_type, title, message, severity } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active webhooks for this user that match the event
    const { data: webhooks } = await supabase
      .from("webhook_configs")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true);

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const wh of webhooks) {
      // Check if webhook is subscribed to this event
      if (!wh.events.includes(alert_type)) continue;

      let payload: Record<string, unknown>;

      if (wh.webhook_type === "slack") {
        payload = {
          text: `🛡️ *AgentGuard Alert* [${severity?.toUpperCase()}]\n*${title}*\n${message}`,
        };
      } else if (wh.webhook_type === "discord") {
        payload = {
          content: `🛡️ **AgentGuard Alert** [${severity?.toUpperCase()}]\n**${title}**\n${message}`,
        };
      } else {
        // Generic webhook (email services like Zapier/IFTTT)
        payload = { alert_type, title, message, severity, timestamp: new Date().toISOString() };
      }

      try {
        await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send webhook to ${wh.url}:`, err);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook send error:", error);
    return new Response(JSON.stringify({ error: "Failed to send webhooks" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
