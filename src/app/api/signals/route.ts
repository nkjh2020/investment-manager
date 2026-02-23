/**
 * GET /api/signals
 * Query: ?refresh=true (캐시 무시 강제 갱신)
 *
 * 흐름:
 *   1. In-Memory 캐시 확인 (1시간 TTL)
 *   2. KIS API로 잔고 조회 → 보유 종목 목록
 *   3. 시장 상태(Layer 1) + 종목 신호(Layer 3) 병렬 계산
 *   4. SELL > TRIM > BUY > STRONG_BUY > ADD > HOLD > N/A 순서 정렬
 *   5. 응답 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllAccountsBalance } from '@/lib/kis-client';
import { fetchDailyPrices, clearCache } from '@/lib/signal/dataSource';
import { calcIndicators } from '@/lib/signal/indicators';
import { calcAction } from '@/lib/signal/scoring';
import { getMarketStatus } from '@/lib/signal/market';
import type { SignalsResponse, SignalResult, ActionType } from '@/types/signal';

// ── 캐시 ─────────────────────────────────────────────────
interface SignalsCache {
  data:      SignalsResponse;
  expiresAt: number;
}

let signalsCache: SignalsCache | null = null;
const TTL_SIGNALS = 60 * 60 * 1000; // 1시간

// ── 액션 정렬 우선순위 ────────────────────────────────────
const ACTION_ORDER: Record<ActionType, number> = {
  SELL:       0,
  TRIM:       1,
  BUY:        2,
  STRONG_BUY: 3,
  ADD:        4,
  HOLD:       5,
  'N/A':      6,
};

// ── GET 핸들러 ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  // 강제 갱신 시 캐시 초기화
  if (forceRefresh) {
    signalsCache = null;
    clearCache();
  }

  // 캐시 유효성 확인
  if (signalsCache && Date.now() < signalsCache.expiresAt) {
    return NextResponse.json({
      ...signalsCache.data,
      cached: true,
    });
  }

  try {
    // ── 1. 잔고 조회 ────────────────────────────────────
    const balanceData = await fetchAllAccountsBalance();
    const allHoldings = balanceData.merged.holdings;
    const totalEvaluation = balanceData.merged.summary.totalEvaluation;

    // 중복 종목 코드 병합 (복수 계좌 보유 시)
    const holdingMap = new Map<string, {
      stockCode: string;
      stockName: string;
      evalAmount: number;
      evalProfitRate: number;
    }>();

    for (const h of allHoldings) {
      if (holdingMap.has(h.stockCode)) {
        const existing = holdingMap.get(h.stockCode)!;
        existing.evalAmount += h.evalAmount;
        // 평균 수익률은 evalAmount 가중 평균 (근사치)
        existing.evalProfitRate = (existing.evalProfitRate + h.evalProfitRate) / 2;
      } else {
        holdingMap.set(h.stockCode, {
          stockCode:      h.stockCode,
          stockName:      h.stockName,
          evalAmount:     h.evalAmount,
          evalProfitRate: h.evalProfitRate,
        });
      }
    }

    const holdings = Array.from(holdingMap.values());

    // ── 2. 병렬 계산 (시장 상태 + 종목 신호) ───────────
    const [marketStatus, ...signalResults] = await Promise.allSettled([
      getMarketStatus(),
      ...holdings.map(async (h): Promise<SignalResult> => {
        const priceData = await fetchDailyPrices(h.stockCode);
        const indicators = calcIndicators(priceData);

        // 현재 비중 계산
        const currentWeight = totalEvaluation > 0
          ? (h.evalAmount / totalEvaluation) * 100
          : 0;

        const { trendScore, momentumScore, volumeScore, totalScore, action, reason, suggestion } =
          calcAction(indicators, { weight: currentWeight });

        return {
          stockCode:     h.stockCode,
          stockName:     h.stockName,
          action,
          score: {
            trend:    trendScore,
            momentum: momentumScore,
            volume:   volumeScore,
            total:    totalScore,
          },
          indicators,
          reason,
          suggestion,
          currentWeight: Math.round(currentWeight * 10) / 10,
          profitRate:    Math.round(h.evalProfitRate * 10) / 10,
        };
      }),
    ]);

    // ── 3. 결과 조합 ────────────────────────────────────
    const market = marketStatus.status === 'fulfilled'
      ? marketStatus.value
      : {
          status:        'NEUTRAL' as const,
          alert:         false,
          indicators:    { kospi: null, nasdaq: null, sp500: null, vix: null },
          crashStrategy: null,
        };

    const signals: SignalResult[] = signalResults
      .map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        // 실패 시 N/A 신호 반환
        const h = holdings[i];
        console.error(`[signals] ${h.stockCode} 신호 계산 실패:`, r.reason);
        return {
          stockCode:     h.stockCode,
          stockName:     h.stockName,
          action:        'N/A' as ActionType,
          score:         { trend: 0, momentum: 0, volume: 0, total: 0 },
          indicators:    { price: null, ma20: null, ma60: null, ma120: null, ma200: null, rsi: null, vo: null },
          reason:        '데이터 조회 실패',
          suggestion:    '잠시 후 다시 시도하세요',
          currentWeight: 0,
          profitRate:    h.evalProfitRate,
        };
      })
      // 정렬: SELL > TRIM > BUY > STRONG_BUY > ADD > HOLD > N/A
      .sort((a, b) => (ACTION_ORDER[a.action] ?? 99) - (ACTION_ORDER[b.action] ?? 99));

    // ── 4. 응답 구성 + 캐시 저장 ───────────────────────
    const response: SignalsResponse = {
      marketStatus: market,
      signals,
      updatedAt: new Date().toISOString(),
      cached:    false,
    };

    signalsCache = {
      data:      response,
      expiresAt: Date.now() + TTL_SIGNALS,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[signals] API 오류:', error);
    return NextResponse.json(
      {
        error:   '신호 계산 중 오류가 발생했습니다',
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
