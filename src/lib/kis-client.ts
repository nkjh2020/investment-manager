import type { KisBalanceResponse } from '@/types/kis';
import type { StockHolding, AccountSummary } from '@/types/kis';
import type { BalanceData, AccountBalanceData, MultiAccountBalanceData } from '@/types/api';
import type { AccountConfig } from '@/types/account';
import { getToken, clearToken } from './token-manager';
import { getAccountConfigs } from './account-config';

const KIS_API_BASE_URL = process.env.KIS_API_BASE_URL || 'https://openapi.koreainvestment.com:9443';

async function kisRequest<T>(
  account: AccountConfig,
  path: string,
  params: Record<string, string>,
  trId: string,
  retried = false
): Promise<T> {
  const token = await getToken(account);

  const url = new URL(`${KIS_API_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token.accessToken}`,
      appkey: account.appKey,
      appsecret: account.appSecret,
      tr_id: trId,
    },
  });

  if (response.status === 401 && !retried) {
    clearToken(account.appKey);
    return kisRequest<T>(account, path, params, trId, true);
  }

  if (!response.ok) {
    throw new Error(`KIS API error (${account.label}): ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function parseNumber(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function transformHoldings(
  output1: KisBalanceResponse['output1'],
  accountId: string,
  accountLabel: string
): StockHolding[] {
  return output1
    .filter((item) => parseNumber(item.hldg_qty) > 0)
    .map((item) => ({
      stockCode: item.pdno,
      stockName: item.prdt_name,
      quantity: parseNumber(item.hldg_qty),
      avgPurchasePrice: parseNumber(item.pchs_avg_pric),
      currentPrice: parseNumber(item.prpr),
      evalAmount: parseNumber(item.evlu_amt),
      evalProfit: parseNumber(item.evlu_pfls_amt),
      evalProfitRate: parseNumber(item.evlu_pfls_rt),
      purchaseAmount: parseNumber(item.pchs_amt),
      accountId,
      accountLabel,
    }));
}

function transformSummary(
  output2: KisBalanceResponse['output2'],
  accountId: string,
  accountLabel: string
): AccountSummary {
  const data = output2[0] || {};
  return {
    totalDeposit: parseNumber(data.dnca_tot_amt),
    totalEvaluation: parseNumber(data.tot_evlu_amt),
    totalPurchaseAmount: parseNumber(data.pchs_amt_smtl_amt),
    totalEvalProfit: parseNumber(data.evlu_pfls_smtl_amt),
    totalEvalProfitRate:
      parseNumber(data.pchs_amt_smtl_amt) > 0
        ? (parseNumber(data.evlu_pfls_smtl_amt) / parseNumber(data.pchs_amt_smtl_amt)) * 100
        : 0,
    d1Deposit: parseNumber(data.d1_auto_rdpt_amt),
    d2Deposit: parseNumber(data.d2_auto_rdpt_amt),
    todayBuyAmount: parseNumber(data.thdt_buy_amt),
    todaySellAmount: parseNumber(data.thdt_sll_amt),
    accountId,
    accountLabel,
  };
}

export async function fetchBalance(
  account: AccountConfig,
  fk100 = '',
  nk100 = ''
): Promise<BalanceData> {
  const params: Record<string, string> = {
    CANO: account.accountNo,
    ACNT_PRDT_CD: account.productCode,
    AFHR_FLPR_YN: 'N',
    OFL_YN: '',
    INQR_DVSN: '02',
    UNPR_DVSN: '01',
    FUND_STTL_ICLD_YN: 'Y',
    FNCG_AMT_AUTO_RDPT_YN: 'N',
    PRCS_DVSN: '00',
    CTX_AREA_FK100: fk100,
    CTX_AREA_NK100: nk100,
  };

  const data = await kisRequest<KisBalanceResponse>(
    account,
    '/uapi/domestic-stock/v1/trading/inquire-balance',
    params,
    'TTTC8434R'
  );

  const hasMore = data.tr_cont === 'M' || data.tr_cont === 'F';

  return {
    holdings: transformHoldings(data.output1, account.id, account.label),
    summary: transformSummary(data.output2, account.id, account.label),
    hasMore,
    continuationKey: hasMore
      ? { fk100: data.ctx_area_fk100, nk100: data.ctx_area_nk100 }
      : undefined,
  };
}

export async function fetchAllBalance(account: AccountConfig): Promise<BalanceData> {
  let allHoldings: StockHolding[] = [];
  let summary: AccountSummary | null = null;
  let fk100 = '';
  let nk100 = '';
  let hasMore = true;

  while (hasMore) {
    const result = await fetchBalance(account, fk100, nk100);
    allHoldings = [...allHoldings, ...result.holdings];
    if (!summary) summary = result.summary;
    hasMore = result.hasMore;
    if (result.continuationKey) {
      fk100 = result.continuationKey.fk100;
      nk100 = result.continuationKey.nk100;
    }
  }

  return {
    holdings: allHoldings,
    summary: summary!,
    hasMore: false,
  };
}

function mergeSummaries(summaries: AccountSummary[]): AccountSummary {
  const merged: AccountSummary = {
    totalDeposit: 0,
    totalEvaluation: 0,
    totalPurchaseAmount: 0,
    totalEvalProfit: 0,
    totalEvalProfitRate: 0,
    d1Deposit: 0,
    d2Deposit: 0,
    todayBuyAmount: 0,
    todaySellAmount: 0,
    accountId: 'all',
    accountLabel: '전체',
  };

  for (const s of summaries) {
    merged.totalDeposit += s.totalDeposit;
    merged.totalEvaluation += s.totalEvaluation;
    merged.totalPurchaseAmount += s.totalPurchaseAmount;
    merged.totalEvalProfit += s.totalEvalProfit;
    merged.d1Deposit += s.d1Deposit;
    merged.d2Deposit += s.d2Deposit;
    merged.todayBuyAmount += s.todayBuyAmount;
    merged.todaySellAmount += s.todaySellAmount;
  }

  merged.totalEvalProfitRate =
    merged.totalPurchaseAmount > 0
      ? (merged.totalEvalProfit / merged.totalPurchaseAmount) * 100
      : 0;

  return merged;
}

export async function fetchAllAccountsBalance(): Promise<MultiAccountBalanceData> {
  const accounts = getAccountConfigs();

  const results = await Promise.allSettled(
    accounts.map((account) => fetchAllBalance(account))
  );

  const accountsData: AccountBalanceData[] = [];
  const allHoldings: StockHolding[] = [];
  const allSummaries: AccountSummary[] = [];

  results.forEach((result, index) => {
    const account = accounts[index];
    if (result.status === 'fulfilled') {
      const data = result.value;
      accountsData.push({
        accountId: account.id,
        accountLabel: account.label,
        holdings: data.holdings,
        summary: data.summary,
      });
      allHoldings.push(...data.holdings);
      allSummaries.push(data.summary);
    } else {
      console.error(`[KIS] Failed to fetch balance for ${account.label}:`, result.reason);
      accountsData.push({
        accountId: account.id,
        accountLabel: account.label,
        holdings: [],
        summary: {
          totalDeposit: 0,
          totalEvaluation: 0,
          totalPurchaseAmount: 0,
          totalEvalProfit: 0,
          totalEvalProfitRate: 0,
          d1Deposit: 0,
          d2Deposit: 0,
          todayBuyAmount: 0,
          todaySellAmount: 0,
          accountId: account.id,
          accountLabel: account.label,
        },
        error: result.reason?.message || 'Unknown error',
      });
    }
  });

  return {
    accounts: accountsData,
    merged: {
      holdings: allHoldings,
      summary: mergeSummaries(allSummaries),
    },
  };
}
