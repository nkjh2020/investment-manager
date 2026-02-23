import { kv, userKey, nicknameKey } from './kv';
import { encrypt, decrypt } from './encryption';
import type { User, KisAccountCredential, PublicUser, DecryptedKisAccount } from '@/types/auth';

// ─── 조회 ─────────────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<User | null> {
  return kv.get<User>(userKey(userId));
}

export async function getUserByNickname(nickname: string): Promise<User | null> {
  const userId = await kv.get<string>(nicknameKey(nickname));
  if (!userId) return null;
  return getUserById(userId);
}

// ─── 저장 ─────────────────────────────────────────────────────────────────

export async function saveUser(user: User): Promise<void> {
  await kv.set(userKey(user.id), user);
  await kv.set(nicknameKey(user.nickname), user.id);
}

// ─── 암호화/복호화 ────────────────────────────────────────────────────────

/** KIS 자격증명 암호화 (KV 저장 전) */
export function encryptKisAccount(raw: DecryptedKisAccount): KisAccountCredential {
  return {
    id: raw.id,
    label: raw.label,
    appKey: encrypt(raw.appKey),
    appSecret: encrypt(raw.appSecret),
    accountNo: raw.accountNo,
    productCode: raw.productCode,
  };
}

/** KIS 자격증명 복호화 (KIS API 호출 전) */
export function decryptKisAccount(encrypted: KisAccountCredential): DecryptedKisAccount {
  return {
    id: encrypted.id,
    label: encrypted.label,
    appKey: decrypt(encrypted.appKey),
    appSecret: decrypt(encrypted.appSecret),
    accountNo: encrypted.accountNo,
    productCode: encrypted.productCode,
  };
}

// ─── 공개 정보 변환 ───────────────────────────────────────────────────────

function maskAccountNo(accountNo: string, productCode: string): string {
  const masked = '****' + accountNo.slice(-4);
  return `${masked}-${productCode}`;
}

/** 클라이언트에 반환할 안전한 사용자 정보 (비밀번호 해시, KIS 자격증명 제외) */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    nickname: user.nickname,
    isAdmin: user.isAdmin,
    kisAccounts: user.kisAccounts.map((a) => ({
      id: a.id,
      label: a.label,
      accountNo: a.accountNo,
      productCode: a.productCode,
      accountNoMasked: maskAccountNo(a.accountNo, a.productCode),
    })),
  };
}
