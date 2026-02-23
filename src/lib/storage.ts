import type { RebalanceConfig, RefreshConfig } from '@/types/portfolio';

const REBALANCE_KEY = 'rebalance-config';
const REFRESH_KEY = 'refresh-config';
const CACHE_KEY = 'last-portfolio-cache';

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function getRebalanceConfig(): RebalanceConfig | null {
  return getItem<RebalanceConfig>(REBALANCE_KEY);
}

export function setRebalanceConfig(config: RebalanceConfig): void {
  setItem(REBALANCE_KEY, config);
}

export function getRefreshConfig(): RefreshConfig {
  return getItem<RefreshConfig>(REFRESH_KEY) || { autoRefresh: false, intervalSeconds: 60 };
}

export function setRefreshConfig(config: RefreshConfig): void {
  setItem(REFRESH_KEY, config);
}

export function getCachedPortfolio<T>(): T | null {
  return getItem<T>(CACHE_KEY);
}

export function setCachedPortfolio<T>(data: T): void {
  setItem(CACHE_KEY, data);
}
