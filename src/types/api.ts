import type { AccountSummary, StockHolding } from './kis';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryAfter?: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface BalanceData {
  holdings: StockHolding[];
  summary: AccountSummary;
  hasMore: boolean;
  continuationKey?: {
    fk100: string;
    nk100: string;
  };
}

export interface AccountBalanceData {
  accountId: string;
  accountLabel: string;
  holdings: StockHolding[];
  summary: AccountSummary;
  error?: string;
}

export interface MultiAccountBalanceData {
  accounts: AccountBalanceData[];
  merged: {
    holdings: StockHolding[];
    summary: AccountSummary;
  };
}
