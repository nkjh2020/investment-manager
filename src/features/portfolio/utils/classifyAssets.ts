import type { StockHolding, AccountSummary } from '@/types/kis';
import type { AssetType, AssetTypeItem } from '@/types/portfolio';

// 종목명 기반으로 자산 유형을 분류
export function classifyAssetType(stockName: string): AssetType {
  const name = stockName.toUpperCase();

  // 채권형 키워드
  const bondKeywords = ['채권', '국채', '회사채', '단기사채', '통안채', 'BOND', '금리', '국고채'];
  if (bondKeywords.some((kw) => name.includes(kw))) return 'bond';

  // 펀드형 키워드 (ETF는 주식으로 분류하되, 채권/머니마켓 ETF는 제외)
  const fundKeywords = ['펀드', 'MMF', 'CMA', '머니마켓', 'RP형', '환매조건부'];
  if (fundKeywords.some((kw) => name.includes(kw))) return 'fund';

  // 나머지는 주식 (ETF 포함)
  return 'stock';
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: '주식/ETF',
  bond: '채권',
  fund: '펀드',
  cash: '현금성자산',
};

export function calcAssetTypeAllocation(
  holdings: StockHolding[],
  summary: AccountSummary
): AssetTypeItem[] {
  // 종목별 자산 유형 분류
  const typeAmounts: Record<AssetType, number> = {
    stock: 0,
    bond: 0,
    fund: 0,
    cash: 0,
  };

  for (const h of holdings) {
    const type = classifyAssetType(h.stockName);
    typeAmounts[type] += h.evalAmount;
  }

  // 예수금 → 현금성자산
  typeAmounts.cash += summary.totalDeposit;

  // 전체 합계 (종목 평가금액 + 예수금)
  const total = Object.values(typeAmounts).reduce((sum, amt) => sum + amt, 0);

  if (total === 0) return [];

  const result: AssetTypeItem[] = [];
  for (const [type, amount] of Object.entries(typeAmounts)) {
    if (amount > 0) {
      result.push({
        type: type as AssetType,
        label: ASSET_TYPE_LABELS[type as AssetType],
        amount,
        weight: (amount / total) * 100,
      });
    }
  }

  // 비중 내림차순 정렬
  return result.sort((a, b) => b.weight - a.weight);
}
