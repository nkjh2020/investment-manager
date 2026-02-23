import { NextRequest, NextResponse } from 'next/server';
import { fetchAllBalance, fetchAllAccountsBalance } from '@/lib/kis-client';
import { getAccountConfig } from '@/lib/account-config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // 특정 계좌만 조회
      const account = getAccountConfig(accountId);
      const data = await fetchAllBalance(account);
      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    // 전체 계좌 통합 조회
    const data = await fetchAllAccountsBalance();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Balance inquiry failed';

    const isTokenError = message.includes('Token') || message.includes('401');
    const code = isTokenError ? 'KIS_TOKEN_EXPIRED' : 'KIS_API_ERROR';

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          retryAfter: isTokenError ? 3 : undefined,
        },
      },
      { status: isTokenError ? 401 : 500 }
    );
  }
}
