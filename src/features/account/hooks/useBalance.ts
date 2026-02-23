'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, MultiAccountBalanceData } from '@/types/api';
import type { AccountInfo } from '@/types/account';

async function fetchMultiAccountBalance(): Promise<MultiAccountBalanceData> {
  const response = await fetch('/api/kis/balance');
  const result: ApiResponse<MultiAccountBalanceData> = await response.json();

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

async function fetchAccounts(): Promise<AccountInfo[]> {
  const response = await fetch('/api/kis/accounts');
  const result: ApiResponse<AccountInfo[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function useBalance() {
  return useQuery({
    queryKey: ['balance', 'all'],
    queryFn: fetchMultiAccountBalance,
    staleTime: 30 * 1000,
    refetchInterval: false,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });
}
