'use client';

import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import type { RebalanceTarget } from '@/types/portfolio';

interface RebalanceTableProps {
  targets: RebalanceTarget[];
}

const actionColors = {
  BUY: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  SELL: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  HOLD: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const actionLabels = {
  BUY: '매수',
  SELL: '매도',
  HOLD: '유지',
};

export default function RebalanceTable({ targets }: RebalanceTableProps) {
  if (targets.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">목표 비중을 설정해주세요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">종목명</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">현재 비중</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">목표 비중</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">차이</th>
            <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">조치</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">제안 금액</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">목표잔고</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {targets.map((target) => (
            <tr key={target.stockCode} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{target.stockName}</td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {target.currentWeight.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {target.targetWeight.toFixed(1)}%
              </td>
              <td className={clsx('px-4 py-3 text-right font-medium', target.diff > 0 ? 'text-red-500' : target.diff < 0 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300')}>
                {target.diff > 0 ? '+' : ''}{target.diff.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-center">
                <span className={clsx('inline-block rounded-full px-2 py-1 text-xs font-medium', actionColors[target.action])}>
                  {actionLabels[target.action]}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {target.action !== 'HOLD' ? `${formatCurrency(target.suggestedAmount)}원` : '-'}
              </td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(target.targetBalance)}원
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
