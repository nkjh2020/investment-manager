'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { StockHolding } from '@/types/kis';
import { formatCurrency } from '@/lib/format';
import { mergeHoldings } from '@/features/portfolio/utils/calcAllocation';

interface ProfitLineChartProps {
  holdings: StockHolding[];
}

export default function ProfitLineChart({ holdings }: ProfitLineChartProps) {
  if (holdings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-600 dark:text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  // 동일 종목 합산 후 전체 이름 표시
  const merged = mergeHoldings(holdings);
  const data = merged.map((h) => ({
    name: h.stockName,
    profit: h.evalProfit,
    rate: h.evalProfitRate,
  }));

  // 가장 긴 종목명 기준으로 하단 여백 계산
  const maxNameLen = Math.max(...data.map((d) => d.name.length));
  const bottomMargin = maxNameLen > 6 ? 60 : 20;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">종목별 손익</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: bottomMargin }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={maxNameLen > 6 ? -30 : 0}
            textAnchor={maxNameLen > 6 ? 'end' : 'middle'}
            interval={0}
          />
          <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${formatCurrency(Number(value))}원`, '손익']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#ef4444' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
