import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const AgentGuardDashboard = lazy(() => import("./pages/AgentGuardDashboard"));
const AgentGuardAuth = lazy(() => import("./pages/AgentGuardAuth"));
const AgentGuardSDKDocs = lazy(() => import("./pages/AgentGuardSDKDocs"));
const AgentGuardResetPassword = lazy(() => import("./pages/AgentGuardResetPassword"));
const AgentGuardAgentDetail = lazy(() => import("./pages/AgentGuardAgentDetail"));
const AgentGuardSettings = lazy(() => import("./pages/AgentGuardSettings"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/agentguard" element={<AgentGuardDashboard />} />
              <Route path="/agentguard/auth" element={<AgentGuardAuth />} />
              <Route path="/agentguard/docs" element={<AgentGuardSDKDocs />} />
              <Route path="/agentguard/reset-password" element={<AgentGuardResetPassword />} />
              <Route path="/agentguard/agent/:agentId" element={<AgentGuardAgentDetail />} />
              <Route path="/agentguard/settings" element={<AgentGuardSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
