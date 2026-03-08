import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { agent_id, user_id, window_minutes = 5, repeat_threshold = 10 } = await req.json();

    if (!agent_id || !user_id) {
      return new Response(JSON.stringify({ error: "agent_id and user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const windowStart = new Date(Date.now() - window_minutes * 60 * 1000).toISOString();

    // Get recent logs for this agent
    const { data: logs, error } = await supabase
      .from("agent_logs")
      .select("action_type, task_id, step_number, created_at")
      .eq("agent_id", agent_id)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Detect repeated action patterns
    const actionCounts: Record<string, number> = {};
    for (const log of logs || []) {
      const key = `${log.action_type}:${log.task_id || "no-task"}`;
      actionCounts[key] = (actionCounts[key] || 0) + 1;
    }

    const loops = Object.entries(actionCounts)
      .filter(([, count]) => count >= repeat_threshold)
      .map(([key, count]) => ({ action: key, repetitions: count }));

    if (loops.length > 0) {
      // Pause the agent
      await supabase.from("agents").update({ status: "paused" }).eq("id", agent_id);

      // Mark logs as loop detected
      await supabase.from("agent_logs")
        .update({ is_loop_detected: true })
        .eq("agent_id", agent_id)
        .gte("created_at", windowStart);

      // Create alert
      await supabase.from("alerts").insert({
        user_id,
        agent_id,
        alert_type: "loop_detected",
        severity: "critical",
        title: "Infinite loop detected",
        message: `Agent repeated "${loops[0].action}" ${loops[0].repetitions} times in ${window_minutes} minutes. Agent has been auto-paused.`,
        metadata: { loops, window_minutes },
      });

      // Audit log
      await supabase.from("audit_log").insert({
        user_id,
        agent_id,
        action: "loop_detected_auto_pause",
        details: { loops, window_minutes },
      });

      return new Response(JSON.stringify({
        loop_detected: true,
        loops,
        action_taken: "agent_paused",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ loop_detected: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
