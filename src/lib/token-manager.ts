import type { KisToken, KisTokenResponse } from '@/types/kis';
import type { AccountConfig } from '@/types/account';

const KIS_API_BASE_URL = process.env.KIS_API_BASE_URL || 'https://openapi.koreainvestment.com:9443';

// 계좌별 토큰 캐시: appKey 기반 (같은 appKey를 쓰는 계좌는 토큰 공유)
const tokenCache = new Map<string, KisToken>();

function isTokenExpired(token: KisToken): boolean {
  const elapsed = Date.now() - token.issuedAt;
  const expiresMs = token.expiresIn * 1000;
  // 만료 1시간 전에 갱신 (23시간 경과 시)
  return elapsed >= expiresMs - 3600 * 1000;
}

export async function getToken(account: AccountConfig): Promise<KisToken> {
  const cacheKey = account.appKey;
  const cached = tokenCache.get(cacheKey);

  if (cached && !isTokenExpired(cached)) {
    return cached;
  }

  const response = await fetch(`${KIS_API_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: account.appKey,
      appsecret: account.appSecret,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[KIS Token Error] account=${account.id}`, response.status, response.statusText, errorBody);
    throw new Error(`Token issuance failed for ${account.label}: ${response.status} - ${errorBody}`);
  }

  const data: KisTokenResponse = await response.json();

  const token: KisToken = {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    issuedAt: Date.now(),
  };

  tokenCache.set(cacheKey, token);
  return token;
}

export function clearToken(appKey?: string): void {
  if (appKey) {
    tokenCache.delete(appKey);
  } else {
    tokenCache.clear();
  }
}
