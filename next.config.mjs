import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  // Turbopack 명시적 설정 (Next.js 16 기본값, webpack 충돌 방지)
  turbopack: {},
});

export default nextConfig;
