'use client';

import { useMemo, useEffect } from 'react';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { useRebalanceStore } from '@/features/rebalancing/store/rebalanceStore';
import { calcRebalance } from '@/features/rebalancing/utils/calcRebalance';

export function useRebalancing() {
  const { portfolio, isLoading, error } = usePortfolio();
  const { config, setTargets, loadConfig } = useRebalanceStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const rebalanceTargets = useMemo(() => {
    if (!portfolio || config.targets.length === 0) return [];

    // 현금 포함 allocation 사용, 전체 자산 = 종목 평가 + 예수금
    const totalAsset =
      portfolio.holdings.reduce((sum, h) => sum + h.evalAmount, 0) +
      portfolio.summary.totalDeposit;

    return calcRebalance(
      portfolio.allocationWithCash,
      config.targets,
      totalAsset
    );
  }, [portfolio, config.targets]);

  return {
    portfolio,
    config,
    rebalanceTargets,
    setTargets,
    isLoading,
    error,
  };
}
