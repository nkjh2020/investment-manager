'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const AUTH_PATHS = new Set(['/login', '/register']);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-safe">{children}</main>
    </div>
  );
}
