'use client';

import { useMemo, useState } from 'react';
import { useBalance } from '@/features/account/hooks/useBalance';
import { calcAllocation, calcAllocationWithCash, mergeHoldings } from '@/features/portfolio/utils/calcAllocation';
import { calcAssetTypeAllocation } from '@/features/portfolio/utils/classifyAssets';
import type { PortfolioAnalysis } from '@/types/portfolio';
import type { StockHolding, AccountSummary } from '@/types/kis';

export function usePortfolio() {
  const { data, isLoading, error, refetch } = useBalance();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const portfolio = useMemo<PortfolioAnalysis | null>(() => {
    if (!data) return null;

    let holdings: StockHolding[];
    let summary: AccountSummary;

    if (selectedAccountId === 'all') {
      holdings = data.merged.holdings;
      summary = data.merged.summary;
    } else {
      const account = data.accounts.find((a) => a.accountId === selectedAccountId);
      if (!account) return null;
      holdings = account.holdings;
      summary = account.summary;
    }

    // 동일 종목 합산 (전체 계좌 조회 시 여러 계좌에 같은 종목이 있을 수 있음)
    const mergedHoldings = mergeHoldings(holdings);

    return {
      holdings: mergedHoldings,
      summary,
      allocation: calcAllocation(holdings),
      allocationWithCash: calcAllocationWithCash(holdings, summary),
      assetTypes: calcAssetTypeAllocation(mergedHoldings, summary),
      lastUpdated: new Date().toISOString(),
    };
  }, [data, selectedAccountId]);

  const accountList = useMemo(() => {
    if (!data) return [];
    return [
      { id: 'all', label: '전체', hasError: false },
      ...data.accounts.map((a) => ({
        id: a.accountId,
        label: a.accountLabel,
        hasError: !!a.error,
      })),
    ];
  }, [data]);

  return {
    portfolio,
    isLoading,
    error,
    refetch,
    selectedAccountId,
    setSelectedAccountId,
    accountList,
    rawData: data,
  };
}
