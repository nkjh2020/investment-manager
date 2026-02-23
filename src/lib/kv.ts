import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 (Vercel KV 마이그레이션 후 환경변수 이름 동일)
export const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Redis 키 네임스페이스 헬퍼
export const userKey = (userId: string) => `user:${userId}`;
export const nicknameKey = (nickname: string) => `nickname:${nickname.toLowerCase()}`;
export const sessionKey = (sessionId: string) => `session:${sessionId}`;
export const inviteKey = (code: string) => `invite:${code}`;
