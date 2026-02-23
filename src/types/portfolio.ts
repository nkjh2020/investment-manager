import type { AccountSummary, StockHolding } from './kis';

export interface AllocationItem {
  stockCode: string;
  stockName: string;
  weight: number;
  evalAmount: number;
}

export interface SectorItem {
  sector: string;
  weight: number;
  totalAmount: number;
  stocks: string[];
}

// 자산 유형 구분
export type AssetType = 'stock' | 'bond' | 'fund' | 'cash';

export interface AssetTypeItem {
  type: AssetType;
  label: string;
  amount: number;
  weight: number;
}

export interface PortfolioAnalysis {
  holdings: StockHolding[];
  summary: AccountSummary;
  allocation: AllocationItem[];
  allocationWithCash: AllocationItem[];
  assetTypes: AssetTypeItem[];
  lastUpdated: string;
}

export interface RebalanceTarget {
  stockCode: string;
  stockName: string;
  currentWeight: number;
  targetWeight: number;
  diff: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  suggestedAmount: number;
  targetBalance: number;
}

export interface RebalanceConfig {
  targets: { stockCode: string; targetWeight: number }[];
  totalTargetWeight: number;
  lastModified: string;
}

export interface RefreshConfig {
  autoRefresh: boolean;
  intervalSeconds: number;
}
