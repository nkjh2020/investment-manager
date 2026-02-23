import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import AppLayout from '@/components/layout/AppLayout';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '투자 매니저',
  description: '한국투자증권 Open API 기반 투자 포트폴리오 관리',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '투자매니저',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1d4ed8',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <AppLayout>{children}</AppLayout>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
