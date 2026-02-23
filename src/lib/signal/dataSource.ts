/**
 * Yahoo Finance 일봉 데이터 조회 + 캐시
 * - 종목 일봉: TTL 24시간
 * - 시장 지수: TTL 1시간
 */

import { PriceData, MarketIndexData } from '@/types/signal';

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const TIMEOUT_MS = 5000;

// ── 캐시 ─────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const priceCache  = new Map<string, CacheEntry<PriceData[]>>();   // key: "{code}.KS" → { data, expiresAt }
const marketCache = new Map<string, CacheEntry<MarketIndexData>>(); // key: symbol       → { data, expiresAt }

const TTL_DAILY  = 24 * 60 * 60 * 1000; // 24시간
const TTL_MARKET =  1 * 60 * 60 * 1000; // 1시간

// ── 심볼 변환 ─────────────────────────────────────────────
/**
 * 한국 종목코드 → Yahoo Finance 심볼
 * 코스닥 종목은 .KQ, 코스피는 .KS
 */
const KOSDAQ_CODES = new Set<string>([
  // 주요 코스닥 종목 (필요시 확장)
  '247540', // 에코프로비엠
  '086520', // 에코프로
  '035900', // JYP Ent.
  '041510', // SM엔터테인먼트
  '122870', // 와이지엔터테인먼트
  '293490', // 카카오게임즈
  '058470', // 리노공업
  '039030', // 이오테크닉스
  '028300', // HLB
]);

export function toYFSymbol(code: string): string {
  if (KOSDAQ_CODES.has(code)) return `${code}.KQ`;
  return `${code}.KS`;
}

// ── fetch 유틸 ────────────────────────────────────────────
async function fetchWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; investment-manager/1.0)',
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // Next.js 캐시 비활성화 (자체 캐시 사용)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── 일봉 데이터 조회 ──────────────────────────────────────
/**
 * 종목 일봉 데이터 조회 (최근 250일)
 * @param code - 한국 종목코드 (6자리)
 * @returns PriceData[] — 최신 데이터가 index 0
 */
export async function fetchDailyPrices(code: string): Promise<PriceData[]> {
  const symbol   = toYFSymbol(code);
  const cacheKey = symbol;

  // 캐시 확인
  if (priceCache.has(cacheKey)) {
    const cached = priceCache.get(cacheKey)!;
    if (Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1y&includePrePost=false`;
    const json = await fetchWithTimeout(url) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          timestamps?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> };
        }>;
      };
    };

    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('빈 응답');

    const timestamps = result.timestamps || result.timestamp || [];
    const closes     = result.indicators?.quote?.[0]?.close  || [];
    const volumes    = result.indicators?.quote?.[0]?.volume || [];

    // 유효 데이터만 추출 (null 제거)
    const data: PriceData[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue;
      data.push({
        date:   new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        close:  closes[i] as number,
        volume: (volumes[i] as number) || 0,
      });
    }

    // 최신 데이터가 index 0이 되도록 역순 정렬
    data.reverse();

    // 캐시 저장
    priceCache.set(cacheKey, { data, expiresAt: Date.now() + TTL_DAILY });

    return data;
  } catch (err) {
    // 실패 시 캐시 데이터 반환 (만료된 캐시도 사용)
    if (priceCache.has(cacheKey)) {
      console.warn(`[dataSource] ${symbol} 조회 실패, 캐시 사용:`, (err as Error).message);
      return priceCache.get(cacheKey)!.data;
    }
    console.error(`[dataSource] ${symbol} 조회 실패, 캐시 없음:`, (err as Error).message);
    return [];
  }
}

// ── 시장 지수 조회 ────────────────────────────────────────
/**
 * 시장 지수 조회
 * @param symbol - Yahoo Finance 심볼 (^KS11, ^IXIC, ^GSPC, ^VIX)
 * @returns MarketIndexData | null
 */
export async function fetchMarketIndex(symbol: string): Promise<MarketIndexData | null> {
  // 캐시 확인
  if (marketCache.has(symbol)) {
    const cached = marketCache.get(symbol)!;
    if (Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d&includePrePost=false`;
    const json = await fetchWithTimeout(url) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            previousClose?: number;
          };
        }>;
      };
    };

    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('빈 응답');

    const meta      = result.meta || {};
    const current   = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    const prev      = meta.previousClose ?? current;
    const change    = current - prev;
    const changePct = prev !== 0 ? (change / prev * 100) : 0;

    const data: MarketIndexData = {
      current:   Math.round(current   * 100) / 100,
      prev:      Math.round(prev      * 100) / 100,
      change:    Math.round(change    * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
    };

    // 캐시 저장
    marketCache.set(symbol, { data, expiresAt: Date.now() + TTL_MARKET });

    return data;
  } catch (err) {
    // 실패 시 캐시 반환
    if (marketCache.has(symbol)) {
      console.warn(`[dataSource] ${symbol} 조회 실패, 캐시 사용:`, (err as Error).message);
      return marketCache.get(symbol)!.data;
    }
    console.error(`[dataSource] ${symbol} 조회 실패:`, (err as Error).message);
    return null;
  }
}

// ── 캐시 강제 초기화 ──────────────────────────────────────
export function clearCache(): void {
  priceCache.clear();
  marketCache.clear();
}

export function clearPriceCache(code: string): void {
  const symbol = toYFSymbol(code);
  priceCache.delete(symbol);
}
