import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { isInviteValid, markInviteUsed } from '@/lib/invite-store';
import { getUserByNickname, saveUser, encryptKisAccount } from '@/lib/user-store';
import { createSession, SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/session';
import type { User, DecryptedKisAccount } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const { inviteCode, nickname, password, kisAccounts } = await request.json();

    // 입력 검증
    if (!inviteCode || !nickname || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '모든 필드를 입력해주세요' } },
        { status: 400 },
      );
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '닉네임은 2~20자여야 합니다' } },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '비밀번호는 8자 이상이어야 합니다' } },
        { status: 400 },
      );
    }

    // 초대 코드 검증
    const { valid, reason } = await isInviteValid(inviteCode);
    if (!valid) {
      // 디버깅용 로그 (Vercel Functions 탭에서 확인 가능)
      console.error('[register] invite check failed:', {
        provided: JSON.stringify(inviteCode),
        adminCodeSet: !!process.env.ADMIN_INVITE_CODE,
        adminCodeLength: process.env.ADMIN_INVITE_CODE?.length,
        trimMatch: inviteCode.trim() === process.env.ADMIN_INVITE_CODE?.trim(),
        reason,
      });
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INVITE', message: reason ?? '유효하지 않은 초대 코드입니다' } },
        { status: 400 },
      );
    }

    // 닉네임 중복 확인
    const existing = await getUserByNickname(nickname);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NICKNAME_TAKEN', message: '이미 사용 중인 닉네임입니다' } },
        { status: 400 },
      );
    }

    // 관리자 여부 결정 (trim() 일치 기준)
    const isAdmin = inviteCode.trim() === process.env.ADMIN_INVITE_CODE?.trim();

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // KIS 자격증명 암호화
    const encryptedAccounts = (kisAccounts ?? []).map((a: DecryptedKisAccount) =>
      encryptKisAccount({ ...a, id: uuidv4() }),
    );

    // 사용자 저장
    const user: User = {
      id: userId,
      nickname,
      passwordHash,
      createdAt: new Date().toISOString(),
      isAdmin,
      kisAccounts: encryptedAccounts,
    };
    await saveUser(user);

    // 초대 코드 사용 처리 (관리자 코드는 재사용 가능)
    if (!isAdmin) {
      await markInviteUsed(inviteCode, userId);
    }

    // 세션 생성
    const sessionId = await createSession(userId);

    const response = NextResponse.json({
      success: true,
      data: { nickname, isAdmin },
    });
    response.cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('[auth/register]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
