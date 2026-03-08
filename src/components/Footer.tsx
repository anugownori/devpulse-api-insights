import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-serif font-bold text-foreground">
            Dev<span className="text-primary">Pulse</span>
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
