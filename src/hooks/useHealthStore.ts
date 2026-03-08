import { create } from "zustand";
import type { APIHealthMetrics } from "@/data/apiData";

interface HealthStore {
  metrics: APIHealthMetrics[];
  probeCount: number;
  isProbing: boolean;
  setMetrics: (m: APIHealthMetrics[]) => void;
  setProbeCount: (n: number) => void;
  setIsProbing: (b: boolean) => void;
}

export const useHealthStore = create<HealthStore>((set) => ({
  metrics: [],
  probeCount: 0,
  isProbing: false,
  setMetrics: (metrics) => set({ metrics }),
  setProbeCount: (probeCount) => set({ probeCount }),
  setIsProbing: (isProbing) => set({ isProbing }),
}));
