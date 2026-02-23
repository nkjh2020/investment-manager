import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/auth-helpers';
import { createInvite } from '@/lib/invite-store';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const expiresInDays = body.expiresInDays ?? 7;

    const code = randomBytes(12).toString('hex'); // 24자 랜덤 코드
    const invite = await createInvite(code, admin.id, expiresInDays);

    return NextResponse.json({ success: true, data: invite });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message: msg } },
      { status },
    );
  }
}
