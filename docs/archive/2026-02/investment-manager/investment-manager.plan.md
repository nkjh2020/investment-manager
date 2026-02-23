# Investment Manager v2 - 멀티 계좌 & 자산 유형 확장

## Context

현재 investment-manager는 단일 계좌(43160181-22)의 주식 잔고만 조회합니다. 사용자는:
1. **2개 계좌**, 각 계좌별 **2개 상품코드** → 총 4개 계좌-상품 조합의 통합 조회
2. 각 계좌별 **별도 API Key/Secret** 사용
3. **채권, 펀드, 예수금** 등 현금성 자산 포함

을 요구합니다.

## 핵심 설계 결정

### 멀티 계좌 구조
- `.env.local`에 계좌별 설정을 **JSON 배열** 형태로 저장
- 서버 측에서 계좌별 독립 토큰 관리 (각 계좌 별도 App Key → 별도 토큰)
- 전체 계좌 데이터를 통합 집계하는 서버 API 제공

### 자산 유형 확장
- **주식**: 기존 `TTTC8434R` (inquire-balance) 유지
- **예수금**: `TTTC8434R` output2의 `dnca_tot_amt`(예수금총금액) 이미 포함 → 추가 API 불필요
- **채권**: KIS API `CTSC9115R` (국내채권 잔고조회, `/uapi/domestic-bond/v1/trading/inquire-balance`) 사용
- **펀드**: `TTTC8434R`에서 `FUND_STTL_ICLD_YN=Y`로 펀드결제분 포함, 또는 별도 펀드잔고 API 확인 필요

> **현실적 접근**: 채권/펀드 전용 API가 별도 tr_id/인증이 필요할 수 있으므로, 1차로 주식+예수금 멀티계좌 통합을 구현하고, 채권/펀드는 API 응답을 보며 점진적으로 추가합니다.

---

## 구현 계획

### Step 1: 환경변수 & 계좌 설정 구조 변경

**파일**: `.env.local`, `src/types/account.ts` (신규)

```env
# .env.local - 멀티 계좌 설정
KIS_ACCOUNTS='[{"id":"account1","label":"계좌1-위탁","appKey":"...","appSecret":"...","accountNo":"43160181","productCode":"22"},{"id":"account2","label":"계좌1-CMA","appKey":"...","appSecret":"...","accountNo":"43160181","productCode":"01"},{"id":"account3","label":"계좌2-위탁","appKey":"...","appSecret":"...","accountNo":"XXXXXXXX","productCode":"22"},{"id":"account4","label":"계좌2-CMA","appKey":"...","appSecret":"...","accountNo":"XXXXXXXX","productCode":"01"}]'
KIS_API_BASE_URL=https://openapi.koreainvestment.com:9443
```

```typescript
// src/types/account.ts
interface AccountConfig {
  id: string;
  label: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
}
```

### Step 2: 토큰 매니저 멀티 계좌 지원

**파일**: `src/lib/token-manager.ts` (수정)

- `Map<string, KisToken>` 형태로 계좌별 토큰 캐시
- `getToken(accountConfig)` → 계좌별 appKey/appSecret으로 토큰 발급
- 기존 단일 토큰 로직을 계좌 ID 기반으로 확장

### Step 3: KIS Client 멀티 계좌 지원

**파일**: `src/lib/kis-client.ts` (수정)

- `fetchBalance(accountConfig, fk100, nk100)` → 계좌 설정을 파라미터로 받음
- `fetchAllBalance(accountConfig)` → 계좌별 전체 잔고 조회
- `fetchAllAccountsBalance()` → 모든 계좌 순회하여 통합 데이터 반환
- env에서 `KIS_ACCOUNTS` JSON 파싱하여 계좌 목록 로드

### Step 4: 타입 확장

**파일**: `src/types/kis.ts`, `src/types/portfolio.ts`, `src/types/api.ts` (수정)

```typescript
// StockHolding에 계좌 정보 추가
interface StockHolding {
  ...existing,
  accountId: string;
  accountLabel: string;
}

// AccountSummary에 계좌 정보 추가
interface AccountSummary {
  ...existing,
  accountId: string;
  accountLabel: string;
}

// 통합 응답 타입
interface MultiAccountBalanceData {
  accounts: AccountBalanceData[];  // 계좌별 데이터
  merged: {                        // 통합 데이터
    holdings: StockHolding[];
    summary: MergedSummary;
  };
}

// 자산 유형 구분
type AssetType = 'stock' | 'bond' | 'fund' | 'cash';

interface AssetItem {
  type: AssetType;
  label: string;
  amount: number;
  weight: number;   // 전체 대비 비중
}
```

### Step 5: API 라우트 확장

**파일**: `src/app/api/kis/balance/route.ts` (수정)

- `GET /api/kis/balance?all=true` → 모든 계좌 통합 잔고 반환
- `GET /api/kis/balance?accountId=xxx` → 특정 계좌만 조회
- 응답에 계좌별 데이터 + 통합 summary 포함

