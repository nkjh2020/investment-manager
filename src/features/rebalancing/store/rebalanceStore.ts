import { create } from 'zustand';
import type { RebalanceConfig } from '@/types/portfolio';
import { getRebalanceConfig, setRebalanceConfig } from '@/lib/storage';

interface RebalanceState {
  config: RebalanceConfig;
  setTargets: (targets: RebalanceConfig['targets']) => void;
  loadConfig: () => void;
}

const defaultConfig: RebalanceConfig = {
  targets: [],
  totalTargetWeight: 0,
  lastModified: new Date().toISOString(),
};

export const useRebalanceStore = create<RebalanceState>((set) => ({
  config: defaultConfig,

  setTargets: (targets) => {
    const totalTargetWeight = targets.reduce((sum, t) => sum + t.targetWeight, 0);
    const config: RebalanceConfig = {
      targets,
      totalTargetWeight,
      lastModified: new Date().toISOString(),
    };
    setRebalanceConfig(config);
    set({ config });
  },

  loadConfig: () => {
    const saved = getRebalanceConfig();
    if (saved) {
      set({ config: saved });
    }
  },
}));
