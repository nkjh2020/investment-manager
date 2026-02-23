// KIS API Token
export interface KisToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  issuedAt: number;
}

// 계좌 잔고 요약 (output2)
export interface AccountSummary {
  totalDeposit: number;
  totalEvaluation: number;
  totalPurchaseAmount: number;
  totalEvalProfit: number;
  totalEvalProfitRate: number;
  d1Deposit: number;
  d2Deposit: number;
  todayBuyAmount: number;
  todaySellAmount: number;
  accountId: string;
  accountLabel: string;
}

// 보유 종목 (output1)
export interface StockHolding {
  stockCode: string;
  stockName: string;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
  evalAmount: number;
  evalProfit: number;
  evalProfitRate: number;
  purchaseAmount: number;
  accountId: string;
  accountLabel: string;
}

// KIS API 잔고 조회 원본 응답 (output1 항목)
export interface KisBalanceOutput1 {
  pdno: string;
  prdt_name: string;
  hldg_qty: string;
  pchs_avg_pric: string;
  prpr: string;
  evlu_amt: string;
  evlu_pfls_amt: string;
  evlu_pfls_rt: string;
  pchs_amt: string;
}

// KIS API 잔고 조회 원본 응답 (output2 항목)
export interface KisBalanceOutput2 {
  dnca_tot_amt: string;
  tot_evlu_amt: string;
  pchs_amt_smtl_amt: string;
  evlu_pfls_smtl_amt: string;
  nass_amt: string;
  d2_auto_rdpt_amt: string;
  bfdy_buy_amt: string;
  thdt_buy_amt: string;
  bfdy_sll_amt: string;
  thdt_sll_amt: string;
  d1_auto_rdpt_amt: string;
}

// KIS API 잔고 조회 전체 응답
export interface KisBalanceResponse {
  output1: KisBalanceOutput1[];
  output2: KisBalanceOutput2[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  tr_cont: string;
  ctx_area_fk100: string;
  ctx_area_nk100: string;
}

// KIS API 토큰 발급 응답
export interface KisTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  access_token_token_expired: string;
}
