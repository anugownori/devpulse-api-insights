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
    const { user_id, alert_type, title, message, severity } = await req.json();
    if (!user_id || !title) throw new Error("user_id and title required");

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(user_id);
    const email = userData?.user?.email;
    if (!email) throw new Error("User email not found");

    // Check if user has email webhooks configured
    const { data: webhooks } = await supabase
      .from("webhook_configs")
      .select("*")
      .eq("user_id", user_id)
      .eq("webhook_type", "email")
      .eq("is_active", true);

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ sent: false, reason: "No email webhooks configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For email, we log the intent since we don't have an email service configured
    // In production, integrate with Resend, SendGrid, or AWS SES
    await supabase.from("audit_log").insert({
      user_id,
      action: "email_alert_queued",
      details: { alert_type, title, message, severity, email },
    });

    return new Response(JSON.stringify({
      sent: true,
      email,
      note: "Email alert queued. Configure an email provider (Resend/SendGrid) for delivery.",
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
