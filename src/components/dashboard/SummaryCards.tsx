'use client';

import { clsx } from 'clsx';
import { formatCurrency, formatPercent, getProfitColor, getProfitBgColor } from '@/lib/format';
import type { AccountSummary } from '@/types/kis';

interface SummaryCardsProps {
  summary: AccountSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: '총 평가금액',
      value: `${formatCurrency(summary.totalEvaluation)}원`,
      color: 'text-gray-900 dark:text-white',
      bg: 'bg-white dark:bg-gray-800',
    },
    {
      label: '총 손익',
      value: `${formatCurrency(summary.totalEvalProfit)}원`,
      color: getProfitColor(summary.totalEvalProfit),
      bg: getProfitBgColor(summary.totalEvalProfit),
    },
    {
      label: '총 수익률',
      value: formatPercent(summary.totalEvalProfitRate),
      color: getProfitColor(summary.totalEvalProfitRate),
      bg: getProfitBgColor(summary.totalEvalProfitRate),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={clsx(
            'rounded-xl border border-gray-200 p-6 shadow-sm dark:border-gray-700',
            card.bg
          )}
        >
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.label}</p>
          <p className={clsx('mt-2 text-2xl font-bold', card.color)}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
