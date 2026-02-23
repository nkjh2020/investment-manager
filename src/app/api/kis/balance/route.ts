import { NextRequest, NextResponse } from 'next/server';
import { fetchAllAccountsBalanceForUser, fetchAllBalanceForUser } from '@/lib/kis-client';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (accountId) {
      const data = await fetchAllBalanceForUser(userId, accountId);
      return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
    }

    const data = await fetchAllAccountsBalanceForUser(userId);
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Balance inquiry failed';
    const isTokenError = message.includes('Token') || message.includes('401');
    const code = isTokenError ? 'KIS_TOKEN_EXPIRED' : 'KIS_API_ERROR';

    return NextResponse.json(
      { success: false, error: { code, message, retryAfter: isTokenError ? 3 : undefined } },
      { status: isTokenError ? 401 : 500 },
    );
  }
}
