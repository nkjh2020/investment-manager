import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByNickname } from '@/lib/user-store';
import { createSession, SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '닉네임과 비밀번호를 입력해주세요' } },
        { status: 400 },
      );
    }

    const user = await getUserByNickname(nickname);

    // 타이밍 공격 방지: 사용자 없어도 bcrypt 실행
    const hashToCompare = user?.passwordHash ?? '$2b$12$invalidhashfortimingprotection0000000000';
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: '닉네임 또는 비밀번호가 올바르지 않습니다' } },
        { status: 401 },
      );
    }

    const sessionId = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      data: { nickname: user.nickname, isAdmin: user.isAdmin },
    });
    response.cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('[auth/login]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
