import type { AccountConfig } from '@/types/account';

let cachedAccounts: AccountConfig[] | null = null;

export function getAccountConfigs(): AccountConfig[] {
  if (cachedAccounts) return cachedAccounts;

  const raw = process.env.KIS_ACCOUNTS || '';

  if (!raw) {
    // 하위 호환: 단일 계좌 env 변수 지원
    const appKey = process.env.KIS_APP_KEY || '';
    const appSecret = process.env.KIS_APP_SECRET || '';
    const accountNo = process.env.KIS_ACCOUNT_NO || '';
    const productCode = process.env.KIS_ACCOUNT_PRODUCT || '01';

    if (appKey && accountNo) {
      cachedAccounts = [
        {
          id: 'default',
          label: `${accountNo}-${productCode}`,
          appKey,
          appSecret,
          accountNo,
          productCode,
        },
      ];
      return cachedAccounts;
    }

    throw new Error('No account configuration found. Set KIS_ACCOUNTS or KIS_APP_KEY in .env.local');
  }

  try {
    // JSON 문자열에서 따옴표 처리
    const cleaned = raw.replace(/^['"]|['"]$/g, '');
    cachedAccounts = JSON.parse(cleaned) as AccountConfig[];

    if (!Array.isArray(cachedAccounts) || cachedAccounts.length === 0) {
      throw new Error('KIS_ACCOUNTS must be a non-empty JSON array');
    }

    return cachedAccounts;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`KIS_ACCOUNTS JSON parse error: ${e.message}`);
    }
    throw e;
  }
}

export function getAccountConfig(accountId: string): AccountConfig {
  const accounts = getAccountConfigs();
  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }
  return account;
}

export function maskAccountNo(accountNo: string, productCode: string): string {
  const masked = '****' + accountNo.slice(-4);
  return `${masked}-${productCode}`;
}
