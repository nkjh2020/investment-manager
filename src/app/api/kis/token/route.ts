import { NextResponse } from 'next/server';
import { getToken } from '@/lib/token-manager';
import { getAccountConfigs } from '@/lib/account-config';

export async function POST() {
  try {
    const accounts = getAccountConfigs();

    // 모든 계좌의 토큰을 발급 (같은 appKey는 공유됨)
    const results = await Promise.allSettled(
      accounts.map((account) => getToken(account))
    );

    const tokens = results.map((result, index) => ({
      accountId: accounts[index].id,
      accountLabel: accounts[index].label,
      success: result.status === 'fulfilled',
      tokenType: result.status === 'fulfilled' ? result.value.tokenType : undefined,
      expiresIn: result.status === 'fulfilled' ? result.value.expiresIn : undefined,
      error: result.status === 'rejected' ? result.reason?.message : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: { tokens },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token issuance failed';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KIS_TOKEN_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
