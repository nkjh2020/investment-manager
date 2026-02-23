'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/rebalancing', label: '리밸런싱' },
  { href: '/settings', label: '설정' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white pt-safe dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
            Investment Manager
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
          </div>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
