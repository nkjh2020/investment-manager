import { NextRequest, NextResponse } from 'next/server';
import { getUserById, toPublicUser } from '@/lib/user-store';

export async function GET(request: NextRequest) {
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

    const accounts = toPublicUser(user).kisAccounts.map((a) => ({
      id: a.id,
      label: a.label,
      accountNoMasked: a.accountNoMasked,
    }));

    return NextResponse.json({
      success: true,
      data: accounts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load accounts';
    return NextResponse.json(
      { success: false, error: { code: 'ACCOUNT_ERROR', message } },
      { status: 500 },
    );
  }
}
