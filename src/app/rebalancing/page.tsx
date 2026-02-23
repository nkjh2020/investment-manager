'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRebalancing } from '@/features/rebalancing/hooks/useRebalancing';
import { calcRebalance } from '@/features/rebalancing/utils/calcRebalance';
import RebalanceTable from '@/components/rebalancing/RebalanceTable';
import RebalancePieCharts from '@/components/rebalancing/RebalancePieCharts';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorDisplay from '@/components/ui/ErrorBoundary';
import { formatCurrency } from '@/lib/format';
import { clsx } from 'clsx';

export default function RebalancingPage() {
  const { portfolio, config, rebalanceTargets, setTargets, isLoading, error } = useRebalancing();
  const [localTargets, setLocalTargets] = useState<{ stockCode: string; targetWeight: number }[]>([]);

  useEffect(() => {
    if (!portfolio?.allocationWithCash) return;

    const currentCodes = portfolio.allocationWithCash.map((a) => a.stockCode);
    const savedMap = new Map(config.targets.map((t) => [t.stockCode, t.targetWeight]));

    // 현재 보유 종목 전체를 기반으로 타겟 생성
    // 저장된 비중이 있으면 사용, 없으면 현재 비중으로 초기화
    const merged = currentCodes.map((code) => {
      const current = portfolio.allocationWithCash.find((a) => a.stockCode === code);
      return {
        stockCode: code,
        targetWeight: savedMap.has(code)
          ? savedMap.get(code)!
          : Math.round((current?.weight ?? 0) * 10) / 10,
      };
    });

    setLocalTargets(merged);
  }, [config.targets, portfolio?.allocationWithCash]);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (error) return <ErrorDisplay message={error.message} />;
  if (!portfolio) return null;

  const totalWeight = localTargets.reduce((sum, t) => sum + t.targetWeight, 0);
  const isValid = Math.abs(totalWeight - 100) < 0.5;

  const handleWeightChange = (stockCode: string, value: string) => {
    const weight = parseFloat(value) || 0;
    setLocalTargets((prev) =>
      prev.map((t) => (t.stockCode === stockCode ? { ...t, targetWeight: weight } : t))
    );
  };

  const handleSave = () => {
    setTargets(localTargets);
  };

  // 현금 포함 allocation 사용
  const currentAllocation = portfolio.allocationWithCash;

  const targetAllocation = localTargets.map((t) => {
    const holding = currentAllocation.find((a) => a.stockCode === t.stockCode);
    return {
      stockCode: t.stockCode,
      stockName: holding?.stockName ?? t.stockCode,
      targetWeight: t.targetWeight,
    };
  });

  const totalAsset =
    portfolio.holdings.reduce((sum, h) => sum + h.evalAmount, 0) +
    portfolio.summary.totalDeposit;

  // localTargets 기반으로 실시간 테이블 계산 (비중 변경 시 즉시 반영)
  const liveRebalanceTargets = useMemo(() => {
    if (localTargets.length === 0) return [];
    return calcRebalance(currentAllocation, localTargets, totalAsset);
  }, [currentAllocation, localTargets, totalAsset]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">리밸런싱</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            전체 자산: {formatCurrency(totalAsset)}원 (종목 + 현금)
          </p>
        </div>
        <button
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!isValid}
        >
          저장
        </button>
      </div>

      {/* 목표 비중 입력 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">목표 비중 설정</h2>
        <p className="mb-3 text-xs text-gray-700 dark:text-gray-300">
          * 동일 종목은 전 계좌 합산, 현금성자산 포함
        </p>
        <div className="space-y-3">
          {localTargets.map((target) => {
            const holding = currentAllocation.find((a) => a.stockCode === target.stockCode);
            const isCash = target.stockCode === 'CASH';
            return (
              <div key={target.stockCode} className="flex items-center gap-4">
                <span className={clsx(
                  'w-48 truncate text-sm font-medium',
                  isCash
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300'
                )}>
                  {holding?.stockName ?? target.stockCode}
                </span>
                <span className="w-20 text-right text-sm text-gray-700 dark:text-gray-300">
                  현재 {holding?.weight.toFixed(1) ?? '0.0'}%
                </span>
                <input
                  type="number"
                  value={target.targetWeight}
                  onChange={(e) => handleWeightChange(target.stockCode, e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-right text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">합계:</span>
          <span
            className={clsx(
              'text-sm font-bold',
              isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {totalWeight.toFixed(1)}%
          </span>
          {isValid ? (
            <span className="text-xs text-green-600 dark:text-green-400">Valid</span>
          ) : (
            <span className="text-xs text-red-600 dark:text-red-400">합계가 100%가 아닙니다</span>
          )}
        </div>
      </div>

      <RebalanceTable targets={liveRebalanceTargets} />

      <RebalancePieCharts
        currentAllocation={currentAllocation}
        targetAllocation={targetAllocation}
      />
    </div>
  );
}
