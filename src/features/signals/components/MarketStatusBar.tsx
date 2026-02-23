'use client';

import type { MarketStatus, CrashStrategy } from '@/types/signal';

interface MarketStatusBarProps {
  marketStatus: MarketStatus;
}

// ── 상태별 색상 ───────────────────────────────────────────
const STATUS_STYLES = {
  BULL:    { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',    label: '🐂 BULL' },
  NEUTRAL: { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',   label: '➡ NEUTRAL' },
  RISK:    { badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',        label: '⚠ RISK' },
} as const;

// ── 지수 포맷 ────────────────────────────────────────────
function IndexChip({
  label,
  current,
  changePct,
}: {
  label:      string;
  current:    number;
  changePct?: number;
}) {
  const isPositive = changePct != null && changePct >= 0;
  const changeColor =
    changePct == null
      ? 'text-gray-600 dark:text-gray-300'
      : isPositive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-2 text-center dark:bg-gray-700/50">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {current.toLocaleString()}
      </span>
      {changePct != null && (
        <span className={`text-xs font-medium ${changeColor}`}>
          {isPositive ? '+' : ''}{changePct.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

// ── Crash 전략 배너 ───────────────────────────────────────
function CrashAlert({ strategy }: { strategy: CrashStrategy }) {
  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold text-red-700 dark:text-red-400">
          🚨 급락 대응 전략 활성화
        </span>
        <span className="text-xs text-red-600 dark:text-red-500">
          {strategy.description}
        </span>
      </div>
      <div className="flex gap-4 text-xs">
        <div className="flex flex-col items-center">
          <span className="font-medium text-red-700 dark:text-red-400">Day 1</span>
          <span className="text-red-600 dark:text-red-500">{strategy.day1Pct}% 매수</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-medium text-red-700 dark:text-red-400">Day 3</span>
          <span className="text-red-600 dark:text-red-500">{strategy.day3Pct}% 매수</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-medium text-red-700 dark:text-red-400">Day 7</span>
          <span className="text-red-600 dark:text-red-500">{strategy.day7Pct}% 매수</span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function MarketStatusBar({ marketStatus }: MarketStatusBarProps) {
  const { status, indicators, crashStrategy } = marketStatus;
  const styles = STATUS_STYLES[status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">시장 상황</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles.badge}`}>
            {styles.label}
          </span>
        </div>
      </div>

      {/* 지수 목록 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {indicators.kospi && (
          <IndexChip
            label="KOSPI"
            current={indicators.kospi.current}
            changePct={indicators.kospi.changePct}
          />
        )}
        {indicators.nasdaq && (
          <IndexChip
            label="NASDAQ"
            current={indicators.nasdaq.current}
            changePct={indicators.nasdaq.changePct}
          />
        )}
        {indicators.sp500 && (
          <IndexChip
            label="S&P 500"
            current={indicators.sp500.current}
            changePct={indicators.sp500.changePct}
          />
        )}
        {indicators.vix && (
          <div className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-2 text-center dark:bg-gray-700/50">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">VIX</span>
            <span className={`text-sm font-semibold ${
              indicators.vix.current > 30
                ? 'text-red-600 dark:text-red-400'
                : indicators.vix.current > 20
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
            }`}>
              {indicators.vix.current.toFixed(1)}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">공포지수</span>
          </div>
        )}
      </div>

      {/* 급락 대응 전략 */}
      {crashStrategy && <CrashAlert strategy={crashStrategy} />}
    </div>
  );
}
