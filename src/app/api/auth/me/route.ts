import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { toPublicUser } from '@/lib/user-store';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHENTICATED' } },
      { status: 401 },
    );
  }
  return NextResponse.json({ success: true, data: toPublicUser(user) });
}
