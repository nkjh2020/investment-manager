'use client';

import { useState } from 'react';
import { useSignals } from '../hooks/useSignals';
import MarketStatusBar from './MarketStatusBar';
import ActionCards from './ActionCards';
import SignalDetailModal from './SignalDetailModal';
import type { SignalResult } from '@/types/signal';

// ── 로딩 스켈레톤 ─────────────────────────────────────────
function SignalsSkeleton() {
  return (
    <div className="space-y-4">
      {/* 시장 상태 스켈레톤 */}
      <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
      {/* 카드 스켈레톤 */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 min-w-[130px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}

// ── 에러 표시 ─────────────────────────────────────────────
function SignalsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 py-8 dark:border-red-700 dark:bg-red-700/80">
      <p className="text-sm text-red-600 dark:text-red-400">⚠ {message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        다시 시도
      </button>
    </div>
  );
}

// ── 메인 섹션 ─────────────────────────────────────────────
export default function SignalsSection() {
  const { data, isLoading, error, refetch, refresh } = useSignals();
  const [selectedSignal, setSelectedSignal] = useState<SignalResult | null>(null);
  const [isRefreshing, setIsRefreshing]     = useState(false);

  // 강제 새로고침
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          투자 신호
        </h2>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.cached ? '캐시' : '실시간'} ·{' '}
              {new Date(data.updatedAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors
              hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50
              dark:text-gray-300 dark:hover:bg-gray-700"
            title="새로고침"
          >
            {isRefreshing ? '⏳' : '↻'} 갱신
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <SignalsSkeleton />
      ) : error ? (
        <SignalsError
          message={error.message || '신호 조회 중 오류가 발생했습니다'}
          onRetry={() => refetch()}
        />
      ) : data ? (
        <div className="space-y-4">
          {/* Layer 1: 시장 상황 */}
          <MarketStatusBar marketStatus={data.marketStatus} />

          {/* Layer 3: 종목 신호 카드 */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              Action Needed — 카드를 클릭하면 상세 분석을 볼 수 있습니다
            </p>
            <ActionCards
              signals={data.signals}
              onSelectSignal={setSelectedSignal}
            />
          </div>
        </div>
      ) : null}

      {/* 상세 모달 */}
      <SignalDetailModal
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </section>
  );
}
