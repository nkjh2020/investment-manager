'use client';

import { useEffect } from 'react';
import type { SignalResult, ActionType, Indicators } from '@/types/signal';

interface SignalDetailModalProps {
  signal:   SignalResult | null;
  onClose:  () => void;
}

// ── 액션 라벨 매핑 ────────────────────────────────────────
const ACTION_LABELS: Record<ActionType, { label: string; color: string }> = {
  SELL:       { label: '매도',    color: 'text-red-600 dark:text-red-400' },
  TRIM:       { label: '비중축소', color: 'text-orange-600 dark:text-orange-400' },
  STRONG_BUY: { label: '강력매수', color: 'text-blue-800 dark:text-blue-300' },
  BUY:        { label: '매수',    color: 'text-blue-600 dark:text-blue-400' },
  ADD:        { label: '추가매수', color: 'text-cyan-600 dark:text-cyan-400' },
  HOLD:       { label: '보유',    color: 'text-gray-700 dark:text-gray-100' },
  'N/A':      { label: 'N/A',    color: 'text-gray-600 dark:text-gray-400' },
};

// ── 이평선 위치 표시 ──────────────────────────────────────
function MAPositionRow({
  label,
  price,
  ma,
}: {
  label: string;
  price: number | null;
  ma:    number | null;
}) {
  if (ma == null || price == null) {
    return (
      <div className="flex items-center justify-between py-1.5 text-sm">
        <span className="text-gray-600 dark:text-gray-100">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">데이터 없음</span>
      </div>
    );
  }

  const isAbove  = price > ma;
  const diffPct  = ((price - ma) / ma * 100).toFixed(1);

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-700 dark:text-gray-100">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-700 dark:text-gray-100">{ma.toLocaleString()}</span>
        <span className={`text-xs font-medium ${
          isAbove
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {isAbove ? '▲' : '▼'} {isAbove ? '+' : ''}{diffPct}%
        </span>
      </div>
    </div>
  );
}

// ── 점수 게이지 바 ────────────────────────────────────────
function ScoreBar({
  label,
  value,
  min,
  max,
}: {
  label: string;
  value: number;
  min:   number;
  max:   number;
}) {
  const range      = max - min;
  const normalized = ((value - min) / range) * 100;
  const clampedPct = Math.min(100, Math.max(0, normalized));
  const color      = value > 0 ? 'bg-blue-500' : value < 0 ? 'bg-red-500' : 'bg-gray-400';

  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-gray-700 dark:text-gray-100">
        <span>{label}</span>
        <span className="font-medium">{value >= 0 ? '+' : ''}{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-900">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function SignalDetailModal({ signal, onClose }: SignalDetailModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!signal) return null;

  const { action, score, indicators, reason, suggestion, stockName, stockCode, currentWeight, profitRate } = signal;
  const actionInfo = ACTION_LABELS[action];
  const ind: Indicators = indicators;

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      {/* 모달 패널 */}
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{stockName}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-100">{stockCode}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${actionInfo.color}`}>{actionInfo.label}</span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 현재 비중 / 수익률 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900">
            <p className="text-xs text-gray-600 dark:text-gray-100">현재 비중</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {currentWeight.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900">
            <p className="text-xs text-gray-600 dark:text-gray-100">수익률</p>
            <p className={`text-lg font-bold ${
              profitRate > 0
                ? 'text-blue-600 dark:text-blue-400'
                : profitRate < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
            }`}>
              {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 점수 시각화 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-100">점수 분석</p>
          <ScoreBar label="추세 (Trend)"    value={score.trend}    min={0}  max={4} />
          <ScoreBar label="모멘텀 (RSI)"     value={score.momentum} min={-2} max={2} />
          <ScoreBar label="거래량 (VO)"      value={score.volume}   min={-1} max={1} />
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-gray-700 dark:text-gray-100">총점</span>
              <span className={
                score.total >= 4
                  ? 'text-blue-600 dark:text-blue-400'
                  : score.total >= 2
                    ? 'text-gray-700 dark:text-gray-100'
                    : 'text-red-600 dark:text-red-400'
              }>
                {score.total >= 0 ? '+' : ''}{score.total} / 7
              </span>
            </div>
          </div>
        </div>

        {/* 이평선 위치 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-100">이동평균선</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <MAPositionRow label="MA 20"  price={ind.price} ma={ind.ma20} />
            <MAPositionRow label="MA 60"  price={ind.price} ma={ind.ma60} />
            <MAPositionRow label="MA 120" price={ind.price} ma={ind.ma120} />
            <MAPositionRow label="MA 200" price={ind.price} ma={ind.ma200} />
          </div>
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-xs dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-100">
              RSI: {ind.rsi != null ? ind.rsi.toFixed(1) : 'N/A'}
            </span>
            <span className="text-gray-600 dark:text-gray-100">
              VO: {ind.vo != null ? ind.vo.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>

        {/* 판단 근거 / 실행 제안 */}
        <div className="space-y-2">
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
            <p className="text-[11px] text-gray-600 dark:text-gray-100">판단 근거</p>
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{reason}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 ${
            action === 'SELL' || action === 'TRIM'
              ? 'bg-red-50 dark:bg-red-900/20'
              : action === 'BUY' || action === 'STRONG_BUY' || action === 'ADD'
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'bg-gray-50 dark:bg-gray-900'
          }`}>
            <p className="text-[11px] text-gray-600 dark:text-gray-100">실행 제안</p>
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{suggestion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
