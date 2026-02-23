import type { AllocationItem, RebalanceTarget } from '@/types/portfolio';

export function calcRebalance(
  currentAllocation: AllocationItem[],
  targets: { stockCode: string; targetWeight: number }[],
  totalEval: number
): RebalanceTarget[] {
  return targets.map((target) => {
    const current = currentAllocation.find((a) => a.stockCode === target.stockCode);
    const currentWeight = current?.weight ?? 0;
    const diff = target.targetWeight - currentWeight;
    const suggestedAmount = Math.abs((diff / 100) * totalEval);

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (diff > 1) action = 'BUY';
    else if (diff < -1) action = 'SELL';

    const targetBalance = Math.round(totalEval * (target.targetWeight / 100));

    return {
      stockCode: target.stockCode,
      stockName: current?.stockName ?? target.stockCode,
      currentWeight,
      targetWeight: target.targetWeight,
      diff,
      action,
      suggestedAmount: Math.round(suggestedAmount),
      targetBalance,
    };
  });
}
