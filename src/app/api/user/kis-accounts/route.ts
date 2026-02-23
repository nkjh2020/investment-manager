import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth-helpers';
import { getUserById, saveUser, encryptKisAccount, toPublicUser } from '@/lib/user-store';
import type { DecryptedKisAccount } from '@/types/auth';

// GET: 사용자의 KIS 계좌 목록 (마스킹된 공개 정보)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: toPublicUser(user).kisAccounts });
}

// POST: 새 KIS 계좌 추가 (기존 계좌 유지)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { label, appKey, appSecret, accountNo, productCode } = body as DecryptedKisAccount;

    if (!label || !appKey || !appSecret || !accountNo || !productCode) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '모든 필드를 입력해주세요' } },
        { status: 400 },
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const newEncrypted = encryptKisAccount({ id: uuidv4(), label, appKey, appSecret, accountNo, productCode });
    const updatedAccounts = [...user.kisAccounts, newEncrypted];

    await saveUser({ ...user, kisAccounts: updatedAccounts });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[user/kis-accounts POST]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '저장 중 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// DELETE: KIS 계좌 삭제 (쿼리 파라미터: ?id=...)
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'id 파라미터가 필요합니다' } },
        { status: 400 },
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const updatedAccounts = user.kisAccounts.filter((a) => a.id !== accountId);

    if (updatedAccounts.length === user.kisAccounts.length) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '해당 계좌를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    await saveUser({ ...user, kisAccounts: updatedAccounts });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[user/kis-accounts DELETE]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '삭제 중 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// PUT: 사용자의 KIS 계좌 전체 교체 (레거시, 하위호환용)
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  try {
    const { accounts } = await request.json();

    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'accounts 배열이 필요합니다' } },
        { status: 400 },
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // 기존 계좌 맵 (id → 암호화된 계좌)
    const existingMap = new Map(user.kisAccounts.map((a) => [a.id, a]));

    const encrypted = (accounts as DecryptedKisAccount[]).map((a) => {
      const id = a.id || uuidv4();
      // appKey가 비어 있으면 기존 암호화된 값 유지
      if (!a.appKey && existingMap.has(id)) {
        return existingMap.get(id)!;
      }
      return encryptKisAccount({ ...a, id });
    });

    await saveUser({ ...user, kisAccounts: encrypted });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[user/kis-accounts PUT]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '저장 중 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
