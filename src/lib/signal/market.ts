/**
 * 시장 지수 조회 + BULL / NEUTRAL / RISK 판단
 *
 * 심볼:
 *   ^KS11  - KOSPI
 *   ^IXIC  - NASDAQ Composite
 *   ^GSPC  - S&P 500
 *   ^VIX   - VIX (공포지수)
 */

import { MarketStatus, MarketStatusType, CrashStrategy, MarketIndexData } from '@/types/signal';
import { fetchMarketIndex } from './dataSource';

// ── 시장 상태 판단 로직 ───────────────────────────────────
/**
 * RISK:    sp500.changePct <= -5  OR  vix.current > 30
 * BULL:    kospi.changePct >= 1   AND nasdaq.changePct >= 1  AND vix.current < 20
 * NEUTRAL: 기타
 */
function determineStatus(indicators: {
  kospi:  { current: number; changePct: number } | null;
  nasdaq: { current: number; changePct: number } | null;
  sp500:  { current: number; changePct: number } | null;
  vix:    { current: number } | null;
}): MarketStatusType {
  const { kospi, nasdaq, sp500, vix } = indicators;

  // 데이터 없으면 NEUTRAL
  if (!sp500 || !vix || sp500.changePct == null || vix.current == null) {
    return 'NEUTRAL';
  }

  // RISK 조건
  if (sp500.changePct <= -5 || vix.current > 30) {
    return 'RISK';
  }

  // BULL 조건
  if (
    kospi  != null && kospi.changePct  >= 1 &&
    nasdaq != null && nasdaq.changePct >= 1 &&
    vix.current < 20
  ) {
    return 'BULL';
  }

  return 'NEUTRAL';
}

// ── Crash 전략 생성 ──────────────────────────────────────
function buildCrashStrategy(
  sp500: MarketIndexData | null,
  vix:   MarketIndexData | null,
): CrashStrategy | null {
  if (!sp500 || !vix) return null;

  let trigger: 'SP500_DROP' | 'VIX_SPIKE' | null = null;
  if (sp500.changePct <= -5) trigger = 'SP500_DROP';
  else if (vix.current > 30) trigger = 'VIX_SPIKE';
  else return null;

  return {
    trigger,
    description: trigger === 'SP500_DROP'
      ? `S&P500 ${sp500.changePct.toFixed(1)}% 급락`
      : `VIX ${vix.current.toFixed(1)} 급등`,
    day1Pct: 30,
    day3Pct: 40,
    day7Pct: 30,
  };
}

// ── 메인 함수 ────────────────────────────────────────────
/**
 * @returns MarketStatus
 */
export async function getMarketStatus(): Promise<MarketStatus> {
  // 병렬 조회
  const [kospiRaw, nasdaqRaw, sp500Raw, vixRaw] = await Promise.allSettled([
    fetchMarketIndex('^KS11'),
    fetchMarketIndex('^IXIC'),
    fetchMarketIndex('^GSPC'),
    fetchMarketIndex('^VIX'),
  ]).then(results =>
    results.map(r => (r.status === 'fulfilled' ? r.value : null)),
  );

  const indicators: MarketStatus['indicators'] = {
    kospi:  kospiRaw  ? { current: kospiRaw.current,  changePct: kospiRaw.changePct  } : null,
    nasdaq: nasdaqRaw ? { current: nasdaqRaw.current, changePct: nasdaqRaw.changePct } : null,
    sp500:  sp500Raw  ? { current: sp500Raw.current,  changePct: sp500Raw.changePct  } : null,
    vix:    vixRaw    ? { current: vixRaw.current }                                     : null,
  };

  const status        = determineStatus(indicators);
  const crashStrategy = status === 'RISK' ? buildCrashStrategy(sp500Raw, vixRaw) : null;

  return {
    status,
    alert: status === 'RISK',
    indicators,
    crashStrategy,
  };
}
