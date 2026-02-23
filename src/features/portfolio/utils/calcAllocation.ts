import type { StockHolding, AccountSummary } from '@/types/kis';
import type { AllocationItem } from '@/types/portfolio';

// 동일 종목코드를 합산하여 allocation 계산 (현금 미포함)
export function calcAllocation(holdings: StockHolding[]): AllocationItem[] {
  const merged = mergeHoldings(holdings);
  const totalEval = merged.reduce((sum, h) => sum + h.evalAmount, 0);

  if (totalEval === 0) return [];

  return merged.map((h) => ({
    stockCode: h.stockCode,
    stockName: h.stockName,
    weight: (h.evalAmount / totalEval) * 100,
    evalAmount: h.evalAmount,
  }));
}

// 동일 종목코드를 합산 + 현금 포함 allocation (리밸런싱용)
export function calcAllocationWithCash(
  holdings: StockHolding[],
  summary: AccountSummary
): AllocationItem[] {
  const merged = mergeHoldings(holdings);
  const cashAmount = summary.totalDeposit;
  const totalEval = merged.reduce((sum, h) => sum + h.evalAmount, 0) + cashAmount;

  if (totalEval === 0) return [];

  const result: AllocationItem[] = merged.map((h) => ({
    stockCode: h.stockCode,
    stockName: h.stockName,
    weight: (h.evalAmount / totalEval) * 100,
    evalAmount: h.evalAmount,
  }));

  if (cashAmount > 0) {
    result.push({
      stockCode: 'CASH',
      stockName: '현금성자산',
      weight: (cashAmount / totalEval) * 100,
      evalAmount: cashAmount,
    });
  }

  return result;
}

// 동일 종목코드를 가진 holdings를 합산
function mergeHoldings(holdings: StockHolding[]): StockHolding[] {
  const map = new Map<string, StockHolding>();

  for (const h of holdings) {
    const existing = map.get(h.stockCode);
    if (existing) {
      const totalQty = existing.quantity + h.quantity;
      const totalPurchase = existing.purchaseAmount + h.purchaseAmount;
      const totalEval = existing.evalAmount + h.evalAmount;
      const totalProfit = existing.evalProfit + h.evalProfit;

      map.set(h.stockCode, {
        ...existing,
        quantity: totalQty,
        avgPurchasePrice: totalQty > 0 ? totalPurchase / totalQty : 0,
        currentPrice: h.currentPrice, // 동일 종목이므로 현재가 동일
        evalAmount: totalEval,
        evalProfit: totalProfit,
        evalProfitRate: totalPurchase > 0 ? (totalProfit / totalPurchase) * 100 : 0,
        purchaseAmount: totalPurchase,
        accountId: 'merged',
        accountLabel: '통합',
      });
    } else {
      map.set(h.stockCode, { ...h });
    }
  }

  return Array.from(map.values());
}

// 합산된 holdings 반환 (외부에서도 사용 가능)
export { mergeHoldings };
