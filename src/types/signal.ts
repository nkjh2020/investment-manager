/**
 * 투자 신호 (Layer 1 + Layer 3) 타입 정의
 */

// ── 시장 상태 ──────────────────────────────────────────────
export type MarketStatusType = 'BULL' | 'NEUTRAL' | 'RISK';

export type ActionType =
  | 'STRONG_BUY'
  | 'BUY'
  | 'ADD'
  | 'HOLD'
  | 'TRIM'
  | 'SELL'
  | 'N/A';

// ── 기술적 지표 ────────────────────────────────────────────
export interface PriceData {
  date: string;
  close: number;
  volume: number;
}

export interface MarketIndexData {
  current: number;
  prev: number;
  change: number;
  changePct: number;
}

export interface Indicators {
  price: number | null;
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  ma200: number | null;
  rsi: number | null;
  vo: number | null;
}

// ── 급락 대응 전략 ─────────────────────────────────────────
export interface CrashStrategy {
  trigger: 'SP500_DROP' | 'VIX_SPIKE';
  description: string;
  day1Pct: number;
  day3Pct: number;
  day7Pct: number;
}

// ── Layer 1: 시장 상태 ─────────────────────────────────────
export interface MarketStatus {
  status: MarketStatusType;
  alert: boolean;
  indicators: {
    kospi: { current: number; changePct: number } | null;
    nasdaq: { current: number; changePct: number } | null;
    sp500: { current: number; changePct: number } | null;
    vix: { current: number } | null;
  };
  crashStrategy: CrashStrategy | null;
}

// ── Layer 3: 종목 신호 ─────────────────────────────────────
export interface SignalScore {
  trend: number;
  momentum: number;
  volume: number;
  total: number;
}

export interface SignalResult {
  stockCode: string;
  stockName: string;
  action: ActionType;
  score: SignalScore;
  indicators: Indicators;
  reason: string;
  suggestion: string;
  currentWeight: number;
  profitRate: number;
}

// ── API 응답 ───────────────────────────────────────────────
export interface SignalsResponse {
  marketStatus: MarketStatus;
  signals: SignalResult[];
  updatedAt: string;
  cached: boolean;
}
