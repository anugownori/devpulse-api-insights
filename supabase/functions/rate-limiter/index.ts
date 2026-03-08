import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { agent_id, user_id } = await req.json();
    if (!agent_id || !user_id) throw new Error("agent_id and user_id required");

    // Get agent config
    const { data: agent } = await supabase
      .from("agents")
      .select("max_api_calls_per_min, max_cost_per_task, max_reasoning_steps, status, name")
      .eq("id", agent_id)
      .single();

    if (!agent) throw new Error("Agent not found");

    // Count API calls in last minute
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCalls } = await supabase
      .from("agent_logs")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agent_id)
      .gte("created_at", oneMinAgo);

    const violations: string[] = [];

    if (agent.max_api_calls_per_min && recentCalls && recentCalls >= agent.max_api_calls_per_min) {
      violations.push(`Rate limit exceeded: ${recentCalls}/${agent.max_api_calls_per_min} calls/min`);
    }

    // Check current task cost
    const { data: taskLogs } = await supabase
      .from("agent_logs")
      .select("cost, step_number")
      .eq("agent_id", agent_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (taskLogs && taskLogs.length > 0) {
      const taskCost = taskLogs.reduce((s, l) => s + Number(l.cost || 0), 0);
      if (agent.max_cost_per_task && taskCost >= agent.max_cost_per_task) {
        violations.push(`Cost limit exceeded: $${taskCost.toFixed(2)}/$${agent.max_cost_per_task}`);
      }

      const maxStep = Math.max(...taskLogs.map(l => l.step_number));
      if (agent.max_reasoning_steps && maxStep >= agent.max_reasoning_steps) {
        violations.push(`Max reasoning steps exceeded: ${maxStep}/${agent.max_reasoning_steps}`);
      }
    }

    if (violations.length > 0) {
      // Pause agent
      await supabase.from("agents").update({ status: "paused" }).eq("id", agent_id);

      // Create alerts
      for (const v of violations) {
        await supabase.from("alerts").insert({
          user_id,
          agent_id,
          alert_type: "rate_limit",
          severity: "critical",
          title: `Rate limit: ${agent.name}`,
          message: v,
        });
      }

      await supabase.from("audit_log").insert({
        user_id,
        agent_id,
        action: "rate_limit_enforced",
        details: { violations },
      });
    }

    return new Response(JSON.stringify({
      allowed: violations.length === 0,
      violations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
