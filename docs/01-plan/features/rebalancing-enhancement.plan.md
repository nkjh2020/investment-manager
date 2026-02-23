# Plan: 리밸런싱 페이지 개선

## Feature Name
`rebalancing-enhancement`

## Created
2026-02-14

## Overview
리밸런싱 페이지에서 전체 계좌 합산 잔고 기반 목표 비중 설정 및 목표잔고 컬럼 추가.

## Requirements

### 1. 전체 계좌 합산 잔고 기반 목표 비중 설정
- **현재**: `allocationWithCash`로 전체 계좌 종목별 합산 비중은 이미 계산됨 (이전 버그 수정에서 `mergeHoldings()` 구현 완료)
- **확인 필요**: 목표 비중 설정 UI가 합산된 잔고를 기반으로 동작하는지 검증
- **현재 상태**: 이미 `calcAllocationWithCash()`가 전계좌 합산 + 현금 포함하여 비중 계산하고, 리밸런싱 페이지에서 이를 사용 중
- **결론**: 이 부분은 이미 구현 완료. 추가 수정 불필요

### 2. 테이블에 "목표잔고" 컬럼 추가
- **현재**: RebalanceTable에 6개 컬럼 (종목명, 현재비중, 목표비중, 차이, 조치, 제안금액)
- **변경**: "제안 금액" 다음에 "목표잔고" 컬럼 추가
- **목표잔고 계산**: `totalAsset * (targetWeight / 100)`
- **표시 형식**: 원화 포맷 (formatCurrency)

## Implementation Steps

### Step 1: RebalanceTarget 타입에 targetBalance 필드 추가
- **파일**: `src/types/portfolio.ts`
- **변경**: `RebalanceTarget` interface에 `targetBalance: number` 추가

### Step 2: calcRebalance 함수에서 targetBalance 계산
- **파일**: `src/features/rebalancing/utils/calcRebalance.ts`
- **변경**: `targetBalance = Math.round(totalEval * (target.targetWeight / 100))` 추가
- return 객체에 `targetBalance` 포함

### Step 3: RebalanceTable에 목표잔고 컬럼 추가
- **파일**: `src/components/rebalancing/RebalanceTable.tsx`
- **변경**:
  - thead에 "목표잔고" th 추가 (제안금액 다음)
  - tbody에 `formatCurrency(target.targetBalance)원` td 추가

### Step 4: Build & 검증

## Affected Files
| File | Change Type |
|------|-------------|
| `src/types/portfolio.ts` | Modify (add targetBalance) |
| `src/features/rebalancing/utils/calcRebalance.ts` | Modify (calc targetBalance) |
| `src/components/rebalancing/RebalanceTable.tsx` | Modify (add column) |

## Complexity
Low - 3개 파일 소규모 수정

## Risk Assessment
- 기존 기능에 영향 없음 (필드 추가 + 컬럼 추가)
- 타입 변경이 하위 호환적