### Step 6: Hooks 확장

**파일**: `src/features/account/hooks/useBalance.ts` (수정), `src/features/portfolio/hooks/usePortfolio.ts` (수정)

- `useBalance()` → 전체 계좌 통합 데이터 반환
- `usePortfolio()` → 자산 유형별 분류 (주식/채권/펀드/현금) 추가
- 계좌별 필터링 지원: `useBalance(accountId?)`

### Step 7: 자산 유형 분류 로직

**파일**: `src/features/portfolio/utils/classifyAssets.ts` (신규)

- 종목코드 패턴으로 자산 유형 자동 분류:
  - ETF: 6자리 숫자 (주식형 ETF는 stock으로)
  - 채권형 ETF/펀드: 종목명에 "채권", "국채", "회사채" 포함 → bond
  - 펀드: 종목명에 "펀드", "액티브" 포함 → fund
  - CMA/예수금: output2의 dnca_tot_amt → cash
- `calcAssetAllocation()` → AssetType별 비중 계산

### Step 8: UI 컴포넌트 확장

**수정 파일들:**

1. **`src/components/layout/Navbar.tsx`** - 계좌 선택 드롭다운 추가
2. **`src/components/dashboard/SummaryCards.tsx`** - 통합 요약 + 자산유형별 요약 카드 추가
3. **`src/components/dashboard/HoldingsTable.tsx`** - 계좌 라벨 컬럼 추가, 자산유형 필터 탭
4. **`src/components/charts/AllocationPieChart.tsx`** - 자산유형별 대분류 파이차트 추가
5. **`src/components/charts/AssetTypeChart.tsx`** (신규) - 주식/채권/펀드/현금 비중 도넛차트

### Step 9: Dashboard 페이지 업데이트

**파일**: `src/app/dashboard/page.tsx` (수정)

- 상단: 계좌 선택 (전체/개별) 드롭다운
- 요약 카드: 통합 총평가, 총수익, 수익률 + 자산유형별 금액
- 차트: 자산유형별 비중(대분류) + 종목별 비중(소분류) 2개 차트
- 테이블: 계좌 라벨 표시, 자산유형 탭 필터

### Step 10: Settings 페이지 업데이트

**파일**: `src/app/settings/page.tsx` (수정)

- 멀티 계좌 설정 가이드 업데이트 (JSON 형식 안내)
- 등록된 계좌 목록 표시 (계좌명, 마스킹된 계좌번호)

---

## 수정 대상 파일 목록

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| 신규 | `src/types/account.ts` | 계좌 설정 타입 |
| 신규 | `src/features/portfolio/utils/classifyAssets.ts` | 자산유형 분류 |
| 신규 | `src/components/charts/AssetTypeChart.tsx` | 자산유형 도넛차트 |
| 수정 | `.env.local.example` | 멀티계좌 JSON 형식 |
| 수정 | `src/lib/token-manager.ts` | 계좌별 토큰 캐시 |
| 수정 | `src/lib/kis-client.ts` | 계좌 파라미터 추가 |
| 수정 | `src/types/kis.ts` | accountId 필드 추가 |
| 수정 | `src/types/portfolio.ts` | AssetType, MultiAccount 타입 |
| 수정 | `src/types/api.ts` | MultiAccountBalanceData |
| 수정 | `src/app/api/kis/balance/route.ts` | 멀티계좌 조회 |
| 수정 | `src/features/account/hooks/useBalance.ts` | 멀티계좌 훅 |
| 수정 | `src/features/portfolio/hooks/usePortfolio.ts` | 자산분류 통합 |
| 수정 | `src/components/layout/Navbar.tsx` | 계좌 선택 UI |
| 수정 | `src/components/dashboard/SummaryCards.tsx` | 자산유형별 카드 |
| 수정 | `src/components/dashboard/HoldingsTable.tsx` | 계좌 컬럼, 필터 |
| 수정 | `src/components/charts/AllocationPieChart.tsx` | 대분류 차트 |
| 수정 | `src/app/dashboard/page.tsx` | 계좌선택, 레이아웃 |
| 수정 | `src/app/settings/page.tsx` | 멀티계좌 안내 |
| 수정 | `src/app/portfolio/page.tsx` | 자산유형 표시 |
| 수정 | `src/app/rebalancing/page.tsx` | 계좌 필터 반영 |

---

## 검증 방법

1. **빌드 확인**: `npm run build` 성공
2. **토큰 테스트**: `curl -X POST http://localhost:3000/api/kis/token` → 각 계좌별 토큰 발급 확인
3. **잔고 조회**: `curl http://localhost:3000/api/kis/balance?all=true` → 4개 계좌 통합 데이터 반환
4. **개별 계좌**: `curl http://localhost:3000/api/kis/balance?accountId=account1` → 특정 계좌만 반환
5. **UI 확인**: 브라우저에서 대시보드 → 계좌 선택 드롭다운, 자산유형 차트, 통합 요약 확인
