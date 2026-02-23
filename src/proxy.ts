import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { Session } from '@/types/auth';

// 인증 불필요 경로
const PUBLIC_PATHS = new Set(['/login', '/register']);
const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
]);
const STATIC_PREFIXES = ['/_next', '/icons', '/fonts', '/manifest.json', '/favicon', '/sw.js', '/workbox-'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get('im_session')?.value;

  if (!sessionId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 미들웨어에서 직접 Redis 호출 (auth-helpers는 Server Components용)
    const redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });

    const session = await redis.get<Session>(`session:${sessionId}`);

    if (!session || new Date(session.expiresAt) < new Date()) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json(
            { success: false, error: { code: 'SESSION_EXPIRED' } },
            { status: 401 },
          )
        : NextResponse.redirect(new URL('/login', request.url));

      response.cookies.set('im_session', '', { maxAge: 0, path: '/' });
      return response;
    }

    // userId를 다음 핸들러(API 라우트)에 헤더로 전달
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    console.error('[middleware] Redis error:', error);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE' } },
        { status: 503 },
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    // 정적 파일 확장자 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
