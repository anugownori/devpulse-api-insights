import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common API key patterns
const KEY_PATTERNS = [
  { name: "OpenAI", pattern: /sk-[a-zA-Z0-9]{20,}/ },
  { name: "Anthropic", pattern: /sk-ant-[a-zA-Z0-9-]{20,}/ },
  { name: "Google AI", pattern: /AIza[a-zA-Z0-9_-]{35}/ },
  { name: "Stripe", pattern: /sk_live_[a-zA-Z0-9]{20,}/ },
  { name: "Stripe Test", pattern: /sk_test_[a-zA-Z0-9]{20,}/ },
  { name: "AWS", pattern: /AKIA[A-Z0-9]{16}/ },
  { name: "GitHub", pattern: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "Hugging Face", pattern: /hf_[a-zA-Z0-9]{34}/ },
  { name: "Cohere", pattern: /[a-zA-Z0-9]{40}/ },
  { name: "Replicate", pattern: /r8_[a-zA-Z0-9]{37}/ },
];

function scanForKeys(text: string): Array<{ provider: string; matched: string; masked: string }> {
  const findings: Array<{ provider: string; matched: string; masked: string }> = [];
  
  for (const { name, pattern } of KEY_PATTERNS) {
    const matches = text.match(new RegExp(pattern, "g"));
    if (matches) {
      for (const match of matches) {
        const masked = match.substring(0, 6) + "..." + match.substring(match.length - 4);
        findings.push({ provider: name, matched: match, masked });
      }
    }
  }
  return findings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { agent_id, user_id, scan_minutes = 60 } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const windowStart = new Date(Date.now() - scan_minutes * 60 * 1000).toISOString();

    let query = supabase
      .from("agent_logs")
      .select("id, agent_id, raw_log, created_at")
      .eq("user_id", user_id)
      .gte("created_at", windowStart);

    if (agent_id) query = query.eq("agent_id", agent_id);

    const { data: logs, error } = await query.limit(500);
    if (error) throw error;

    const allLeaks: Array<{
      log_id: string;
      agent_id: string;
      provider: string;
      masked: string;
    }> = [];

    for (const log of logs || []) {
      const rawText = JSON.stringify(log.raw_log || {});
      const findings = scanForKeys(rawText);
      
      for (const finding of findings) {
        allLeaks.push({
          log_id: log.id,
          agent_id: log.agent_id,
          provider: finding.provider,
          masked: finding.masked,
        });
      }
    }

    if (allLeaks.length > 0) {
      // Group by agent
      const agentLeaks = new Map<string, typeof allLeaks>();
      for (const leak of allLeaks) {
        const existing = agentLeaks.get(leak.agent_id) || [];
        existing.push(leak);
        agentLeaks.set(leak.agent_id, existing);
      }

      for (const [agId, leaks] of agentLeaks) {
        // Create alert
        await supabase.from("alerts").insert({
          user_id,
          agent_id: agId,
          alert_type: "key_leak",
          severity: "critical",
          title: `API key leak detected: ${leaks[0].provider}`,
          message: `Found ${leaks.length} exposed key(s) from ${leaks.map(l => l.provider).join(", ")}. Keys: ${leaks.map(l => l.masked).join(", ")}`,
          metadata: { leaks },
        });

        // Update agent_api_keys if they exist
        for (const leak of leaks) {
          await supabase.from("agent_api_keys")
            .update({ is_leaked: true, leak_detected_at: new Date().toISOString() })
            .eq("agent_id", agId)
            .eq("provider", leak.provider);
        }
      }

      // Audit log
      await supabase.from("audit_log").insert({
        user_id,
        action: "leak_scan_found",
        details: { total_leaks: allLeaks.length, agents_affected: [...agentLeaks.keys()] },
      });
    }

    return new Response(JSON.stringify({
      scanned_logs: (logs || []).length,
      leaks_found: allLeaks.length,
      leaks: allLeaks.map(l => ({ agent_id: l.agent_id, provider: l.provider, masked: l.masked })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
