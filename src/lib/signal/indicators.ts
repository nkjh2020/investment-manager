/**
 * 기술적 지표 계산 (순수 함수)
 * - MA(n): 단순이동평균
 * - RSI(14): Wilder's Smoothing Method
 * - VO: Volume Oscillator = (VMA5 - VMA20) / VMA20 * 100
 */

import { PriceData, Indicators } from '@/types/signal';

// ── 단순이동평균 ───────────────────────────────────────────
/**
 * @param closes - 종가 배열 (최신 데이터가 index 0)
 * @param period - 기간
 * @returns number | null
 */
export function calcMA(closes: number[], period: number): number | null {
  if (!closes || closes.length < period) return null;
  // 최신 period개의 종가 (index 0 ~ period-1)
  const slice = closes.slice(0, period);
  if (slice.some(v => v == null)) return null;
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / period);
}

// ── RSI (Wilder's Smoothing Method) ─────────────────────
/**
 * @param closes - 종가 배열 (최신 데이터가 index 0)
 * @param period - 기간 (기본 14)
 * @returns number | null (0~100)
 */
export function calcRSI(closes: number[], period = 14): number | null {
  // Wilder's RSI 계산을 위해 충분한 데이터 필요 (period+1 이상)
  if (!closes || closes.length < period + 1) return null;

  // 최신 → 과거 순이므로 계산을 위해 역순 (과거 → 최신)
  const arr = closes.slice().reverse(); // 과거가 index 0

  let avgGain = 0;
  let avgLoss = 0;

  // 첫 period개의 변화량으로 초기값 계산
  for (let i = 1; i <= period; i++) {
    const diff = arr[i] - arr[i - 1];
    if (diff > 0) avgGain += diff;
    else          avgLoss -= diff; // 절댓값
  }
  avgGain /= period;
  avgLoss /= period;

  // 나머지 데이터에 Wilder's Smoothing 적용
  for (let i = period + 1; i < arr.length; i++) {
    const diff = arr[i] - arr[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs  = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Math.round(rsi * 10) / 10; // 소수점 1자리
}

// ── Volume Oscillator ────────────────────────────────────
/**
 * VO = (VolumeMA_short - VolumeMA_long) / VolumeMA_long * 100
 * @param volumes     - 거래량 배열 (최신이 index 0)
 * @param shortPeriod - 단기 기간 (기본 5)
 * @param longPeriod  - 장기 기간 (기본 20)
 * @returns number | null
 */
export function calcVO(
  volumes:     number[],
  shortPeriod = 5,
  longPeriod  = 20,
): number | null {
  if (!volumes || volumes.length < longPeriod) return null;

  const shortSlice = volumes.slice(0, shortPeriod);
  const longSlice  = volumes.slice(0, longPeriod);

  if (shortSlice.some(v => v == null) || longSlice.some(v => v == null)) return null;

  const vmaShort = shortSlice.reduce((a, v) => a + v, 0) / shortPeriod;
  const vmaLong  = longSlice.reduce((a, v)  => a + v, 0) / longPeriod;

  if (vmaLong === 0) return null;
  const vo = (vmaShort - vmaLong) / vmaLong * 100;
  return Math.round(vo * 100) / 100; // 소수점 2자리
}

// ── 모든 지표 한번에 계산 ─────────────────────────────────
/**
 * @param priceData - PriceData[] — 최신이 index 0
 * @returns Indicators
 */
export function calcIndicators(priceData: PriceData[]): Indicators {
  if (!priceData || priceData.length === 0) {
    return { price: null, ma20: null, ma60: null, ma120: null, ma200: null, rsi: null, vo: null };
  }

  const closes  = priceData.map(d => d.close);
  const volumes = priceData.map(d => d.volume);

  return {
    price: closes[0],
    ma20:  calcMA(closes, 20),
    ma60:  calcMA(closes, 60),
    ma120: calcMA(closes, 120),
    ma200: calcMA(closes, 200),
    rsi:   calcRSI(closes, 14),
    vo:    calcVO(volumes, 5, 20),
  };
}
