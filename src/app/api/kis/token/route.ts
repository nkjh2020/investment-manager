import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/token-manager';
import { getUserById, decryptKisAccount } from '@/lib/user-store';
import type { AccountConfig } from '@/types/account';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND' } },
        { status: 404 },
      );
    }

    const accounts: AccountConfig[] = user.kisAccounts.map(decryptKisAccount);

    const results = await Promise.allSettled(
      accounts.map((account) => getToken(account)),
    );

    const tokens = results.map((result, index) => ({
      accountId: accounts[index].id,
      accountLabel: accounts[index].label,
      success: result.status === 'fulfilled',
      tokenType: result.status === 'fulfilled' ? result.value.tokenType : undefined,
      expiresIn: result.status === 'fulfilled' ? result.value.expiresIn : undefined,
      error: result.status === 'rejected' ? (result.reason as Error)?.message : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: { tokens },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token issuance failed';
    return NextResponse.json(
      { success: false, error: { code: 'KIS_TOKEN_ERROR', message } },
      { status: 500 },
    );
  }
}
