import { kv, inviteKey } from './kv';
import type { Invite } from '@/types/auth';

const INVITE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30일

export async function getInvite(code: string): Promise<Invite | null> {
  return kv.get<Invite>(inviteKey(code));
}

export async function createInvite(
  code: string,
  createdBy: string,
  expiresInDays = 7,
): Promise<Invite> {
  const invite: Invite = {
    code,
    createdBy,
    expiresAt: new Date(Date.now() + expiresInDays * 86_400_000).toISOString(),
    isUsed: false,
  };
  await kv.set(inviteKey(code), invite, { ex: INVITE_TTL_SECONDS });
  return invite;
}

export async function markInviteUsed(code: string, usedBy: string): Promise<void> {
  const invite = await getInvite(code);
  if (!invite) throw new Error('Invite not found');
  const updated: Invite = {
    ...invite,
    isUsed: true,
    usedBy,
    usedAt: new Date().toISOString(),
  };
  await kv.set(inviteKey(code), updated);
}

export async function isInviteValid(
  code: string,
): Promise<{ valid: boolean; reason?: string }> {
  // 관리자 초대 코드는 환경변수에서 직접 확인 (재사용 가능)
  if (code === process.env.ADMIN_INVITE_CODE) {
    return { valid: true };
  }

  const invite = await getInvite(code);
  if (!invite) return { valid: false, reason: '유효하지 않은 초대 코드입니다' };
  if (invite.isUsed) return { valid: false, reason: '이미 사용된 초대 코드입니다' };
  if (new Date(invite.expiresAt) < new Date()) return { valid: false, reason: '만료된 초대 코드입니다' };

  return { valid: true };
}
