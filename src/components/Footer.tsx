import { Zap, Github, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-bold text-foreground">
            DEV<span className="text-neon-cyan">PULSE</span>
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            Built for GDG CodeSprint 4.0
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Real-time API Intelligence for the Developer Community
        </p>
      </div>
    </footer>
  );
}
