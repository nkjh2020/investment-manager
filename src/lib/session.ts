import { randomBytes } from 'crypto';
import { kv, sessionKey } from './kv';
import type { Session } from '@/types/auth';

export const SESSION_COOKIE = 'im_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7일

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: SESSION_TTL_SECONDS,
  path: '/',
};

/** 새 세션 생성 후 sessionId 반환 */
export async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  const session: Session = {
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await kv.set(sessionKey(sessionId), session, { ex: SESSION_TTL_SECONDS });
  return sessionId;
}

/** sessionId로 세션 조회 */
export async function getSession(sessionId: string): Promise<Session | null> {
  return kv.get<Session>(sessionKey(sessionId));
}

/** 세션 삭제 (로그아웃) */
export async function deleteSession(sessionId: string): Promise<void> {
  await kv.del(sessionKey(sessionId));
}
