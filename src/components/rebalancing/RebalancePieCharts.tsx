'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { AllocationItem } from '@/types/portfolio';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
];

interface RebalancePieChartsProps {
  currentAllocation: AllocationItem[];
  targetAllocation: { stockCode: string; stockName: string; targetWeight: number }[];
}

export default function RebalancePieCharts({
  currentAllocation,
  targetAllocation,
}: RebalancePieChartsProps) {
  const currentData = currentAllocation.map((a) => ({
    name: a.stockName,
    value: a.weight,
  }));

  const targetData = targetAllocation.map((t) => ({
    name: t.stockName,
    value: t.targetWeight,
  }));

  // 종목 수에 따라 차트 높이 동적 조정
  const itemCount = Math.max(currentData.length, targetData.length);
  const chartHeight = Math.max(280, 180 + itemCount * 20);

  const renderChart = (data: { name: string; value: number }[], title: string) => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-400">데이터 없음</div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={data} cx="35%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '비중']} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '11px', lineHeight: '1.6' }}
              formatter={(value) => {
                const item = data.find((d) => d.name === value);
                return `${value} (${item?.value.toFixed(1)}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {renderChart(currentData, '현재 배분')}
      {renderChart(targetData, '목표 배분')}
    </div>
  );
}
