'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { AllocationItem } from '@/types/portfolio';
import { formatCurrency } from '@/lib/format';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
];

interface AllocationPieChartProps {
  allocation: AllocationItem[];
  title?: string;
}

export default function AllocationPieChart({ allocation, title = '자산 배분' }: AllocationPieChartProps) {
  if (allocation.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-600 dark:text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  const data = allocation.map((item) => ({
    name: item.stockName,
    value: item.evalAmount,
    weight: item.weight,
  }));

  // 종목 수에 따라 차트 높이 동적 조정
  const chartHeight = Math.max(300, 200 + data.length * 20);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={data}
            cx="35%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${formatCurrency(Number(value))}원`, '평가금액']}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: '11px', lineHeight: '1.6' }}
            formatter={(value) => {
              const item = data.find((d) => d.name === value);
              return `${value} (${item?.weight.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
