import { cookies } from 'next/headers';
import { getSession, SESSION_COOKIE } from './session';
import { getUserById } from './user-store';
import type { User } from '@/types/auth';

/** 현재 요청의 사용자 반환 (미인증 시 null) */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;

  return getUserById(session.userId);
}

/** 인증 필수 — 미인증 시 에러 throw */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

/** 관리자 필수 — 미인증 또는 비관리자 시 에러 throw */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error('Forbidden');
  return user;
}
