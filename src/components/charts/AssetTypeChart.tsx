'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { AssetTypeItem } from '@/types/portfolio';
import { formatCurrency } from '@/lib/format';

const ASSET_COLORS: Record<string, string> = {
  stock: '#3b82f6',
  bond: '#22c55e',
  fund: '#f97316',
  cash: '#8b5cf6',
};

interface AssetTypeChartProps {
  assetTypes: AssetTypeItem[];
  title?: string;
}

export default function AssetTypeChart({ assetTypes, title = '자산 유형별 비중' }: AssetTypeChartProps) {
  if (assetTypes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-600 dark:text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  const data = assetTypes.map((item) => ({
    name: item.label,
    value: item.amount,
    weight: item.weight,
    type: item.type,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.type} fill={ASSET_COLORS[entry.type] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${formatCurrency(Number(value))}원`, '금액']}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend
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
