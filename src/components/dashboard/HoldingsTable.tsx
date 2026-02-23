'use client';

import { clsx } from 'clsx';
import { formatCurrency, formatPercent, getProfitColor } from '@/lib/format';
import type { StockHolding } from '@/types/kis';

interface HoldingsTableProps {
  holdings: StockHolding[];
  showAccount?: boolean;
}

export default function HoldingsTable({ holdings, showAccount = true }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">보유 종목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">종목명</th>
            {showAccount && (
              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">계좌</th>
            )}
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">수량</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">매입가</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">현재가</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">평가금액</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">손익</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">수익률</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {holdings.map((stock, idx) => (
            <tr key={`${stock.accountId}-${stock.stockCode}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                <div>{stock.stockName}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{stock.stockCode}</div>
              </td>
              {showAccount && (
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                    {stock.accountLabel}
                  </span>
                </td>
              )}
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(stock.quantity)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(stock.avgPurchasePrice)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(stock.currentPrice)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(stock.evalAmount)}
              </td>
              <td className={clsx('px-4 py-3 text-right font-medium', getProfitColor(stock.evalProfit))}>
                {formatCurrency(stock.evalProfit)}
              </td>
              <td className={clsx('px-4 py-3 text-right font-medium', getProfitColor(stock.evalProfitRate))}>
                {formatPercent(stock.evalProfitRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
