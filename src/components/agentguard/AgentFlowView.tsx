import { motion } from "framer-motion";
import { MessageSquare, Search, Code2, Cpu, ArrowDown, Bot } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  framework: string | null;
  status: string;
};

interface Props {
  agents: Agent[];
}

const demoSteps = [
  { icon: MessageSquare, label: "User Query", color: "text-primary", desc: "Input received" },
  { icon: Cpu, label: "Planner Agent", color: "text-secondary", desc: "Deciding next steps" },
  { icon: Search, label: "Search Tool", color: "text-accent", desc: "Fetching data" },
  { icon: Code2, label: "Scraper", color: "text-status-degraded", desc: "Extracting content" },
  { icon: Bot, label: "LLM Response", color: "text-status-healthy", desc: "Generating output" },
];

export default function AgentFlowView({ agents }: Props) {
  if (agents.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-border">
        <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Agent Flow Visualization</h3>
        <p className="text-muted-foreground">Add agents and run tasks to see the execution flow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold font-serif text-foreground mb-6">Agent Execution Flow</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This visualization shows how your agent processes tasks step-by-step. Connect your agent SDK to see real flows.
        </p>

        {/* Flow visualization */}
        <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
          {demoSteps.map((step, i) => (
            <div key={step.label}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-xl p-4 border border-border flex items-center gap-3 w-72"
              >
                <div className={`w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
              {i < demoSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent SDK integration hint */}
      <div className="glass-card rounded-xl p-6 border border-border">
        <h4 className="font-semibold text-foreground mb-2">🔧 SDK Integration</h4>
        <p className="text-sm text-muted-foreground mb-3">
          To see real agent flows, integrate the AgentGuard SDK into your agent:
        </p>
        <pre className="text-xs font-mono p-4 rounded-lg bg-muted/30 border border-border text-muted-foreground overflow-x-auto">
{`import { AgentGuard } from '@agentguard/sdk';

const guard = new AgentGuard({
  apiKey: 'ag_xxxx',
  agentId: '${agents[0]?.id || 'your-agent-id'}'
});

// Wrap your agent calls
const result = await guard.track(async () => {
  return await openai.chat.completions.create({...});
});`}
        </pre>
      </div>
    </div>
  );
}
