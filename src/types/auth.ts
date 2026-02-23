// KV에 암호화된 형태로 저장되는 KIS 자격증명
export interface KisAccountCredential {
  id: string;
  label: string;
  appKey: string;     // AES-256-GCM 암호화: "iv:tag:ciphertext" (hex)
  appSecret: string;  // AES-256-GCM 암호화: "iv:tag:ciphertext" (hex)
  accountNo: string;  // 평문
  productCode: string; // 평문
}

// KV에 저장되는 사용자 레코드
export interface User {
  id: string;
  nickname: string;
  passwordHash: string; // bcrypt
  createdAt: string;
  isAdmin: boolean;
  kisAccounts: KisAccountCredential[];
}

// KV에 저장되는 세션 레코드
export interface Session {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// KV에 저장되는 초대 코드 레코드
export interface Invite {
  code: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: string;
  expiresAt: string;
  isUsed: boolean;
}

// 클라이언트에 반환하는 안전한 사용자 정보 (비밀번호 해시 제외, KIS 자격증명 마스킹)
export interface PublicUser {
  id: string;
  nickname: string;
  isAdmin: boolean;
  kisAccounts: PublicKisAccount[];
}

export interface PublicKisAccount {
  id: string;
  label: string;
  accountNo: string;
  productCode: string;
  accountNoMasked: string; // "****1234-22" 형식
}

// 복호화된 KIS 자격증명 (서버 내부에서만 사용)
export interface DecryptedKisAccount {
  id: string;
  label: string;
  appKey: string;
  appSecret: string;
  accountNo: string;
  productCode: string;
}
