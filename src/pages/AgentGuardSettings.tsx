import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, User, Save, Loader2, Crown, Zap, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: string;
  max_agents: number;
};

const plans = [
  { id: "free", name: "Free", price: "$0", agents: 3, features: ["3 agents", "7-day log retention", "Basic alerts", "CSV export"] },
  { id: "pro", name: "Pro", price: "$12/mo", agents: 25, features: ["25 agents", "90-day log retention", "Priority alerts", "API access", "Webhook integrations"] },
  { id: "team", name: "Team", price: "$39/mo", agents: 100, features: ["100 agents", "Unlimited retention", "Team workspaces", "SSO", "Priority support", "Custom webhooks"] },
];

export default function AgentGuardSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/agentguard/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) {
      setProfile(data as Profile);
      setDisplayName(data.display_name || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      fetchProfile();
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/agentguard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-serif text-foreground">Settings</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-serif text-foreground">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <p className="text-sm font-mono text-foreground bg-muted/20 px-4 py-2.5 rounded-xl border border-border">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-serif text-foreground">Subscription Plan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = profile?.plan === plan.id;
              return (
                <div key={plan.id} className={`glass-card rounded-xl p-5 border transition-all ${
                  isCurrent ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
                }`}>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-3">
                      <Zap className="w-2.5 h-2.5" /> Current Plan
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-2xl font-bold font-mono text-primary mt-1">{plan.price}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <Bot className="w-3 h-3" />
                    Up to {plan.agents} agents
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button className="mt-4 w-full py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                      {plan.id === "free" ? "Downgrade" : "Upgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Account Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Account Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="font-medium text-foreground capitalize">{profile?.plan || "free"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Agents</p>
              <p className="font-mono text-foreground">{profile?.max_agents || 3}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="font-mono text-foreground text-xs truncate">{user?.id?.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-mono text-foreground text-xs">{profile ? new Date(profile.id).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
