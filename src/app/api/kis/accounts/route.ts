import { NextResponse } from 'next/server';
import { getAccountConfigs, maskAccountNo } from '@/lib/account-config';
import type { AccountInfo } from '@/types/account';

export async function GET() {
  try {
    const accounts = getAccountConfigs();

    const accountInfos: AccountInfo[] = accounts.map((a) => ({
      id: a.id,
      label: a.label,
      accountNoMasked: maskAccountNo(a.accountNo, a.productCode),
    }));

    return NextResponse.json({
      success: true,
      data: accountInfos,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load accounts';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ACCOUNT_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
