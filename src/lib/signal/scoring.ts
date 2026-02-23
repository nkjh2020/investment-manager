/**
 * 기술적 지표 → 점수 계산 → 액션 결정
 *
 * 점수 구성:
 *   Trend Score    : 0~4  (이평선 위치)
 *   Momentum Score : -2~+2 (RSI)
 *   Volume Score   : -1~+1 (Volume Oscillator)
 *   Total Score    : -3~+7
 *
 * 액션:
 *   STRONG_BUY | BUY | ADD | HOLD | TRIM | SELL
 */

import { Indicators, ActionType } from '@/types/signal';

// ── 보유 컨텍스트 타입 ────────────────────────────────────
export interface HoldingContext {
  weight?:       number; // 현재 비중 (%)
  targetWeight?: number; // 목표 비중 (%)
}

// ── 액션 결과 타입 ────────────────────────────────────────
export interface ActionResult {
  trendScore:    number;
  momentumScore: number;
  volumeScore:   number;
  totalScore:    number;
  action:        ActionType;
  reason:        string;
  suggestion:    string;
}

// ── 추세 점수 (0~4) ──────────────────────────────────────
function calcTrendScore(ind: Indicators): number {
  if (!ind || ind.price == null) return 0;
  let score = 0;
  if (ind.ma20  != null && ind.price > ind.ma20)  score++;
  if (ind.ma60  != null && ind.price > ind.ma60)  score++;
  if (ind.ma120 != null && ind.price > ind.ma120) score++;
  if (ind.ma200 != null && ind.price > ind.ma200) score++;
  return score;
}

// ── 모멘텀 점수 (-2~+2) ─────────────────────────────────
function calcMomentumScore(rsi: number | null): number {
  if (rsi == null) return 0;
  if (rsi > 80)  return -2; // 과매수 — 고점 위험
  if (rsi >= 65) return +1; // 강세 구간
  if (rsi >= 50) return +2; // 건강한 상승 (이상적)
  if (rsi >= 30) return +1; // 반등 가능 구간
  return +2;                // 과매도 (역발상 매수)
}

// ── 거래량 점수 (-1~+1) ─────────────────────────────────
function calcVolumeScore(vo: number | null): number {
  if (vo == null) return 0;
  if (vo >  20) return +1; // 거래량 증가 (강한 신호)
  if (vo < -20) return -1; // 거래량 감소 (약한 신호)
  return 0;
}

// ── 판단 근거 텍스트 생성 ────────────────────────────────
function buildReason(ind: Indicators): string {
  const parts: string[] = [];

  // 이평선 위치
  const aboveLines: string[] = [];
  const belowLines: string[] = [];
  if (ind.ma20  != null) { (ind.price != null && ind.price > ind.ma20  ? aboveLines : belowLines).push('MA20'); }
  if (ind.ma60  != null) { (ind.price != null && ind.price > ind.ma60  ? aboveLines : belowLines).push('MA60'); }
  if (ind.ma120 != null) { (ind.price != null && ind.price > ind.ma120 ? aboveLines : belowLines).push('MA120'); }
  if (ind.ma200 != null) { (ind.price != null && ind.price > ind.ma200 ? aboveLines : belowLines).push('MA200'); }

  if (aboveLines.length > 0) parts.push(`${aboveLines.join('·')} 위`);
  if (belowLines.length > 0) parts.push(`${belowLines.join('·')} 아래`);

  // RSI
  if (ind.rsi != null) {
    const rsiRounded = Math.round(ind.rsi);
    if (ind.rsi > 80)       parts.push(`RSI 과매수(${rsiRounded})`);
    else if (ind.rsi >= 65) parts.push(`RSI 강세(${rsiRounded})`);
    else if (ind.rsi >= 50) parts.push(`RSI 건강(${rsiRounded})`);
    else if (ind.rsi >= 30) parts.push(`RSI 약세(${rsiRounded})`);
    else                    parts.push(`RSI 과매도(${rsiRounded})`);
  }

  // VO
  if (ind.vo != null) {
    if (ind.vo > 20)       parts.push('거래량 증가');
    else if (ind.vo < -20) parts.push('거래량 감소');
  }

  return parts.join(', ') || '데이터 부족';
}

// ── 실행 제안 텍스트 ─────────────────────────────────────
function buildSuggestion(action: ActionType, holding: HoldingContext): string {
  const cw = holding?.weight      != null ? holding.weight.toFixed(1)       : null;
  const tw = holding?.targetWeight != null ? holding.targetWeight.toFixed(1) : null;

  switch (action) {
    case 'STRONG_BUY':
      return `강력 매수 권장 ${tw ? `(목표 ${tw}%까지)` : ''}`.trim();
    case 'BUY':
      return `매수 적정 구간 ${tw ? `(목표 ${tw}% → ${cw ? `현재 ${cw}%` : ''})` : ''}`.trim();
    case 'ADD':
      return `소량 추가 가능 ${cw ? `(현재 ${cw}%)` : ''}`.trim();
    case 'HOLD':
      return `현 비중 유지 ${cw ? `(현재 ${cw}%)` : ''}`.trim();
    case 'TRIM':
      return `일부 익절 고려 ${cw ? `(현재 ${cw}%)` : ''}`.trim();
    case 'SELL':
      return '매도 검토 (손절 또는 전량 매도)';
    default:
      return '판단 보류';
  }
}

// ── 액션 결정 (메인 함수) ────────────────────────────────
/**
 * @param indicators - calcIndicators() 결과
 * @param holding    - { weight, targetWeight } — 포트폴리오 컨텍스트 (선택)
 * @returns ActionResult
 */
export function calcAction(
  indicators: Indicators,
  holding: HoldingContext = {},
): ActionResult {
  const ind = indicators || {} as Indicators;

  const trendScore    = calcTrendScore(ind);
  const momentumScore = calcMomentumScore(ind.rsi);
  const volumeScore   = calcVolumeScore(ind.vo);
  const totalScore    = trendScore + momentumScore + volumeScore;

  const weight        = holding?.weight       ?? null;
  const targetWeight  = holding?.targetWeight  ?? null;
  const isUnderweight = targetWeight != null && weight != null && weight < targetWeight;

  // ── 액션 결정 테이블 ──────────────────────────
  let action: ActionType;

  if (totalScore >= 6) {
    action = 'STRONG_BUY';
  } else if (totalScore >= 4) {
    // 추세 양호 + RSI 적정 + 비중 미달이면 BUY, 아니면 ADD
    if (trendScore >= 3 && ind.rsi != null && ind.rsi >= 50 && ind.rsi <= 65 && isUnderweight) {
      action = 'BUY';
    } else {
      action = 'ADD';
    }
  } else if (totalScore >= 2) {
    // 추세가 일정 수준 이상이면 HOLD, 아니면 TRIM
    action = trendScore >= 2 ? 'HOLD' : 'TRIM';
  } else if (totalScore >= 0) {
    action = 'TRIM';
  } else {
    // 총점 음수
    if (
      ind.price  != null && ind.ma200 != null && ind.price < ind.ma200 &&
      ind.rsi    != null && ind.rsi < 40
    ) {
      action = 'SELL';
    } else {
      action = 'TRIM';
    }
  }

  return {
    trendScore,
    momentumScore,
    volumeScore,
    totalScore,
    action,
    reason:     buildReason(ind),
    suggestion: buildSuggestion(action, holding),
  };
}
