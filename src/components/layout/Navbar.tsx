'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/providers/AuthProvider';

const navItems = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/rebalancing', label: '리밸런싱' },
  { href: '/settings', label: '설정' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white pt-safe dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900 dark:text-white">
            투자매니저
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin/invites"
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === '/admin/invites'
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-200'
                )}
              >
                초대코드
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.nickname}
            </span>
          )}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
