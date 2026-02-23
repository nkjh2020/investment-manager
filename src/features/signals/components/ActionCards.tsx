'use client';

import type { SignalResult, ActionType } from '@/types/signal';

interface ActionCardsProps {
  signals:         SignalResult[];
  onSelectSignal:  (signal: SignalResult) => void;
}

// ── 액션별 색상 / 라벨 ────────────────────────────────────
const ACTION_STYLES: Record<ActionType, {
  card:  string;
  badge: string;
  label: string;
  emoji: string;
}> = {
  SELL:       {
    card:  'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
    badge: 'bg-red-600 text-white',
    label: '매도',
    emoji: '🔴',
  },
  TRIM:       {
    card:  'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20',
    badge: 'bg-orange-500 text-white',
    label: '비중축소',
    emoji: '🟠',
  },
  STRONG_BUY: {
    card:  'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20',
    badge: 'bg-blue-700 text-white',
    label: '강력매수',
    emoji: '💙',
  },
  BUY:        {
    card:  'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
    badge: 'bg-blue-500 text-white',
    label: '매수',
    emoji: '🔵',
  },
  ADD:        {
    card:  'border-cyan-300 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900/20',
    badge: 'bg-cyan-600 text-white',
    label: '추가매수',
    emoji: '🩵',
  },
  HOLD:       {
    card:  'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30',
    badge: 'bg-gray-500 text-white',
    label: '보유',
    emoji: '⚪',
  },
  'N/A':      {
    card:  'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/20',
    badge: 'bg-gray-400 text-white',
    label: 'N/A',
    emoji: '❓',
  },
};

// ── 수익률 색상 ───────────────────────────────────────────
function getProfitColor(rate: number): string {
  if (rate > 0) return 'text-blue-600 dark:text-blue-400';
  if (rate < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

// ── 개별 카드 ─────────────────────────────────────────────
function SignalCard({
  signal,
  onClick,
}: {
  signal:  SignalResult;
  onClick: () => void;
}) {
  const styles = ACTION_STYLES[signal.action];

  return (
    <button
      onClick={onClick}
      className={`
        flex min-w-[130px] flex-col gap-1.5 rounded-xl border p-3 text-left
        shadow-sm transition-all duration-150
        hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
        ${styles.card}
      `}
    >
      {/* 액션 배지 */}
      <div className="flex items-center justify-between">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${styles.badge}`}>
          {styles.emoji} {styles.label}
        </span>
        <span className="text-[10px] text-gray-600 dark:text-gray-100">
          {signal.currentWeight.toFixed(1)}%
        </span>
      </div>

      {/* 종목명 */}
      <div>
        <p className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-white">
          {signal.stockName}
        </p>
        <p className="text-[10px] text-gray-600 dark:text-gray-100">{signal.stockCode}</p>
      </div>

      {/* 총점 + 수익률 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600 dark:text-gray-100">
          점수 {signal.score.total >= 0 ? '+' : ''}{signal.score.total}
        </span>
        <span className={`text-[10px] font-medium ${getProfitColor(signal.profitRate)}`}>
          {signal.profitRate >= 0 ? '+' : ''}{signal.profitRate.toFixed(1)}%
        </span>
      </div>
    </button>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function ActionCards({ signals, onSelectSignal }: ActionCardsProps) {
  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-8 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-100">보유 종목이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
        {signals.map((signal) => (
          <SignalCard
            key={signal.stockCode}
            signal={signal}
            onClick={() => onSelectSignal(signal)}
          />
        ))}
      </div>
    </div>
  );
}
